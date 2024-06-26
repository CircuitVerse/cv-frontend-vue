import { scheduleUpdate, play, updateCanvasSet } from './engine'
import simulationArea from './simulationArea'
import { clockTick } from './utils'

/**
 * a global function as a helper for simulationArea.changeClockEnable
 */
export function changeClockEnable(val: boolean) {
    simulationArea.clockEnabled = val
}

/**
 * WIP function defined and used
 */
export function runTest(n = 10) {
    var t = new Date().getTime()
    for (var i = 0; i < n; i++) {
        clockTick()
    }
    updateCanvasSet(true)
    play()
    scheduleUpdate()
}
