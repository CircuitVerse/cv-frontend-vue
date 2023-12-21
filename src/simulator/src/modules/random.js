import {CircuitElement} from '../circuit_element';
import {Node, findNode} from '../node';
import {simulationArea} from '../simulation_area';
import {fillText, lineTo, moveTo, correctWidth, rect2} from '../canvas_api';
import {colors} from '../themer/themer';
/**
 * Random
 * Random is used to generate random value.
 * It has 2 input node:
 * clock and max random output value
 * @extends CircuitElement
 * @param {number} x - x coord of element.
 * @param {number} y - y coord of element.
 * @param {Scope} scope - the circuit in which we want the Element.
 * @param {string} dir - direction in which element has to drawn.
 * @category modules
 */
export class Random extends CircuitElement {
  /**
   * @param {number} x - x coord of element.
   * @param {number} y - y coord of element.
   * @param {Scope} scope - the circuit in which we want the Element.
   * @param {string} dir - direction in which element has to drawn.
   * @param {*} bitWidth - bit width.
   */
  constructor(x, y, scope = globalScope, dir = 'RIGHT', bitWidth = 1) {
    super(x, y, scope, dir, bitWidth);
    this.directionFixed = true;
    this.setDimensions(20, 20);
    this.rectangleObject = true;
    this.currentRandomNo = 0;
    this.clockInp = new Node(-20, +10, 0, this, 1, 'Clock');
    this.maxValue = new Node(-20, -10, 0, this, this.bitWidth, 'MaxValue');
    this.output = new Node(20, -10, 1, this, this.bitWidth, 'RandomValue');
    this.prevClockState = 0;
    this.wasClicked = false;
  }

  /**
   * @memberof Random
   * return true if clock is connected and if maxValue is set or unconnected.
   * @return {boolean} - is resolvable.
   */
  isResolvable() {
    if (
      this.clockInp.value != undefined &&
      (this.maxValue.value != undefined ||
        this.maxValue.connections.length == 0)
    ) {
      return true;
    }
    return false;
  }

  /**
   * Set new bit width.
   * @param {number} bitWidth
   */
  newBitWidth(bitWidth) {
    this.bitWidth = bitWidth;
    this.maxValue.bitWidth = bitWidth;
    this.output.bitWidth = bitWidth;
  }

  /**
     * @memberof Random
     * Edge triggered when the clock state changes a
     * Random number is generated less then the maxValue.
     */
  resolve() {
    const maxValue = this.maxValue.connections.length ?
      this.maxValue.value + 1 :
      2 << (this.bitWidth - 1);
    if (this.clockInp.value != undefined) {
      if (this.clockInp.value != this.prevClockState) {
        if (this.clockInp.value == 1) {
          this.currentRandomNo = Math.floor(Math.random() * maxValue);
        }
        this.prevClockState = this.clockInp.value;
      }
    }
    if (this.output.value != this.currentRandomNo) {
      this.output.value = this.currentRandomNo;
      simulationArea.simulationQueue.add(this.output);
    }
  }

  /**
   * @memberof Random
   * Create save JSON data of object.
   * @return {JSON}
   */
  customSave() {
    const data = {
      nodes: {
        clockInp: findNode(this.clockInp),
        maxValue: findNode(this.maxValue),
        output: findNode(this.output),
      },
      customData: {
        direction: this.direction,
        bitWidth: this.bitWidth,
      },
    };
    return data;
  }

  /**
   * Custom draw
   */
  customDraw() {
    const ctx = simulationArea.context;
    ctx.fillStyle = colors['fill'];
    ctx.strokeStyle = colors['stroke'];
    ctx.beginPath();
    const xx = this.x;
    const yy = this.y;
    ctx.font = '20px Raleway';
    ctx.fillStyle = colors['input_text'];
    ctx.textAlign = 'center';
    fillText(ctx, this.currentRandomNo.toString(10), this.x, this.y + 5);
    ctx.fill();
    ctx.beginPath();
    moveTo(ctx, -20, 5, xx, yy, this.direction);
    lineTo(ctx, -15, 10, xx, yy, this.direction);
    lineTo(ctx, -20, 15, xx, yy, this.direction);
    ctx.stroke();
  }

  /**
   * Draws the element in the subcircuit. Used in layout mode
   * @param {number} xOffset
   * @param {number} yOffset
   */
  subcircuitDraw(xOffset = 0, yOffset = 0) {
    const ctx = simulationArea.context;
    const xx = this.subcircuitMetadata.x + xOffset;
    const yy = this.subcircuitMetadata.y + yOffset;

    ctx.beginPath();
    ctx.font = '20px Raleway';
    ctx.fillStyle = 'green';
    ctx.textAlign = 'center';
    fillText(ctx, this.currentRandomNo.toString(16), xx + 10, yy + 17);
    ctx.fill();

    ctx.beginPath();
    ctx.lineWidth = correctWidth(1);
    rect2(ctx, 0, 0, 20, 20, xx, yy, this.direction);
    ctx.stroke();

    if (
      (this.hover && !simulationArea.shiftDown) ||
      simulationArea.lastSelected == this ||
      simulationArea.multipleObjectSelections.includes(this)
    ) {
      ctx.fillStyle = 'rgba(255, 255, 32,0.6)';
      ctx.fill();
    }
  }

  /**
   * Generate Verilog for the Random module
   * @return {string} Verilog for the Random module
   */
  static moduleVerilog() {
    return `
      module Random(val, clk, max);
        parameter WIDTH = 1;
        output reg [WIDTH-1:0] val;
        input clk;
        input [WIDTH-1:0] max;
      
        always @ (posedge clk)
          if (^max === 1'bX)
            val = $urandom_range(0, {WIDTH{1'b1}});
          else
            val = $urandom_range(0, max);
      endmodule
      `;
  }
}

Random.prototype.tooltipText = 'Random ToolTip : Random Selected.';

Random.prototype.helplink =
  'https://docs.circuitverse.org/#/inputElements?id=random';

Random.prototype.objectType = 'Random';

Random.prototype.canShowInSubcircuit = true;
Random.prototype.layoutProperties = {
  rightDimensionX: 20,
  leftDimensionX: 0,
  upDimensionY: 0,
  downDimensionY: 20,
};
Random.prototype.constructorParameters= ['direction', 'bitWidth'];
