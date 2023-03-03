import EventQueue from '#/simulator/src/eventQueue'
import { clockTick } from '#/simulator/src/utils'

export const actions = {
    timer() {
        ckickTimer = setTimeout(() => {
            this.clickCount = 0
        }, 600)
    },

    setup() {
        this.canvas = document.getElementById('simulationArea')
        this.canvas.width = width
        this.canvas.height = height
        this.simulationQueue = new EventQueue(10000)
        this.context = this.canvas.getContext('2d')
        this.changeClockTime(this.timePeriod)
        this.mouseDown = false
    },
    changeClockTime(t) {
        if (t < 50) return
        clearInterval(this.ClockInterval)
        t = t || prompt('Enter Time Period:')
        this.timePeriod = t
        this.ClockInterval = setInterval(clockTick, t)
    },
    clear() {
        if (!this.context) return
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
    },
}
