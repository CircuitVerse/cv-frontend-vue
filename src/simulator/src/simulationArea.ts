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
        simulationArea.canvas = document.getElementById('simulationArea') as HTMLCanvasElement;
        simulationArea.canvas.width = width;
        simulationArea.canvas.height = height;
        simulationArea.simulationQueue = new EventQueue(10000);
        simulationArea.context = simulationArea.canvas.getContext('2d')!;
        simulationArea.changeClockTime(simulationArea.timePeriod);
        simulationArea.mouseDown = false;
    },
    changeClockTime(t: number) {
        if (t < 50) {
            return;
        }

        if (!simulationArea._debouncedChangeClockTime) {
            simulationArea._debouncedChangeClockTime = debounce((time: number) => {
                if (simulationArea.ClockInterval != null) {
                    clearInterval(simulationArea.ClockInterval);
                }
                simulationArea.ClockInterval = setInterval(clockTick, time)
            }, 300)
        }

        simulationArea.timePeriod = t
        if (simulationArea._debouncedChangeClockTime) {
            simulationArea._debouncedChangeClockTime(t)
        }
    },
    clear() {
        if (!simulationArea.context) {
            return;
        }
        simulationArea.context.clearRect(0, 0, simulationArea.canvas.width, simulationArea.canvas.height);
    },
};
export { simulationArea }
export const { changeClockTime } = simulationArea