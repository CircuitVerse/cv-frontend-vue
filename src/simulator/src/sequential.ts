import { simulationArea } from './simulationArea';

/**
 * a global function as a helper for simulationArea.changeClockEnable
 * @param {boolean} val - is clock enabled.
 * @category sequential
 */
export function changeClockEnable(val) {
  simulationArea.clockEnabled = val;
}
