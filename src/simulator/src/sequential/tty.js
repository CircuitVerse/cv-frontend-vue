import {CircuitElement} from '../circuit_element';
import {Node, findNode} from '../node';
import {simulationArea} from '../simulation_area';
import {correctWidth, lineTo, moveTo, fillText3} from '../canvas_api';
import {colors} from '../themer/themer';

/**
 * TTY
 * TypeWriter - We can give 4 inputs:
 * clock and input of 7 bits are main input required
 * on the edge change the data is added onto the display
 * screen of the typewriter
 * @extends CircuitElement
 * @category sequential
 */
export class TTY extends CircuitElement {
  /**
   * @param {number} x - x coord of element
   * @param {number} y - y coord of element
   * @param {Scope} scope - the circuit in which we want the Element
   * @param {number} rows
   * @param {number} cols
   */
  constructor(x, y, scope = globalScope, rows = 3, cols = 32) {
    super(x, y, scope, 'RIGHT', 1);
    this.directionFixed = true;
    this.fixedBitWidth = true;
    this.cols = cols || parseInt(prompt('Enter cols:'));
    this.rows = rows || parseInt(prompt('Enter rows:'));

    this.elementWidth = Math.max(40, Math.ceil(this.cols / 2) * 20);
    this.elementHeight = Math.max(40, Math.ceil((this.rows * 15) / 20) * 20);
    this.setWidth(this.elementWidth / 2);
    this.setHeight(this.elementHeight / 2);

    this.clockInp = new Node(
        -this.elementWidth / 2,
        this.elementHeight / 2 - 10,
        0,
        this,
        1,
        'Clock',
    );
    this.asciiInp = new Node(
        -this.elementWidth / 2,
        this.elementHeight / 2 - 30,
        0,
        this,
        7,
        'Ascii Input',
    );
    // this.qOutput = new Node(20, -10, 1, this);
    this.reset = new Node(
        30 - this.elementWidth / 2,
        this.elementHeight / 2,
        0,
        this,
        1,
        'Reset',
    );
    this.en = new Node(
        10 - this.elementWidth / 2,
        this.elementHeight / 2,
        0,
        this,
        1,
        'Enable',
    );
    // this.masterState = 0;
    // this.slaveState = 0;
    this.prevClockState = 0;

    this.data = '';
    this.buffer = '';
  }

  /**
   * @memberof TTY
   * this funciton is used to change the size of the screen
   */
  changeRowSize(size) {
    if (size == undefined || size < 1 || size > 10) {
      return;
    }
    if (this.rows == size) {
      return;
    }
    const obj = new TTY(this.x, this.y, this.scope, size, this.cols);
    this.delete();
    simulationArea.lastSelected = obj;
    return obj;
  }

  /**
   * @memberof TTY
   * Change the size of the screen
   * @param {number} size
   */
  changeColSize(size) {
    if (size == undefined || size < 20 || size > 100) {
      return;
    }
    if (this.cols == size) {
      return;
    }
    const obj = new TTY(this.x, this.y, this.scope, this.rows, size);
    this.delete();
    simulationArea.lastSelected = obj;
    return obj;
  }

  /**
     * @memberof TTY
     * if no input or enable key is set to 0 returns false
     * @return {boolean} is resolvable
     */
  isResolvable() {
    if (this.reset.value == 1) {
      return true;
    }
    if (
      this.en.value == 0 ||
      (this.en.connections.length && this.en.value == undefined)
    ) {
      return false;
    } else if (this.clockInp.value == undefined) {
      return false;
    } else if (this.asciiInp.value == undefined) {
      return false;
    }
    return true;
  }

  /**
     * @memberof TTY
     * To resolve the Typewriter clock and input of 7 bits are
     * used to get the ascii and then on the edge change the
     * data is added onto the display screen of the typewriter.
     */
  resolve() {
    if (this.reset.value == 1) {
      this.data = '';
      return;
    }
    if (this.en.value == 0) {
      this.buffer = '';
      return;
    }

    if (this.clockInp.value == this.prevClockState) {
      if (this.clockInp.value == 0) {
        this.buffer = String.fromCharCode(this.asciiInp.value);
      }
    } else if (this.clockInp.value != undefined) {
      if (this.clockInp.value == 1) {
        this.data += this.buffer;
        if (this.data.length > this.cols * this.rows) {
          this.data = this.data.slice(1);
        }
      } else if (this.clockInp.value == 0) {
        this.buffer = String.fromCharCode(this.asciiInp.value);
      }
      this.prevClockState = this.clockInp.value;
    }
  }
  /**
   * @memberof TTY
   * Create save JSON data of object.
   * @return {JSON}
   */
  customSave() {
    const data = {
      nodes: {
        clockInp: findNode(this.clockInp),
        asciiInp: findNode(this.asciiInp),
        reset: findNode(this.reset),
        en: findNode(this.en),
      },
      customData: {
        rows: this.rows,
        cols: this.cols,
      },
    };
    return data;
  }

  customDraw() {
    const ctx = simulationArea.context;
    ctx.strokeStyle = colors['stroke'];
    ctx.fillStyle = colors['fill'];
    ctx.beginPath();
    ctx.lineWidth = correctWidth(3);
    const xx = this.x;
    const yy = this.y;

    moveTo(
        ctx,
        -this.elementWidth / 2,
        this.elementHeight / 2 - 15,
        xx,
        yy,
        this.direction,
    );
    lineTo(
        ctx,
        5 - this.elementWidth / 2,
        this.elementHeight / 2 - 10,
        xx,
        yy,
        this.direction,
    );
    lineTo(
        ctx,
        -this.elementWidth / 2,
        this.elementHeight / 2 - 5,
        xx,
        yy,
        this.direction,
    );

    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = colors['input_text'];
    ctx.textAlign = 'center';
    const startY = -7.5 * this.rows + 3;
    for (let i = 0; i < this.data.length; i += this.cols) {
      let lineData = this.data.slice(i, i + this.cols);
      lineData += ' '.repeat(this.cols - lineData.length);
      fillText3(
          ctx,
          lineData,
          0,
          startY + (i / this.cols) * 15 + 9,
          xx,
          yy,
          15,
          'Courier New',
          'center',
      );
    }
    ctx.fill();
  }
}

TTY.prototype.tooltipText = 'TTY ToolTip : Tele typewriter selected.';
TTY.prototype.helplink = 'https://docs.circuitverse.org/#/Sequential?id=tty';

TTY.prototype.mutableProperties = {
  cols: {
    name: 'Columns',
    type: 'number',
    max: '100',
    min: '20',
    func: 'changeColSize',
  },
  rows: {
    name: 'Rows',
    type: 'number',
    max: '10',
    min: '1',
    func: 'changeRowSize',
  },
};

TTY.prototype.objectType = 'TTY';
TTY.prototype.constructorParameters= ['rows', 'cols'];
