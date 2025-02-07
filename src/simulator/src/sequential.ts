import { simulationArea } from './simulationArea';

/**
 * A global function as a helper for simulationArea.changeClockEnable
 * @param val - The new value for clockEnabled.
 * @category sequential
 */
export function changeClockEnable(val: boolean): void {
    simulationArea.clockEnabled = val;
}