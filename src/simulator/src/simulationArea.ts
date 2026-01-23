import { EventQueue } from './eventQueue'
import { SimulationArea } from './interface/simulationArea'
import { clockTick } from './utils'
import { debounce } from './utils/debounce'

declare var width: number
declare var height: number

const simulationArea: SimulationArea = {
    canvas: document.getElementById('simulationArea') as HTMLCanvasElement,
    context: null,
    selected: false,
    hover: false,
    clockState: 0,
    clockEnabled: true,
    lastSelected: null,
    stack: [],
    prevScale: 0,
    oldx: 0,
    oldy: 0,
    objectList: [],
    maxHeight: 0,
    maxWidth: 0,
    minHeight: 0,
    minWidth: 0,
    multipleObjectSelections: [],
    copyList: [],
    shiftDown: false,
    controlDown: false,
    timePeriod: 500,
    mouseX: 0,
    mouseY: 0,
    mouseDownX: 0,
    mouseDownY: 0,
    simulationQueue: new EventQueue(10000),
    clickCount: 0,
    lock: 'unlocked',
    mouseDown: false,
    ClockInterval: null,
    touch: false,

    timer() {
        const clickTimer = setTimeout(() => {
            simulationArea.clickCount = 0
        }, 600)
    },
    setup() {
        this.canvas = document.getElementById('simulationArea') as HTMLCanvasElement;
        this.canvas.width = width;
        this.canvas.height = height;
        this.simulationQueue = new EventQueue(10000);
        this.context = this.canvas.getContext('2d')!;
        simulationArea.changeClockTime(simulationArea.timePeriod);
        this.mouseDown = false;
    },
    changeClockTime(t: number) {
        if (t < 50) {
            return;
        }

        if (!this._debouncedChangeClockTime) {
            this._debouncedChangeClockTime = debounce((time: number) => {
                if (simulationArea.ClockInterval != null) {
                    clearInterval(simulationArea.ClockInterval);
                }
                simulationArea.ClockInterval = setInterval(clockTick, time)
            }, 300)
        }

        simulationArea.timePeriod = t
        if (this._debouncedChangeClockTime) {
            this._debouncedChangeClockTime(t)
        }
    },
    clear() {
        if (!this.context) {
            return;
        }
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
};
export { simulationArea }
export const { changeClockTime } = simulationArea