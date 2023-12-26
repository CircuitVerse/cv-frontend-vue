import {CircuitElement} from '../circuit_element';
import {Node, findNode} from '../node';

import {correctWidth, rect2, fillText, oppositeDirection} from '../canvas_api';
import {colors} from '../themer/themer';
import {converters} from '../utils';
/**
 * @class
 * ConstantVal
 * @extends CircuitElement
 * @param {number} x - x coordinate of element.
 * @param {number} y - y coordinate of element.
 * @param {Scope} scope - Circuit on which element is drawn
 * @param {string} dir - direction of element
 * @param {number} bitWidth - bit width per node.
 * @param {string} state - The state of element
 * @category modules
 */
export class ConstantVal extends CircuitElement {
  /**
   * @param {number} x - x coordinate of element.
 * @param {number} y - y coordinate of element.
 * @param {Scope} scope - Circuit on which element is drawn
 * @param {string} dir - direction of element
 * @param {number} bitWidth - bit width per node.
 * @param {string} state - The state of element
     */
  constructor(
      x,
      y,
      scope,
      dir = 'RIGHT',
      bitWidth = 1,
      state = '0',
  ) {
    super(x, y, scope, dir, state.length);
    this.state = state;
    this.setDimensions(10 * this.state.length, 10);
    this.bitWidth = bitWidth || this.state.length;
    this.directionFixed = true;
    this.orientationFixed = false;
    this.rectangleObject = false;

    this.output1 = new Node(this.bitWidth * 10, 0, 1, this);
    this.wasClicked = false;
    this.label = '';
  }

  /**
   * @memberof ConstantVal
   * Create save JSON data of object.
   * @return {JSON}
   */
  customSave() {
    const data = {
      nodes: {
        output1: findNode(this.output1),
      },
      customData: {
        direction: this.direction,
        bitWidth: this.bitWidth,
        state: this.state,
      },
    };
    return data;
  }

  /**
   * @memberof ConstantVal
   * Determine output values and add to simulation queue.
   */
  resolve() {
    this.output1.value = converters.bin2dec(this.state);
    this.scope.simulationArea.simulationQueue.add(this.output1);
  }

  /**
     * @memberof ConstantVal
     * updates state using a prompt when dbl clicked
     */
  dblclick() {
    this.state = prompt('Re enter the value') || '0';
    this.newBitWidth(this.state.toString().length);
  }

  /**
     * @memberof ConstantVal
     * function to change bitwidth of the element
     * @param {number} bitWidth - new bitwidth
     */
  newBitWidth(bitWidth) {
    if (bitWidth > this.state.length) {
      this.state = '0'.repeat(bitWidth - this.state.length) + this.state;
    } else if (bitWidth < this.state.length) {
      this.state = this.state.slice(this.bitWidth - bitWidth);
    }
    this.bitWidth = bitWidth; // ||parseInt(prompt("Enter bitWidth"),10);
    this.output1.bitWidth = bitWidth;
    this.setDimensions(10 * this.bitWidth, 10);
    if (this.direction === 'RIGHT') {
      this.output1.x = 10 * this.bitWidth;
      this.output1.leftX = 10 * this.bitWidth;
    } else if (this.direction === 'LEFT') {
      this.output1.x = -10 * this.bitWidth;
      this.output1.leftX = 10 * this.bitWidth;
    }
  }

  /**
     * @memberof ConstantVal
     * function to draw element
     * @param {CanvasRenderingContext2D} ctx
   */
  customDraw(ctx) {
    ctx.beginPath();
    ctx.strokeStyle = colors['stroke'];
    ctx.fillStyle = colors['fill'];
    ctx.lineWidth = correctWidth(1);
    const xx = this.x;
    const yy = this.y;

    rect2(
        ctx,
        -10 * this.bitWidth,
        -10,
        20 * this.bitWidth,
        20,
        xx,
        yy,
        'RIGHT',
    );
    if (
      (this.hover && !this.scope.simulationArea.shiftDown) ||
      this.scope.simulationArea.lastSelected === this ||
      this.scope.simulationArea.multipleObjectSelections.includes(this)
    ) {
      ctx.fillStyle = colors['hover_select'];
    }
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = colors['input_text'];
    ctx.textAlign = 'center';
    const bin = this.state;
    for (let k = 0; k < this.bitWidth; k++) {
      fillText(ctx, bin[k], xx - 10 * this.bitWidth + 10 + k * 20, yy + 5);
    }
    ctx.fill();
  }

  /**
     * @memberof ConstantVal
     * function to change direction of ConstantVal
     * @param {string} dir - new direction
     */
  newDirection(dir) {
    if (dir === this.direction) {
      return;
    }
    this.direction = dir;
    this.output1.refresh();
    if (dir === 'RIGHT' || dir === 'LEFT') {
      this.output1.leftX = 10 * this.bitWidth;
      this.output1.leftY = 0;
    } else {
      this.output1.leftX = 10; // 10*this.bitWidth;
      this.output1.leftY = 0;
    }

    this.output1.refresh();
    this.labelDirection = oppositeDirection[this.direction];
  }

  /**
   * @memberof ConstantVal
   * Generates Verilog string for this CircuitElement.
   * @return {string} String representing the Verilog.
   */
  generateVerilog() {
    return `assign ${this.output1.verilogLabel} = ` +
         `${this.bitWidth}'b${this.state};`;
  }
}

/**
 * @memberof ConstantVal
 * Help Tip
 * @type {string}
 * @category modules
 */
ConstantVal.prototype.tooltipText =
  'Constant ToolTip: Bits are fixed. Double click element to change the bits.';

/**
 * @memberof ConstantVal
 * Help URL
 * @type {string}
 * @category modules
 */
ConstantVal.prototype.helplink =
  'https://docs.circuitverse.org/#/inputElements?id=constantval';

/**
 * @memberof ConstantVal
 * @type {number}
 * @category modules
 */
ConstantVal.prototype.propagationDelay = 0;
ConstantVal.prototype.objectType = 'ConstantVal';
ConstantVal.prototype.constructorParameters= ['direction', 'bitWidth', 'state'];
