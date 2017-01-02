'use strict';

/**
 * Stores event identifiers for the MultiWebsocket clients
 *
 * @module MultiWebsocket.Event
 * @namespace MultiWebsocket
 */
const Event = {
  APPLICATION_ERROR: 'application-error',
  RESPONSE_COMPLETE: 'service-response-complete',
  DISCOVERY: 'discovery',
  SERVICE_CALL: 'service-call',
  Websocket: {
    ERROR: 'websocket-error',
    CLOSED: 'websocket-closed'
  }
};

module.exports = Event;
