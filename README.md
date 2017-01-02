# MultiWebsocket

This library provides a way to architect webservices that can be routed through the same websocket connection and
accessed from the client-side transparently.

Initially the client will perform a XMLHttpRequest to a discovery service that will be in charge of returning
a mapping that will define how to access to the different webservices and the address of the websocket gateway.

Once the service discovery is completed a websocket gateway is stablished and subsequent requests through the
`MultiWebsocket.client` object will be routed automatically.

`MultiWebsocket.client` exposes an interface based on `Promise` in order to ease code readability and maintainability.

## Example

An example project is located at the `example` folder:

First the example project must be setup:

```bash
cd ./example
npm install
```

The previous instruction will installed the required dependencies, after that you must run the server:

```bash
npm run start-server
```

The example server is implemented via [Silex.js](https://github.com/tomasperezv/silex.js) a custom node.js framework for developing RESTFUL webservices that can be exposed via websockets or HTTP that I've implemented.

This example server will be in charge of implementing the server side methods 'helloworld' and 'autocomplete' as well as 'discover'.

'discover' it's an internal method that it's used by the MultiWebsocket client side in order to resolve and route requests to the different endpoints.

Then you can run the client

```bash
npm run start-client
```

The client will be built via Webpack and will listen on http://localhost:9999/index.html, you can visit this URL to see the project in action.

Every second 2 requests via the Websocket Gateway will be performed.

## How to write a client

For writing a client you must extend the MultiWebsocket's Client object and define its configuration and different available methods:

```javascript
const methods = {
  HELLO_WORLD: '/helloworld/'
};

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

```

Now we need to connect to the Websocket's Gateway by using the `connect` method:

```javascript
ExampleClient.connect();
```

After calling to `connect` we can't perform requests right away cause the connection to the Webocket Gateway is asynchronous,
but we can be notified once the connection is ready via the `onReady` method:

```javascript
client.onReady(() => {
  client.helloWorld()
    .then((data) => { console.log(data); });
});
```

In the previous snippet, after the `onReady` event is triggered, we call to our custom webservice through the Websocket and use
the Promise returned to read the message from the server as a JSON object.
