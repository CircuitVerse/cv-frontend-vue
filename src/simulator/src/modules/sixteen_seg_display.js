import {CircuitElement} from '../circuit_element';
import {Node, findNode} from '../node';
import {simulationArea} from '../simulation_area';
import {
  colorToRGBA,
  correctWidth,
  lineTo,
  moveTo,
  rect,
  rect2,
  validColor,
} from '../canvas_api';
/**
 * @class
 * SixteenSegDisplay
 * @extends CircuitElement
 * @param {number} x - x coordinate of element.
 * @param {number} y - y coordinate of element.
 * @param {Scope} scope - Circuit on which element is drawn.
 * @category modules
 */
export class SixteenSegDisplay extends CircuitElement {
  /**
     *
     * @param {number} x - x coordinate of element.
     * @param {number} y - y coordinate of element.
     * @param {Scope} scope - Circuit on which element is drawn.
     * @param {*} color - color of the segments.
     */
  constructor(x, y, scope = globalScope, color = 'Red') {
    super(x, y, scope, 'RIGHT', 16);
    this.fixedBitWidth = true;
    this.directionFixed = true;
    this.setDimensions(30, 50);
    this.input1 = new Node(0, -50, 0, this, 16);
    this.dot = new Node(0, 50, 0, this, 1);
    this.direction = 'RIGHT';
    this.color = color;
    this.actualColor = color;
  }

  /**
     * @memberof SixteenSegDisplay
     * fn to change the color of SixteenSegDisplay
     * @return {JSON}
     */
  changeColor(value) {
    if (validColor(value)) {
      if (value.trim() === '') {
        this.color = 'Red';
        this.actualColor = 'rgba(255, 0, 0, 1)';
      } else {
        this.color = value;
        const temp = colorToRGBA(value);
        this.actualColor = `rgba(${temp[0]},${temp[1]},${temp[2]}, ${temp[3]})`;
      }
    }
  }

  /**
   * @memberof SixteenSegDisplay
   * Create save JSON data of object.
   * @return {JSON}
   */
  customSave() {
    const data = {
      customData: {
        color: this.color,
      },
      nodes: {
        input1: findNode(this.input1),
        dot: findNode(this.dot),
      },
    };
    return data;
  }

  /**
   * @memberof SixteenSegDisplay
   * function to draw element
   * @param {*} x1 - beginning x position.
   * @param {*} y1 - beginning y position.
   * @param {*} x2 - ending x position.
   * @param {*} y2 - ending y position.
   * @param {*} color - color to draw the segment.
   */
  customDrawSegment(x1, y1, x2, y2, color) {
    if (color === undefined) {
      color = 'lightgrey';
    }
    const ctx = simulationArea.context;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = correctWidth(4);
    const xx = this.x;
    const yy = this.y;
    moveTo(ctx, x1, y1, xx, yy, this.direction);
    lineTo(ctx, x2, y2, xx, yy, this.direction);
    ctx.closePath();
    ctx.stroke();
  }

  /**
   * @memberof SixteenSegDisplay
   * function to draw element
   * @param {*} x1 - beginning x position.
   * @param {*} y1 - beginning y position.
   * @param {*} x2 - ending x position.
   * @param {*} y2 - ending y position.
   * @param {*} color - color to draw the segment.
   */
  customDrawSegmentSlant(x1, y1, x2, y2, color) {
    if (color === undefined) {
      color = 'lightgrey';
    }
    const ctx = simulationArea.context;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = correctWidth(3);
    const xx = this.x;
    const yy = this.y;
    moveTo(ctx, x1, y1, xx, yy, this.direction);
    lineTo(ctx, x2, y2, xx, yy, this.direction);
    ctx.closePath();
    ctx.stroke();
  }

  /**
     * @memberof SixteenSegDisplay
     * function to draw element
     */
  customDraw() {
    const ctx = simulationArea.context;
    const xx = this.x;
    const yy = this.y;
    const color = ['lightgrey', this.actualColor];
    const {value} = this.input1;
    this.customDrawSegment(
        -20,
        -38,
        0,
        -38,
        ['lightgrey', this.actualColor][(value >> 15) & 1],
    ); // a1
    this.customDrawSegment(
        20,
        -38,
        0,
        -38,
        ['lightgrey', this.actualColor][(value >> 14) & 1],
    ); // a2
    this.customDrawSegment(
        21.5,
        -2,
        21.5,
        -36,
        ['lightgrey', this.actualColor][(value >> 13) & 1],
    ); // b
    this.customDrawSegment(
        21.5,
        2,
        21.5,
        36,
        ['lightgrey', this.actualColor][(value >> 12) & 1],
    ); // c
    this.customDrawSegment(
        -20,
        38,
        0,
        38,
        ['lightgrey', this.actualColor][(value >> 11) & 1],
    ); // d1
    this.customDrawSegment(
        20,
        38,
        0,
        38,
        ['lightgrey', this.actualColor][(value >> 10) & 1],
    ); // d2
    this.customDrawSegment(
        -21.5,
        2,
        -21.5,
        36,
        ['lightgrey', this.actualColor][(value >> 9) & 1],
    ); // e
    this.customDrawSegment(
        -21.5,
        -36,
        -21.5,
        -2,
        ['lightgrey', this.actualColor][(value >> 8) & 1],
    ); // f
    this.customDrawSegment(
        -20,
        0,
        0,
        0,
        ['lightgrey', this.actualColor][(value >> 7) & 1],
    ); // g1
    this.customDrawSegment(
        20,
        0,
        0,
        0,
        ['lightgrey', this.actualColor][(value >> 6) & 1],
    ); // g2
    this.customDrawSegmentSlant(
        0,
        0,
        -21,
        -37,
        ['lightgrey', this.actualColor][(value >> 5) & 1],
    ); // h
    this.customDrawSegment(
        0,
        -2,
        0,
        -36,
        ['lightgrey', this.actualColor][(value >> 4) & 1],
    ); // i
    this.customDrawSegmentSlant(
        0,
        0,
        21,
        -37,
        ['lightgrey', this.actualColor][(value >> 3) & 1],
    ); // j
    this.customDrawSegmentSlant(
        0,
        0,
        21,
        37,
        ['lightgrey', this.actualColor][(value >> 2) & 1],
    ); // k
    this.customDrawSegment(
        0,
        2,
        0,
        36,
        ['lightgrey', this.actualColor][(value >> 1) & 1],
    ); // l
    this.customDrawSegmentSlant(
        0,
        0,
        -21,
        37,
        ['lightgrey', this.actualColor][(value >> 0) & 1],
    ); // m
    ctx.beginPath();
    const dotColor =
      ['lightgrey', this.actualColor][this.dot.value] || 'lightgrey';
    ctx.strokeStyle = dotColor;
    rect(ctx, xx + 22, yy + 42, 2, 2);
    ctx.stroke();
  }

  subcircuitDrawSegment(x1, y1, x2, y2, color, xxSegment, yySegment) {
    if (color == undefined) {
      color = 'lightgrey';
    }
    const ctx = simulationArea.context;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = correctWidth(3);
    const xx = xxSegment;
    const yy = yySegment;
    moveTo(ctx, x1, y1, xx, yy, this.direction);
    lineTo(ctx, x2, y2, xx, yy, this.direction);
    ctx.closePath();
    ctx.stroke();
  }

  subcircuitDrawSegmentSlant(x1, y1, x2, y2, color, xxSegment, yySegment) {
    if (color == undefined) {
      color = 'lightgrey';
    }
    const ctx = simulationArea.context;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = correctWidth(2);
    const xx = xxSegment;
    const yy = yySegment;
    moveTo(ctx, x1, y1, xx, yy, this.direction);
    lineTo(ctx, x2, y2, xx, yy, this.direction);
    ctx.closePath();
    ctx.stroke();
  }

  // Draws the element in the subcircuit. Used in layout mode
  subcircuitDraw(xOffset = 0, yOffset = 0) {
    const ctx = simulationArea.context;

    const xx = this.subcircuitMetadata.x + xOffset;
    const yy = this.subcircuitMetadata.y + yOffset;

    const color = ['lightgrey', this.actualColor];
    const value = this.input1.value;

    this.subcircuitDrawSegment(
        -10,
        -38,
        0,
        -38,
        color[(value >> 15) & 1],
        xx,
        yy,
    ); // a1
    this.subcircuitDrawSegment(
        10,
        -38,
        0,
        -38,
        color[(value >> 14) & 1],
        xx,
        yy,
    ); // a2
    this.subcircuitDrawSegment(
        11.5,
        -19,
        11.5,
        -36,
        color[(value >> 13) & 1],
        xx,
        yy,
    ); // b
    this.subcircuitDrawSegment(
        11.5,
        2,
        11.5,
        -15,
        color[(value >> 12) & 1],
        xx,
        yy,
    ); // c
    this.subcircuitDrawSegment(
        -10,
        4,
        0,
        4,
        color[(value >> 11) & 1],
        xx,
        yy,
    ); // d1
    this.subcircuitDrawSegment(
        10,
        4,
        0,
        4,
        color[(value >> 10) & 1],
        xx,
        yy,
    ); // d2
    this.subcircuitDrawSegment(
        -11.5,
        2,
        -11.5,
        -15,
        color[(value >> 9) & 1],
        xx,
        yy,
    ); // e
    this.subcircuitDrawSegment(
        -11.5,
        -36,
        -11.5,
        -19,
        color[(value >> 8) & 1],
        xx,
        yy,
    ); // f
    this.subcircuitDrawSegment(
        -10,
        -17,
        0,
        -17,
        color[(value >> 7) & 1],
        xx,
        yy,
    ); // g1
    this.subcircuitDrawSegment(
        10,
        -17,
        0,
        -17,
        color[(value >> 6) & 1],
        xx,
        yy,
    ); // g2
    this.subcircuitDrawSegmentSlant(
        0,
        -17,
        -9,
        -36,
        color[(value >> 5) & 1],
        xx,
        yy,
    ); // h
    this.subcircuitDrawSegment(
        0,
        -36,
        0,
        -19,
        color[(value >> 4) & 1],
        xx,
        yy,
    ); // i
    this.subcircuitDrawSegmentSlant(
        0,
        -17,
        9,
        -36,
        color[(value >> 3) & 1],
        xx,
        yy,
    ); // j
    this.subcircuitDrawSegmentSlant(
        0,
        -17,
        9,
        0,
        color[(value >> 2) & 1],
        xx,
        yy,
    ); // k
    this.subcircuitDrawSegment(
        0,
        -17,
        0,
        2,
        color[(value >> 1) & 1],
        xx,
        yy,
    ); // l
    this.subcircuitDrawSegmentSlant(
        0,
        -17,
        -9,
        0,
        color[(value >> 0) & 1],
        xx,
        yy,
    ); // m

    ctx.beginPath();
    const dotColor = color[this.dot.value] || 'lightgrey';
    ctx.strokeStyle = dotColor;
    rect(ctx, xx + 13, yy + 5, 1, 1);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = correctWidth(1);
    rect2(ctx, -15, -42, 33, 51, xx, yy, this.direction);
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
   * @memberof SixteenSegDisplay
   * Generates Verilog string for this CircuitElement.
   * @return {string} String representing the Verilog.
   */
  generateVerilog() {
    return `
      always @ (*)
        $display("SixteenSegDisplay:{${this.input1.verilogLabel},${this.dot.verilogLabel}} = {%16b,%1b}", ${this.input1.verilogLabel}, ${this.dot.verilogLabel});`;
  }
}

/**
 * @memberof SixteenSegDisplay
 * Help Tip
 * @type {string}
 * @category modules
 */
SixteenSegDisplay.prototype.tooltipText =
  'Sixteen Display ToolTip: Consists of 16+1 bit inputs.';

/**
 * @memberof SixteenSegDisplay
 * Help URL
 * @type {string}
 * @category modules
 */
SixteenSegDisplay.prototype.helplink =
  'https://docs.circuitverse.org/#/outputs?id=sixteen-segment-display';
SixteenSegDisplay.prototype.objectType = 'SixteenSegDisplay';
SixteenSegDisplay.prototype.canShowInSubcircuit = true;
SixteenSegDisplay.prototype.layoutProperties = {
  rightDimensionX: 20,
  leftDimensionX: 15,
  upDimensionY: 42,
  downDimensionY: 10,
};

/**
 * @memberof SixteenSegDisplay
 * Mutable properties of the element
 * @type {JSON}
 * @category modules
 */
SixteenSegDisplay.prototype.mutableProperties = {
  color: {
    name: 'Color: ',
    type: 'text',
    func: 'changeColor',
  },
};
SixteenSegDisplay.prototype.constructorParameters= ['color'];
