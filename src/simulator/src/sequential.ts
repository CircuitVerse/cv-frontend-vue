

/**
 * a global function as a helper for globalScope.simulationArea.changeClockEnable
 * @param {boolean} val - is clock enabled.
 * @category sequential
 */
export function changeClockEnable(val) {
  globalScope.simulationArea.clockEnabled = val;
}
