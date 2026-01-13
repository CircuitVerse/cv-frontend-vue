import { scheduleUpdate, play, updateCanvasSet } from './engine'
import { simulationArea } from './simulationArea'

/**
 * A global function as a helper for simulationArea.changeClockEnable
 * @param val - Boolean value to enable/disable the clock
 * @category sequential
 */
export function changeClockEnable(val: boolean): void {
    simulationArea.clockEnabled = val
}