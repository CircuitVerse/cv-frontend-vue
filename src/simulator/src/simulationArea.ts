import { EventQueue } from './eventQueue'
import { SimulationArea } from './interface/simulationArea'
import { clockTick } from './utils'

const simulationArea: SimulationArea = {
    canvas: null,
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

    timer() {
        if (this.clockEnabled) {
            clockTick();
        }
        setTimeout(() => this.timer(), this.timePeriod);
    },

    setup() {
        this.canvas = document.getElementById('simulationArea') as HTMLCanvasElement;
        if (!this.canvas) {
            console.error('Simulation canvas not found');
            return;
        }
        
        this.context = this.canvas.getContext('2d');
        if (!this.context) {
            console.error('Could not get 2D context');
            return;
        }

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.timer();
    },

    changeClockTime(t: number) {
        if (t < 50) return;
        this.timePeriod = t;
        this.clockEnabled = true;
    },

    clear() {
        if (this.context && this.canvas) {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
};

export { simulationArea }
export const { changeClockTime } = simulationArea