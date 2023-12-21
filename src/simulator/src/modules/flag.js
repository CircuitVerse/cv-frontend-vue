import {CircuitElement} from '../circuit_element';
import {Node, findNode} from '../node';
import {simulationArea} from '../simulation_area';
import {correctWidth, rect2, fillText} from '../canvas_api';
import {plotArea} from '../plot_area';
import {colors} from '../themer/themer';

/**
 * @class
 * Flag
 * @extends CircuitElement
 * @param {number} x - x coordinate of element.
 * @param {number} y - y coordinate of element.
 * @param {Scope} scope - Circuit on which element is drawn
 * @param {string} dir - direction of element
 * @param {number} bitWidth - bit width per node.
 * @param {string} identifier - id
 * @category modules
 */
export class Flag extends CircuitElement {
  constructor(
      x,
      y,
      scope = globalScope,
      dir = 'RIGHT',
      bitWidth = 1,
      identifier,
  ) {
    super(x, y, scope, dir, bitWidth);
    this.setWidth(60);
    this.setHeight(20);
    this.rectangleObject = false;
    this.directionFixed = true;
    this.orientationFixed = false;
    this.identifier = identifier || `F${this.scope.Flag.length}`;
    this.plotValues = [];

    this.xSize = 10;
    this.flagTimeUnit = 0;

    this.inp1 = new Node(40, 0, 0, this);
  }

  resolve() {
    this.flagTimeUnit = simulationArea.simulationQueue.time;
    const time = plotArea.getPlotTime(this.flagTimeUnit);

    if (
      this.plotValues.length &&
      this.plotValues[this.plotValues.length - 1][0] === time
    ) {
      this.plotValues.pop();
    }

    if (this.plotValues.length === 0) {
      this.plotValues.push([time, this.inp1.value]);
      return;
    }

    if (
      this.plotValues[this.plotValues.length - 1][1] === this.inp1.value
    ) {
      return;
    }
    this.plotValues.push([time, this.inp1.value]);
  }

  /**
   * @memberof Flag
   * Create save JSON data of object.
   * @return {JSON}
   */
  customSave() {
    const data = {
      customData: {
        direction: this.direction,
        bitWidth: this.bitWidth,
        identifier: this.identifier,
      },
      nodes: {
        inp1: findNode(this.inp1),
      },
    };
    return data;
  }

  /**
   * @memberof Flag
   * set the flag id
   * @param {number} id - identifier for flag
   */
  setIdentifier(id = '') {
    if (id.length === 0) {
      return;
    }
    this.identifier = id;
    const len = this.identifier.length;
    if (len === 1) {
      this.xSize = 20;
    } else if (len > 1 && len < 4) {
      this.xSize = 10;
    } else {
      this.xSize = 0;
    }
  }

  /**
     * @memberof Flag
     * function to draw element
     */
  customDraw() {
    const ctx = simulationArea.context;
    ctx.beginPath();
    ctx.strokeStyle = colors['stroke'];
    ctx.fillStyle = colors['fill'];
    ctx.lineWidth = correctWidth(1);
    const xx = this.x;
    const yy = this.y;

    rect2(
        ctx,
        -50 + this.xSize,
        -20,
        100 - 2 * this.xSize,
        40,
        xx,
        yy,
        'RIGHT',
    );
    if (
      (this.hover && !simulationArea.shiftDown) ||
      simulationArea.lastSelected === this ||
      simulationArea.multipleObjectSelections.includes(this)
    ) {
      ctx.fillStyle = colors['hover_select'];
    }
    ctx.fill();
    ctx.stroke();

    ctx.font = '14px Raleway';
    this.xOff = ctx.measureText(this.identifier).width;

    ctx.beginPath();
    rect2(ctx, -40 + this.xSize, -12, this.xOff + 10, 25, xx, yy, 'RIGHT');
    ctx.fillStyle = '#eee';
    ctx.strokeStyle = '#ccc';
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.textAlign = 'center';
    ctx.fillStyle = 'black';
    fillText(
        ctx,
        this.identifier,
        xx - 35 + this.xOff / 2 + this.xSize,
        yy + 5,
        14,
    );
    ctx.fill();

    ctx.beginPath();
    ctx.font = '30px Raleway';
    ctx.textAlign = 'center';
    ctx.fillStyle = ['blue', 'red'][+(this.inp1.value === undefined)];
    if (this.inp1.value !== undefined) {
      fillText(
          ctx,
          this.inp1.value.toString(16),
          xx + 35 - this.xSize,
          yy + 8,
          25,
      );
    } else {
      fillText(ctx, 'x', xx + 35 - this.xSize, yy + 8, 25);
    }
    ctx.fill();
  }

  /**
     * @memberof Flag
     * function to change direction of Flag
     * @param {string} dir - new direction
     */
  newDirection(dir) {
    if (dir === this.direction) {
      return;
    }
    this.direction = dir;
    this.inp1.refresh();
    if (dir === 'RIGHT' || dir === 'LEFT') {
      this.inp1.leftx = 50 - this.xSize;
    } else if (dir === 'UP') {
      this.inp1.leftx = 20;
    } else {
      this.inp1.leftx = 20;
    }
    this.inp1.refresh();
  }
}

/**
 * @memberof Flag
 * Help Tip
 * @type {string}
 * @category modules
 */
Flag.prototype.tooltipText =
  'Flag ToolTip: Use this for debugging and plotting.';
Flag.prototype.helplink =
  'https://docs.circuitverse.org/#/timing_diagrams?id=using-flags';

/**
 * @memberof Flag
 * Help URL
 * @type {string}
 * @category modules
 */
Flag.prototype.helplink =
  'https://docs.circuitverse.org/#/miscellaneous?id=tunnel';

/**
 * @memberof Flag
 * Mutable properties of the element
 * @type {JSON}
 * @category modules
 */
Flag.prototype.mutableProperties = {
  identifier: {
    name: 'Debug Flag identifier',
    type: 'text',
    maxlength: '5',
    func: 'setIdentifier',
  },
};
Flag.prototype.objectType = 'Flag';
Flag.prototype.propagationDelay = 0;
Flag.prototype.constructorParameters= ['direction', 'bitWidth'];
