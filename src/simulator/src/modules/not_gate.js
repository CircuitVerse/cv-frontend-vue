import {CircuitElement} from '../circuit_element';
import {Node, findNode} from '../node';

import {correctWidth, lineTo, moveTo, drawCircle2} from '../canvas_api';
import {colors} from '../themer/themer';
/**
 * @class
 * NotGate
 * @extends CircuitElement
 * @param {number} x - x coordinate of element.
 * @param {number} y - y coordinate of element.
 * @param {Scope} scope - Circuit on which element is drawn
 * @param {string} dir - direction of element
 * @param {number} bitWidth - bit width per node.
 * @category modules
 */
export class NotGate extends CircuitElement {
  /**
   * @param {number} x - x coordinate of element.
   * @param {number} y - y coordinate of element.
   * @param {Scope} scope - Circuit on which element is drawn
   * @param {string} dir - direction of element
   * @param {number} bitWidth - bit width per node.
   */
  constructor(x, y, scope, dir = 'RIGHT', bitWidth = 1) {
    super(x, y, scope, dir, bitWidth);
    this.rectangleObject = false;
    this.setDimensions(15, 15);

    this.inp1 = new Node(-10, 0, 0, this);
    this.output1 = new Node(20, 0, 1, this);
  }

  /**
   * @memberof NotGate
   * Create save JSON data of object.
   * @return {JSON}
   */
  customSave() {
    const data = {
      customData: {
        direction: this.direction,
        bitWidth: this.bitWidth,
      },
      nodes: {
        output1: findNode(this.output1),
        inp1: findNode(this.inp1),
      },
    };
    return data;
  }

  /**
   * @memberof NotGate
   * Determine output values and add to simulation queue.
   */
  resolve() {
    if (this.isResolvable() === false) {
      return;
    }
    this.output1.value =
      ((~this.inp1.value >>> 0) << (32 - this.bitWidth)) >>>
      (32 - this.bitWidth);
    globalScope.simulationArea.simulationQueue.add(this.output1);
  }

  /**
     * @memberof NotGate
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
    moveTo(ctx, -10, -10, xx, yy, this.direction);
    lineTo(ctx, 10, 0, xx, yy, this.direction);
    lineTo(ctx, -10, 10, xx, yy, this.direction);
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
    drawCircle2(ctx, 15, 0, 5, xx, yy, this.direction);
    ctx.stroke();
  }

  /**
   * @memberof NotGate
   * Generates Verilog string for this CircuitElement.
   * @return {string} String representing the Verilog.
   */
  generateVerilog() {
    return (
      'assign ' +
      this.output1.verilogLabel +
      ' = ~' +
      this.inp1.verilogLabel +
      ';'
    );
  }
}

/**
 * @memberof NotGate
 * Help Tip
 * @type {string}
 * @category modules
 */
NotGate.prototype.tooltipText =
  'Not Gate Tooltip : Inverts the input digital signal.';
NotGate.prototype.helplink = 'https://docs.circuitverse.org/#/chapter4/4gates?id=not-gate';
NotGate.prototype.objectType = 'NotGate';
NotGate.prototype.verilogType = 'not';
NotGate.prototype.constructorParameters= ['direction', 'bitWidth'];
