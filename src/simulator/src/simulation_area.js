import {EventQueue} from './event_queue';
import {clockTick} from './utils_clock';

/**
 * simulation environment object - holds simulation canvas
 * @type {Object} simulationArea
 * @property {HTMLCanvasElement} canvas
 * @property {boolean} selected
 * @property {boolean} hover
 * @property {number} clockState
 * @property {boolean} clockEnabled
 * @property {undefined} lastSelected
 * @property {Array} stack
 * @property {number} prevScale
 * @property {number} oldX
 * @property {number} oldY
 * @property {Array} objectList
 * @property {number} maxHeight
 * @property {number} maxWidth
 * @property {number} minHeight
 * @property {number} minWidth
 * @property {Array} multipleObjectSelections
 * @property {Array} copyList - List of selected elements
 * @property {boolean} shiftDown - shift down or not
 * @property {boolean} controlDown - contol down or not
 * @property {number} timePeriod - time period
 * @property {number} mouseX - mouse x
 * @property {number} mouseY - mouse y
 * @property {number} mouseDownX - mouse click x
 * @property {number} mouseDownY - mouse click y
 * @property {Array} simulationQueue - simulation queue
 * @property {number} clickCount - number of clicks
 * @property {string} lock - locked or unlocked
 * @property {function} timer - timer
 * @property {function} setup - to setup the simulation area
 * @property {function} changeClockTime - change clock time
 * @property {function} clear - clear the simulation area
 * @category simulationArea
 */
export class SimulationArea {
  constructor() {
    this.canvas= document.getElementById('simulationArea');
    this.selected= false;
    this.hover= false;
    this.clockState= 0;
    this.clockEnabled= true;
    this.lastSelected= undefined;
    this.stack= [];
    this.prevScale= 0;
    this.oldX= 0;
    this.oldY= 0;
    this.objectList= [];
    this.maxHeight= 0;
    this.maxWidth= 0;
    this.minHeight= 0;
    this.minWidth= 0;
    this.multipleObjectSelections= [];
    this.copyList= [];
    this.shiftDown= false;
    this.controlDown= false;
    this.timePeriod= 500;
    this.mouseX= 0;
    this.mouseY= 0;
    this.mouseDownX= 0;
    this.mouseDownY= 0;
    this.simulationQueue= undefined;
    this.multiAddElement= false;
    this.ClockInterval= undefined;
    this.clickCount= 0;// double click
    this.lock= 'unlocked';
  }

  timer() {
    setTimeout(() => {
      simulationArea.clickCount = 0;
    }, 600);
  }

  setup() {
    this.canvas = document.getElementById('simulationArea');
    this.canvas.width = width;
    this.canvas.height = height;
    this.simulationQueue = new EventQueue(10000);
    this.context = this.canvas.getContext('2d');
    simulationArea.changeClockTime(simulationArea.timePeriod);
    this.mouseDown = false;
  }
  /**
   *
   * @param {*} t
   * @returns
   */
  changeClockTime(t) {
    if (t < 50) {
      return;
    }
    clearInterval(simulationArea.ClockInterval);
    t = t || prompt('Enter Time Period:');
    simulationArea.timePeriod = t;
    simulationArea.ClockInterval = setInterval(clockTick, t);
  }

  /**
   * Clears the simulation area canvas.
   */
  clear() {
    if (!this.context) {
      return;
    }
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

export const simulationArea = new SimulationArea();
export const {changeClockTime} = simulationArea;
