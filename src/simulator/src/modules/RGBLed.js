import {CircuitElement} from '../circuitElement';
import {Node, findNode} from '../node';
import {simulationArea} from '../simulationArea';
import {correctWidth, lineTo, moveTo, arc, drawCircle2} from '../canvasApi';
import {colors} from '../themer/themer';
/**
 * @class
 * RGBLed
 * @extends CircuitElement
 * @param {number} x - x coordinate of element.
 * @param {number} y - y coordinate of element.
 * @param {Scope} scope - Circuit on which element is drawn
 * @category modules
 */
export class RGBLed extends CircuitElement {
  /**
   * @param {number} x - x coordinate of element.
   * @param {number} y - y coordinate of element.
   * @param {Scope} scope - Circuit on which element is drawn
   */
  constructor(x, y, scope = globalScope) {
    super(x, y, scope, 'UP', 8);
    this.rectangleObject = false;
    this.inp = [];
    this.setDimensions(10, 10);
    this.inp1 = new Node(-40, -10, 0, this, 8);
    this.inp2 = new Node(-40, 0, 0, this, 8);
    this.inp3 = new Node(-40, 10, 0, this, 8);
    this.inp.push(this.inp1);
    this.inp.push(this.inp2);
    this.inp.push(this.inp3);
    this.directionFixed = true;
    this.fixedBitWidth = true;
  }

  /**
   * @memberof RGBLed
   * Create save JSON data of object.
   * @return {JSON}
   */
  customSave() {
    const data = {
      nodes: {
        inp1: findNode(this.inp1),
        inp2: findNode(this.inp2),
        inp3: findNode(this.inp3),
      },
    };
    return data;
  }

  /**
     * @memberof RGBLed
     * function to draw element
     */
  customDraw() {
    const ctx = simulationArea.context;

    const xx = this.x;
    const yy = this.y;

    ctx.strokeStyle = 'green';
    ctx.lineWidth = correctWidth(3);
    ctx.beginPath();
    moveTo(ctx, -20, 0, xx, yy, this.direction);
    lineTo(ctx, -40, 0, xx, yy, this.direction);
    ctx.stroke();

    ctx.strokeStyle = 'red';
    ctx.lineWidth = correctWidth(3);
    ctx.beginPath();
    moveTo(ctx, -20, -10, xx, yy, this.direction);
    lineTo(ctx, -40, -10, xx, yy, this.direction);
    ctx.stroke();

    ctx.strokeStyle = 'blue';
    ctx.lineWidth = correctWidth(3);
    ctx.beginPath();
    moveTo(ctx, -20, 10, xx, yy, this.direction);
    lineTo(ctx, -40, 10, xx, yy, this.direction);
    ctx.stroke();

    const a = this.inp1.value;
    const b = this.inp2.value;
    const c = this.inp3.value;
    ctx.strokeStyle = '#d3d4d5';
    ctx.fillStyle = [
      `rgba(${a}, ${b}, ${c}, 0.8)`,
      'rgba(227, 228, 229, 0.8)',
    ][(a === undefined || b === undefined || c === undefined) + 0];
    // ctx.fillStyle = ["rgba(200, 200, 200, 0.3)","rgba(227, 228, 229, 0.8)"][((a === undefined || b === undefined || c === undefined) || (a === 0 && b === 0 && c === 0)) + 0];
    ctx.lineWidth = correctWidth(1);

    ctx.beginPath();

    moveTo(ctx, -18, -11, xx, yy, this.direction);
    lineTo(ctx, 0, -11, xx, yy, this.direction);
    arc(ctx, 0, 0, 11, -Math.PI / 2, Math.PI / 2, xx, yy, this.direction);
    lineTo(ctx, -18, 11, xx, yy, this.direction);
    lineTo(ctx, -21, 15, xx, yy, this.direction);
    arc(
        ctx,
        0,
        0,
        Math.sqrt(666),
        Math.PI / 2 + Math.acos(15 / Math.sqrt(666)),
        -Math.PI / 2 - Math.asin(21 / Math.sqrt(666)),
        xx,
        yy,
        this.direction,
    );
    lineTo(ctx, -18, -11, xx, yy, this.direction);
    ctx.stroke();
    if (
      (this.hover && !simulationArea.shiftDown) ||
      simulationArea.lastSelected === this ||
      simulationArea.multipleObjectSelections.contains(this)
    ) {
      ctx.fillStyle = colors['hover_select'];
    }
    ctx.fill();
  }

  // Draws the element in the subcircuit. Used in layout mode
  subcircuitDraw(xOffset = 0, yOffset = 0) {
    const ctx = simulationArea.context;

    const xx = this.subcircuitMetadata.x + xOffset;
    const yy = this.subcircuitMetadata.y + yOffset;
    const dimensionSize = 6;

    const a = this.inp1.value;
    const b = this.inp2.value;
    const c = this.inp3.value;
    ctx.strokeStyle = '#090a0a';
    ctx.fillStyle = [
      'rgba(' + a + ', ' + b + ', ' + c + ', 0.8)',
      'rgba(227, 228, 229, 0.8)',
    ][(a === undefined || b === undefined || c === undefined) + 0];
    ctx.lineWidth = correctWidth(1);

    ctx.beginPath();
    drawCircle2(ctx, 0, 0, dimensionSize, xx, yy, this.direction);
    ctx.stroke();
    if (
      (this.hover && !simulationArea.shiftDown) ||
      simulationArea.lastSelected == this ||
      simulationArea.multipleObjectSelections.contains(this)
    ) {
      ctx.fillStyle = 'rgba(255, 255, 32,0.8)';
    }
    ctx.fill();
  }

  /**
   * @memberof RGBLed
   * Generates Verilog string for this CircuitElement.
   * @return {string} String representing the Verilog.
   */
  generateVerilog() {
    return `
      always @ (*)
        $display("RGBLed:{${this.inp1.verilogLabel},${this.inp2.verilogLabel},${this.inp3.verilogLabel}} = {%d,%d,%d}", ${this.inp1.verilogLabel}, ${this.inp2.verilogLabel}, ${this.inp3.verilogLabel});`;
  }
}

/**
 * @memberof RGBLed
 * Help Tip
 * @type {string}
 * @category modules
 */
RGBLed.prototype.tooltipText =
  'RGB Led ToolTip: RGB Led inputs 8 bit values for the colors RED, GREEN and BLUE.';

/**
 * @memberof RGBLed
 * Help URL
 * @type {string}
 * @category modules
 */
RGBLed.prototype.helplink = 'https://docs.circuitverse.org/#/outputs?id=rgb-led';
RGBLed.prototype.objectType = 'RGBLed';
RGBLed.prototype.canShowInSubcircuit = true;
