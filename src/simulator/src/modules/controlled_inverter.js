import {CircuitElement} from '../circuit_element';
import {Node, findNode} from '../node';
import {simulationArea} from '../simulation_area';
import {correctWidth, lineTo, moveTo, drawCircle2} from '../canvas_api';
import {colors} from '../themer/themer';
/**
 * @class
 * ControlledInverter
 * @extends CircuitElement
 * @param {number} x - x coordinate of element.
 * @param {number} y - y coordinate of element.
 * @param {Scope} scope - Circuit on which element is drawn
 * @param {string} dir - direction of element
 * @param {number} bitWidth - bit width per node.
 * @category modules
 */
export class ControlledInverter extends CircuitElement {
  /**
   * @param {number} x - x coordinate of element.
   * @param {number} y - y coordinate of element.
   * @param {Scope} scope - Circuit on which element is drawn
   * @param {string} dir - direction of element
   * @param {number} bitWidth - bit width per node.
   */
  constructor(x, y, scope = globalScope, dir = 'RIGHT', bitWidth = 1) {
    super(x, y, scope, dir, bitWidth);
    this.rectangleObject = false;
    this.setDimensions(15, 15);

    this.inp1 = new Node(-10, 0, 0, this);
    this.output1 = new Node(30, 0, 1, this);
    this.state = new Node(0, 0, 0, this, 1, 'Enable');
  }

  /**
   * @memberof ControlledInverter
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
        state: findNode(this.state),
      },
    };
    return data;
  }

  /**
     * @memberof ControlledInverter
     * function to change bitwidth of the element
     * @param {number} bitWidth - new bitwidth
     */
  newBitWidth(bitWidth) {
    this.inp1.bitWidth = bitWidth;
    this.output1.bitWidth = bitWidth;
    this.bitWidth = bitWidth;
  }

  /**
   * @memberof ControlledInverter
   * Determine output values and add to simulation queue.
   */
  resolve() {
    if (this.isResolvable() === false) {
      return;
    }
    if (this.state.value === 1) {
      this.output1.value =
        ((~this.inp1.value >>> 0) << (32 - this.bitWidth)) >>>
        (32 - this.bitWidth);
      simulationArea.simulationQueue.add(this.output1);
    }
    if (this.state.value === 0) {
      this.output1.value = undefined;
    }
  }

  /**
     * @memberof ControlledInverter
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
    moveTo(ctx, -10, -15, xx, yy, this.direction);
    lineTo(ctx, 20, 0, xx, yy, this.direction);
    lineTo(ctx, -10, 15, xx, yy, this.direction);
    ctx.closePath();
    if (
      (this.hover && !simulationArea.shiftDown) ||
      simulationArea.lastSelected === this ||
      simulationArea.multipleObjectSelections.includes(this)
    ) {
      ctx.fillStyle = colors['hover_select'];
    }
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    drawCircle2(ctx, 25, 0, 5, xx, yy, this.direction);
    ctx.stroke();
  }

  /**
   * @memberof ControlledInverter
   * Generates Verilog string for this CircuitElement.
   * @return {string} String representing the Verilog.
   */
  generateVerilog() {
    return `assign ${this.output1.verilogLabel} = (` +
    `${this.state.verilogLabel}!=0) ? ~${this.inp1.verilogLabel}` +
    ` : ${this.inp1.verilogLabel};`;
  }
}

/**
 * @memberof ControlledInverter
 * Help Tip
 * @type {string}
 * @category modules
 */
ControlledInverter.prototype.tooltipText =
  'Controlled Inverter ToolTip : Controlled buffer and NOT gate.';
ControlledInverter.prototype.objectType = 'ControlledInverter';
ControlledInverter.prototype.constructorParameters= ['direction', 'bitWidth'];
