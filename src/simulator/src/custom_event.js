/**
 * Register a handler for a named custom event
 * @param {string} eventName - arbitrary name of an event.
 * @param {function} handler - function to handle the event.
 */
export function registerEventHandler(eventName, handler) {
  document.addEventListener(eventName, handler);
}

/**
 * Raise event, and fires the handler.
 * @param {*} eventName - arbitrary name of an event.
 * @param {any} content - payload
 */
export function raiseEvent(eventName, content) {
  document.dispatchEvent(new CustomEvent(eventName, content));
}
