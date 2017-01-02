/* global WebSocket */

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
  HELLO_WORLD: '/hello-world/',
  AUTOCOMPLETE: '/autocomplete/'
};

/**
 * @constructor
 */
const ExampleClient = function() {
  MultiWebsocket.Client.call(this);
};

ExampleClient.prototype = Object.extend(MultiWebsocket.Client);

/**
 * @method helloWorld
 * @return {Promise}
 * @public
*/
ExampleClient.prototype.helloWorld = function() {
  return this.callService(methods.HELLO_WORLD);
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
  return callService(methods.AUTOCOMPLETE, query);
};

// Example's code, connect to the client and perform requests to the
// 2 services.
ExampleClient.connect()
.then(() => {
  console.log(ExampleClient.helloWorld());
})
.catch((e) => {
  console.log(e);
});
