import { simulationArea } from './simulationArea'

/**
 * a global function as a helper for simulationArea.changeClockEnable
 */
export function changeClockEnable(val: boolean) {
    simulationArea.clockEnabled = val
}
