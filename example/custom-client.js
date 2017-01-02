/* global MultiWebsocket */

'use strict';

/**
 * This file implements a basic example of how to extend the MultiWebsocket.Client
 * object in order to create a customized client for a API that it's multiplexed
 * via a common websocket channel.
 *
 * You can see an implementation of the server's side in the `server.js` file
 */

/**
 * This configuration object defines the current API methods.
 * They are implemented by the different service
 * instances. e.g. one service could provide entry points for some of them,
 * and that could evolve dynamically thanks to the service discovery layer.
 *
 * @type {Object} methods
 * @private
 */
const methods = {
  HELLO_WORLD: '/helloworld/',
  AUTOCOMPLETE: '/autocomplete/'
};

/**
 * @constructor
 */
const ExampleClient = function() {
  /**
   * @type {Object} config
   */
  this.config = {
    'service-discovery-url': 'http://localhost:7007/discover/'
  };

  MultiWebsocket.Client.call(this);
};

ExampleClient.prototype = Object.create(MultiWebsocket.Client.prototype);

/**
 * @method helloWorld
 * @return {Promise}
 * @public
*/
ExampleClient.prototype.helloWorld = function() {
  return this.callService(methods.HELLO_WORLD, {});
};

/**
 * The autocomplete method given a search query returns the list of
 * probable autocomplete strings (type ahead).
 *
 * @method autocomplete
 * @param {Object} query
 * @return {Promise}
 * @public
 */
ExampleClient.prototype.autocomplete = function(query) {
  return this.callService(methods.AUTOCOMPLETE, { query });
};

// Example's code, connect to the client and perform requests to the
// 2 services.
const client = new ExampleClient();
client.connect();

client.onReady(() => {
  window.setInterval(() => {
    client.helloWorld()
      .then((data) => { console.log(data); }); // eslint-disable-line no-console

    client.autocomplete('test-')
      .then((data) => { console.log(data); }); // eslint-disable-line no-console
  }, 1000);
});
