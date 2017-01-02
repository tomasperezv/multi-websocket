/*jslint node: true */
'use strict';

const SilexJS = require('@tomasperezv/silex.js')('example');

/**
 * @route /autocomplete/
 */
SilexJS.App.get('/autocomplete/{query,messageId}', (request) => {
  if (request.query === null || request.query.length < 3) {
    return [{}, SilexJS.HTTPCode.BAD_REQUEST];
  }

  // Mock autocomplete service
  const autocomplete = (query) => {
    const alpha = 'aeiou';
    const n = 5;
    let suffix = '';
    for (let i = 0; i < n; i++) {
      let pos = Math.floor(Math.random() * alpha.length);
      suffix += alpha[pos];
    }

    return `${query}${suffix}`;
  };

  return [{ result: autocomplete(request.query), id: request.messageId }, SilexJS.HTTPCode.OK];
});

/**
 * @route /hello-world/
 */
SilexJS.App.get('/helloworld/{messageId}', (request) => {
  return [{ result: 'Hello world!!!', id: request.messageId }, SilexJS.HTTPCode.OK];
});

/**
 * The Discovery service exposes only one method, called 'discover', that is used to
 * let the application clients to know the different services instances available,
 * as well as which methods they expose.
 *
 * This is a basic implementation, but a more advanced system would let each service to
 * register itself dynamically.
 * @route /discover/
 */
SilexJS.App.get('/discover/', () => {
  const promise = new Promise((resolve) => {
    const serviceDiscoveryData = JSON.stringify(SilexJS.config.services);
    resolve(SilexJS.config.services);
  });

  return promise;
});

SilexJS.start();
