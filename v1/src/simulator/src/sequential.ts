import { simulationArea } from "./simulationArea";

/**
 * a global function as a helper for simulationArea.changeClockEnable
 * @category sequential
 * @param val - boolean value to enable/disable clock
 */
export function changeClockEnable(val: boolean): void {
  simulationArea.clockEnabled = val;
}
