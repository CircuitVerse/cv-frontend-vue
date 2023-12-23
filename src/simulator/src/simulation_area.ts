import { CircuitElement } from './circuit_element';
import { EventQueue } from './event_queue';
import { clockTick } from './utils_clock';

/**
 * simulation environment object - holds simulation canvas
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
 * @property {boolean} controlDown - control down or not
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
 * @category SimulationArea
 */
export class SimulationArea {
  public canvas: HTMLCanvasElement;
  public context: CanvasRenderingContext2D;
  public selected: boolean = false;
  public hover: boolean = false;
  public clockState: number = 0;
  public clockEnabled: boolean = true;
  public lastSelected?: CircuitElement;
  // public stack: any = [];
  public prevScale: number = 0;
  public oldX: number = 0;
  public oldY: number = 0;
  public objectList: CircuitElement[] = [];
  public maxHeight: number = 0;
  public maxWidth: number = 0;
  public minHeight: number = 0;
  public minWidth: number = 0;
  public multipleObjectSelections: CircuitElement[] = [];
  public copyList: CircuitElement[] = [];
  public shiftDown: boolean = false;
  public controlDown: boolean = false;
  public timePeriod: number = 500;
  public mouseX: number = 0;
  public mouseY: number = 0;
  public mouseDownX: number = 0;
  public mouseDownY: number = 0;
  public simulationQueue: any;
  static ClockInterval?: NodeJS.Timeout = undefined;
  public clickCount: number = 0;
  public lock: string = 'unlocked';
  public mouseDown: boolean = false;

  /**
   *
   */
  timer() {
    setTimeout(() => {
      this.clickCount = 0;
    }, 600);
  }

  /**
   * @param {HTMLElement} canvasArea
   */
  constructor(canvasArea?: HTMLElement) {
    if (canvasArea) {
      const existing = canvasArea!.getElementsByClassName('simulationArea');
      if (existing.length === 0) {
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'absolute';
        this.canvas.style.left = '0';
        this.canvas.style.top = '0';
        this.canvas.style.zIndex = '1';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.className = 'simulationArea';
        canvasArea.appendChild(this.canvas);
      } else {
        this.canvas = <HTMLCanvasElement>existing[0];
      }
      this.context = this.canvas.getContext('2d')!;
    }
    this.simulationQueue = new EventQueue(10000);
    this.changeClockTime(this.timePeriod);
    this.mouseDown = false;
  }

  /**
   *
   * @param {number} t
   */
  changeClockTime(t: number) {
    if (t < 50) {
      return;
    }
    clearInterval(SimulationArea.ClockInterval);
    this.timePeriod = t;
    SimulationArea.ClockInterval = setInterval(clockTick, t);
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
