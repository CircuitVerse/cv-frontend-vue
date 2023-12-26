import {CircuitElement} from '../circuit_element';
import {Node, findNode} from '../node';

import {gateGenerateVerilog} from '../utils';

import {
  correctWidth,
  bezierCurveTo,
  moveTo,
  drawCircle2,
} from '../canvas_api';
import {changeInputSize} from '../modules';
import {colors} from '../themer/themer';
/**
 * @class
 * NorGate
 * @extends CircuitElement
 * @param {number} x - x coordinate of element.
 * @param {number} y - y coordinate of element.
 * @param {Scope} scope - Circuit on which element is drawn
 * @param {string} dir - direction of element
 * @param {number} inputs - number of input nodes
 * @param {number} bitWidth - bit width per node.
 * @category modules
 */
export class NorGate extends CircuitElement {
  /**
   * @param {number} x - x coordinate of element.
   * @param {number} y - y coordinate of element.
   * @param {Scope} scope - Circuit on which element is drawn
   * @param {string} dir - direction of element
   * @param {number} inputs - number of input nodes
   * @param {number} bitWidth - bit width per node.
   */
  constructor(
      x,
      y,
      scope,
      dir = 'RIGHT',
      inputs = 2,
      bitWidth = 1,
  ) {
    super(x, y, scope, dir, bitWidth);
    this.rectangleObject = false;
    this.setDimensions(15, 20);

    this.inp = [];
    this.inputSize = inputs;

    if (inputs % 2 === 1) {
      for (let i = 0; i < inputs / 2 - 1; i++) {
        const a = new Node(-10, -10 * (i + 1), 0, this);
        this.inp.push(a);
      }
      let a = new Node(-10, 0, 0, this);
      this.inp.push(a);
      for (let i = inputs / 2 + 1; i < inputs; i++) {
        a = new Node(-10, 10 * (i + 1 - inputs / 2 - 1), 0, this);
        this.inp.push(a);
      }
    } else {
      for (let i = 0; i < inputs / 2; i++) {
        const a = new Node(-10, -10 * (i + 1), 0, this);
        this.inp.push(a);
      }
      for (let i = inputs / 2; i < inputs; i++) {
        const a = new Node(-10, 10 * (i + 1 - inputs / 2), 0, this);
        this.inp.push(a);
      }
    }
    this.output1 = new Node(30, 0, 1, this);
  }

  /**
   * @memberof NorGate
   * Create save JSON data of object.
   * @return {JSON}
   */
  customSave() {
    const data = {
      customData: {
        direction: this.direction,
        inputSize: this.inputSize,
        bitWidth: this.bitWidth,
      },
      nodes: {
        inp: this.inp.map(findNode),
        output1: findNode(this.output1),
      },
    };
    return data;
  }

  /**
   * @memberof NorGate
   * Determine output values and add to simulation queue.
   */
  resolve() {
    let result = this.inp[0].value || 0;
    for (let i = 1; i < this.inputSize; i++) {
      result |= this.inp[i].value || 0;
    }
    result =
      ((~result >>> 0) << (32 - this.bitWidth)) >>> (32 - this.bitWidth);
    this.output1.value = result;
    this.scope.simulationArea.simulationQueue.add(this.output1);
  }

  /**
     * @memberof NorGate
     * function to draw element
     * @param {CanvasRenderingContext2D} ctx
   */
  customDraw(ctx) {
    ctx.strokeStyle = colors['stroke'];
    ctx.lineWidth = correctWidth(3);

    const xx = this.x;
    const yy = this.y;
    ctx.beginPath();
    ctx.fillStyle = colors['fill'];

    moveTo(ctx, -10, -20, xx, yy, this.direction, true);
    bezierCurveTo(0, -20, +15, -10, 20, 0, xx, yy, this.direction);
    bezierCurveTo(
        0 + 15,
        0 + 10,
        0,
        0 + 20,
        -10,
        +20,
        xx,
        yy,
        this.direction,
    );
    bezierCurveTo(0, 0, 0, 0, -10, -20, xx, yy, this.direction);
    ctx.closePath();
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
    drawCircle2(ctx, 25, 0, 5, xx, yy, this.direction);
    ctx.stroke();
    // for debugging
  }

  /**
   * @memberof NorGate
   * Generates Verilog string for this CircuitElement.
   * @return {string} String representing the Verilog.
   */
  generateVerilog() {
    return gateGenerateVerilog.call(this, '|', true);
  }
}

/**
 * @memberof NorGate
 * Help Tip
 * @type {string}
 * @category modules
 */
NorGate.prototype.tooltipText =
  'Nor Gate ToolTip : Combination of OR gate and NOT gate.';

/**
 * @memberof NorGate
 * @type {boolean}
 * @category modules
 */
NorGate.prototype.alwaysResolve = true;

/**
 * @memberof SevenSegDisplay
 * function to change input nodes of the element
 * @category modules
 */
NorGate.prototype.changeInputSize = changeInputSize;

/**
 * @memberof SevenSegDisplay
 * @type {string}
 * @category modules
 */
NorGate.prototype.verilogType = 'nor';
NorGate.prototype.helplink = 'https://docs.circuitverse.org/#/gates?id=nor-gate';
NorGate.prototype.objectType = 'NorGate';
NorGate.prototype.constructorParameters= ['direction', 'inputSize', 'bitWidth'];