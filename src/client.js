/* global WebSocket, Promise */

/**
 * Implements the communication layer with the different custom services via the same
 * Websocket connection.
 *
 * Once the connection has been established, we don't need to perform more connections mitigating
 * latency delays.
 *
 * Some countermeasures to adapt to websocket disconnection events are in place.
 *
 * @module MultiWebsocket.Client
 * @namespace MultiWebsocket
 */
const MultiWebsocket = (function(namespace, config, eventBus) {
  'use strict';

  /**
   * Listeners of the different methods.
   * @type {Object} listeners
   */
  const listeners = {
    onmessage: {},
    onerror: {},
    onopen: {},
    onready: []
  };

  /**
   * Used to store the information taken from the service discovery
   * to identify which websocket to use from the connections pool.
   *
   * @type {Object|null} service
   */
  let methodServiceMap = null;

  /**
   * @type {Object} servicePath
   */
  const servicePath = {};

  /**
   * Each service has its own websocket object stored as an entry
   * in the websocket pool.
   * @type {Object} websocketPool
   */
  const websocketPool = {};

  /**
   * @type {Object} pathId
   */
  const pathId = {};

  /**
   * For each different service instance we will have a websocket, this method
   * is in charge of its initialization, attaching the needed listeners for handling
   * message, error and close events.
   *
   * @param {String} serviceId
   * @method initWebSocket
   * @private
   */
  const initWebSocket = (serviceId) => {
    const websocket = new WebSocket(servicePath[serviceId]);
    websocketPool[serviceId] = websocket;

    websocket.onmessage = (response) => {
      // Make sure the response is sent only to the right listener.
      const parsedResponse = JSON.parse(response.data);
      const messageId = parsedResponse.id;
      if (messageId && typeof listeners.onready[messageId] === 'function') {
        listeners.onready[messageId](parsedResponse.result);
        // We can recycle the listener since this message lifecycle is over.
        delete listeners.onready[messageId];
      }

      // Propagate a message so listeners are notified of the event
      eventBus.trigger('service-response-complete', serviceId, pathId[messageId]);
    };

    websocket.onopen = () => {
      for (const listenerId in listeners.onopen) {
        if (listeners.onopen.hasOwnProperty(listenerId)) {
          listeners.onopen[listenerId]();
        }
      }
    };

    websocket.onerror = (data) => {
      for (const listenerId in listeners.onerror) {
        if (listeners.onerror.hasOwnProperty(listenerId)) {
          listeners.onerror[listenerId](data);
        }
      }

      // Let other parts of the application be notified about the connectivity problems.
      eventBus.trigger('application-error', namespace.Error.WEBSOCKET_ERROR, serviceId);
    };

    websocket.onclose = () => {
      // Recycle the websocket so a new one is instantiated on the following method calls
      // This assures a graceful connection recovery on websocket disconnections.
      delete websocketPool[serviceId];
      eventBus.trigger('application-error', namespace.Error.WEBSOCKET_CLOSED, serviceId);
    };
  };

  /**
   * @param {Object} servicesInfo
   * @method parseServiceInfo
   * @private
   */
  const parseServiceInfo = (servicesInfo) => {
    methodServiceMap = {};
    for (const serviceId in servicesInfo) {
      servicePath[serviceId] = `ws://${servicesInfo[serviceId].host}:${servicesInfo[serviceId]['websocket-port']}`;
      if (servicesInfo.hasOwnProperty(serviceId)) {
        // Parse the information present in the property 'methods'
        // and store it on the methodServiceMap
        servicesInfo[serviceId].methods.forEach((method) => {
          methodServiceMap[method] = serviceId;
        });
      }
    }
  };

  /**
   * The service discovery is a fundamental step of the Client object,
   * the way the Websocket's multiplexing its designed requires to perform an initial
   * HTTP XMLHttp request to obtain the list of available services, their instances and
   * the information about how to connect to them via websocket (host, port, ..)
   *
   * This allows us to decouple the client side from the specific service instances, supporting
   * potential improvements like adding more instances of a specific service,
   * if needed without having to require a client side restart.
   *
   * @method discoverServices
   * @param {String} path
   * @private
   * @return {Promise}
   */
  const discoverServices = () => {
    const promise = new Promise((resolve, reject) => {
      const xmlhttp = new XMLHttpRequest();
      xmlhttp.onreadystatechange = () => {
        if (xmlhttp.readyState === XMLHttpRequest.DONE) {
          if (xmlhttp.status === 200) {
            try {
              parseServiceInfo(JSON.parse(xmlhttp.responseText));
              resolve();
            } catch (e) {
              reject(e);
            }
          } else {
            reject(xmlhttp.status);
          }
        }
      };

      xmlhttp.open('GET', config['service-discovery-url'], true);
      xmlhttp.send();
    });

    return promise;
  };

  /**
   * Every time a call to a service method is performed we check
   * if the websocket that contains the connection to the service is
   * already initialized, if it's not we will instantiate it.
   *
   * @param {String} path
   * @method getWebsocketFromPool
   * @return {Object}
   */
  const getWebsocketFromPool = (path) => {
    const serviceId = methodServiceMap[path];
    if (typeof websocketPool[serviceId] === 'undefined') {
      initWebSocket(serviceId);
    }
    return websocketPool[serviceId];
  };

  /**
   * @constructor
   */
  const Client = function() {
  };

  /**
   * Performs an API call to the remote API
   *
   * @method callService
   * @param {Object} message
   * @return promise
   * @private
   */
  Client.prototype.callService = function(path, message) {
    // Send the path information as an extra parameter
    message.wsPath = path; // eslint-disable-line no-param-reassign

    // Add message identifier, this allow us to identify which
    // listener to send each message. Yes, this potentiall could
    // lead to race conditions in its current implementation.
    const randomId = parseInt(Math.random() * 1000, 10);
    message.messageId = randomId; // eslint-disable-line no-param-reassign

    // Used to identify the path on message event
    pathId[randomId] = path;

    // Let app listeners to know about that we are initiating a service-call event
    eventBus.trigger('service-call', methodServiceMap[path], path, message.messageId);

    // Obtain the websocket from the pool of connections
    const websocket = getWebsocketFromPool(path);

    const promise = new Promise((resolve) => {
      listeners.onready[randomId] = function(response) {
        if (typeof response === 'undefined') {
          response = []; // eslint-disable-line no-param-reassign
        }
        resolve(response);
      };

      if (websocket.readyState === 1) {
        websocket.send(JSON.stringify(message));
      } else {
        listeners.onopen[randomId] = function() {
          websocket.send(JSON.stringify(message));
        };
      }
    });

    return promise;
  };

  /**
   * Used by the client application bootstrap to know when we have
   * all what we need to start communicating with the services.
   *
   * @param {Function} listener
   * @method onReady
   */
  Client.prototype.onReady = function(listener) {
    if (methodServiceMap === null) {
      listeners.onready.push(listener);
    } else {
      listener();
    }
  };

  /**
   * @method connect
   */
  Client.prototype.connect = function() {
    // Call to service discovery
    discoverServices().then(() => {
      listeners.onready.forEach((listener) => {
        listener();
      });
    }).catch(() => {
      eventBus.trigger('application-error', namespace.Error.SERVICE_DISCOVERY, config['service-discovery-url']);
    });
  };

  namespace.Client = new Client(); // eslint-disable-line no-param-reassign

  return namespace;
}(MultiWebsocket || {}, MultiWebsocket.Config, MultiWebsocket.EventBus));
