/**
 *
 */
export function registerEventHandler(eventName, handler) {
  document.addEventListener(eventName, handler);
}

/**
 *
 * @param {*} eventName
 * @param {*} content
 */
export function raiseEvent(eventName, content) {
  document.dispatchEvent(new CustomEvent(eventName, content));
}
