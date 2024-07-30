import { scheduleUpdate, play, updateCanvasSet } from './engine'
import { simulationArea } from './simulationArea'
import { clockTick } from './utils'

/**
 * a global function as a helper for simulationArea.changeClockEnable
 */
export function changeClockEnable(val: boolean) {
    simulationArea.clockEnabled = val
}
