/**
 * Lightweight EventBus implementation customized for the MultiWebsocket
 * client needs.
 *
 * @module MultiWebsocket.EventBus
 * @namespace MultiWebsocket
 */
const MultiWebsocket = (function(namespace) {
  'use strict';

  /**
   * @type {Object}
   */
  const EventBus = {
    /**
     * @type {Array} _listeners
     * @private
     */
    _listeners: {},

    /**
     * @param {String} eventId
     * @method subscribe
     * @public
     */
    trigger: (eventId, ...args) => {
      if (eventId in this._listeners) {
        this._listeners[eventId].forEach((listener) => {
          listener(...args);
        });
      }
    },

    /**
     * @param {String} eventId
     * @param {Function} callback
     * @method subscribe
     * @public
     */
    subscribe: (eventId, callback) => {
      if (!(eventId in this._listeners)) {
        this._listeners[eventId] = [];
      }

      this._listeners[eventId].push(callback);
    }
  };

  namespace.EventBus = EventBus; // eslint-disable-line no-param-reassign

  return namespace;
}(MultiWebsocket || {}));
