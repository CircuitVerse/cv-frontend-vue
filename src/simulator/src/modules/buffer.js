import {CircuitElement} from '../circuit_element';
import {Node, findNode} from '../node';
import {simulationArea} from '../simulation_area';
import {correctWidth, lineTo, moveTo} from '../canvas_api';
import {colors} from '../themer/themer';

/**
 * @class
 * Buffer
 * @extends CircuitElement
 * @param {number} x - x coordinate of element.
 * @param {number} y - y coordinate of element.
 * @param {Scope} scope - Circuit on which element is drawn
 * @param {string} dir - direction of element
 * @param {number} bitWidth - bit width per node.
 * @category modules
 */
export class Buffer extends CircuitElement {
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
    this.state = 0;
    this.preState = 0;
    this.inp1 = new Node(-10, 0, 0, this);
    this.reset = new Node(0, 0, 0, this, 1, 'reset');
    this.output1 = new Node(20, 0, 1, this);
  }

  /**
   * @memberof Buffer
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
        reset: findNode(this.reset),
      },
    };
    return data;
  }

  /**
     * @memberof Buffer
     * function to change bitwidth of the element
     * @param {number} bitWidth - new bitwidth
     */
  newBitWidth(bitWidth) {
    this.inp1.bitWidth = bitWidth;
    this.output1.bitWidth = bitWidth;
    this.bitWidth = bitWidth;
  }

  /**
     * @memberof Buffer
     * Checks if the output value can be determined.
     * @return {boolean}
     */
  isResolvable() {
    return true;
  }

  /**
     * @memberof Buffer
     * resolve output values based on inputData
     */
  resolve() {
    if (this.reset.value === 1) {
      this.state = this.preState;
    }
    if (this.inp1.value !== undefined) {
      this.state = this.inp1.value;
    }

    this.output1.value = this.state;
    simulationArea.simulationQueue.add(this.output1);
  }

  /**
   * @memberof Buffer
   * function to draw element
   * @param {CanvasRenderingContext2D} ctx
   */
  customDraw(ctx) {
    ctx.strokeStyle = colors['stroke_alt'];
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
  }

  /**
   * @memberof Buffer
   * Generates Verilog string for this CircuitElement.
   * @return {string} String representing the Verilog.
   */
  generateVerilog() {
    return (
      'assign ' +
      this.output1.verilogLabel +
      ' = ' +
      this.inp1.verilogLabel +
      ';'
    );
  }
}

/**
 * @memberof Buffer
 * Help Tip
 * @type {string}
 * @category modules
 */
Buffer.prototype.tooltipText =
  'Buffer ToolTip : Isolate the input from the output.';
Buffer.prototype.helplink =
  'https://docs.circuitverse.org/#/miscellaneous?id=buffer';
Buffer.prototype.objectType = 'Buffer';
Buffer.prototype.constructorParameters= ['direction', 'bitWidth'];
