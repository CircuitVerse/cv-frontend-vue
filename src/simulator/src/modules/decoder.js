import {CircuitElement} from '../circuit_element';
import {Node, findNode} from '../node';

import {correctWidth, lineTo, moveTo, fillText} from '../canvas_api';
import {colors} from '../themer/themer';
/**
 * @class
 * Decoder
 * @extends CircuitElement
 * @param {number} x - x coordinate of element.
 * @param {number} y - y coordinate of element.
 * @param {Scope} scope - Circuit on which element is drawn.
 * @param {string} dir - direction of element.
 * @param {number} bitWidth - bit width per node.
 * @category modules
 */
export class Decoder extends CircuitElement {
  /**
   * @param {number} x - x coordinate of element.
   * @param {number} y - y coordinate of element.
   * @param {Scope} scope - Circuit on which element is drawn.
   * @param {string} dir - direction of element.
   * @param {number} bitWidth - bit width per node.
   */
  constructor(x, y, scope, dir = 'LEFT', bitWidth = 1) {
    super(x, y, scope, dir, bitWidth);
    this.outputsize = 1 << this.bitWidth;
    this.xOff = 0;
    this.yOff = 1;
    if (this.bitWidth === 1) {
      this.xOff = 10;
    }
    if (this.bitWidth <= 3) {
      this.yOff = 2;
    }
    this.newBitWidth = function(bitWidth) {
      if (bitWidth === undefined || bitWidth < 1 || bitWidth > 32) {
        return;
      }
      if (this.bitWidth === bitWidth) {
        return;
      }
      const obj = new Decoder(
          this.x,
          this.y,
          this.scope,
          this.direction,
          bitWidth,
      );
      this.cleanDelete();
      this.scope.simulationArea.lastSelected = obj;
      return obj;
    };

    this.setDimensions(20 - this.xOff, this.yOff * 5 * this.outputsize);
    this.rectangleObject = false;
    this.input = new Node(20 - this.xOff, 0, 0, this);

    this.output1 = [];
    for (let i = 0; i < this.outputsize; i++) {
      const a = new Node(
          -20 + this.xOff,
          +this.yOff * 10 * (i - this.outputsize / 2) + 10,
          1,
          this,
          1,
      );
      this.output1.push(a);
    }
  }

  /**
   * @memberof Decoder
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
        output1: this.output1.map(findNode),
        input: findNode(this.input),
      },
    };
    return data;
  }

  /**
   * @memberof Decoder
   * Determine output values and add to simulation queue.
   */
  resolve() {
    for (let i = 0; i < this.output1.length; i++) {
      this.output1[i].value = 0;
    }
    if (this.input.value !== undefined) {
      this.output1[this.input.value].value = 1;
    } // if input is undefined, don't change output
    for (let i = 0; i < this.output1.length; i++) {
      this.scope.simulationArea.simulationQueue.add(this.output1[i]);
    }
  }

  /**
     * @memberof Decoder
     * function to draw element
      * @param {CanvasRenderingContext2D} ctx
   */
  customDraw(ctx) {
    const xx = this.x;
    const yy = this.y;
    ctx.beginPath();
    ctx.strokeStyle = colors['stroke'];
    ctx.lineWidth = correctWidth(4);
    ctx.fillStyle = colors['fill'];
    moveTo(
        ctx,
        -20 + this.xOff,
        -this.yOff * 10 * (this.outputsize / 2),
        xx,
        yy,
        this.direction,
    );
    lineTo(
        ctx,
        -20 + this.xOff,
        20 + this.yOff * 10 * (this.outputsize / 2 - 1),
        xx,
        yy,
        this.direction,
    );
    lineTo(
        ctx,
        20 - this.xOff,
        +this.yOff * 10 * (this.outputsize / 2 - 1) + this.xOff,
        xx,
        yy,
        this.direction,
    );
    lineTo(
        ctx,
        20 - this.xOff,
        -this.yOff * 10 * (this.outputsize / 2) - this.xOff + 20,
        xx,
        yy,
        this.direction,
    );

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
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    for (let i = 0; i < this.outputsize; i++) {
      if (this.direction === 'LEFT') {
        fillText(
            ctx,
            String(i),
            xx + this.output1[i].x - 7,
            yy + this.output1[i].y + 2,
            10,
        );
      } else if (this.direction === 'RIGHT') {
        fillText(
            ctx,
            String(i),
            xx + this.output1[i].x + 7,
            yy + this.output1[i].y + 2,
            10,
        );
      } else if (this.direction === 'UP') {
        fillText(
            ctx,
            String(i),
            xx + this.output1[i].x,
            yy + this.output1[i].y - 5,
            10,
        );
      } else {
        fillText(
            ctx,
            String(i),
            xx + this.output1[i].x,
            yy + this.output1[i].y + 10,
            10,
        );
      }
    }
    ctx.fill();
  }

  /**
   * Verilog base type.
   * @return {string} Unique Verilog type name.
   */
  verilogBaseType() {
    return this.verilogName() + this.output1.length;
  }

  /**
   * @memberof Decoder
   * Generates Verilog string for this CircuitElement.
   * @return {string} String representing the Verilog.
   */
  generateVerilog() {
    Decoder.selSizes.add(this.bitWidth);
    return CircuitElement.prototype.generateVerilog.call(this);
  }

  /**
   * @memberof Decoder
   * Generate Verilog string for this CircuitClement.
   * @return {string} String describing this element in Verilog.
   */
  static moduleVerilog() {
    let output = '';

    for (const size of Decoder.selSizes) {
      const numOutput = 1 << size;
      output += '\n';
      output += 'module Decoder' + numOutput;
      output += '(';
      for (let j = 0; j < numOutput; j++) {
        output += 'out' + j + ', ';
      }
      output += 'sel);\n';

      output += '  output reg ';
      for (let j = 0; j < numOutput - 1; j++) {
        output += 'out' + j + ', ';
      }
      output += 'out' + (numOutput - 1) + ';\n';

      output += '  input [' + (size - 1) + ':0] sel;\n';
      output += '  \n';

      output += '  always @ (*) begin\n';
      for (let j = 0; j < numOutput; j++) {
        output += '    out' + j + ' = 0;\n';
      }
      output += '    case (sel)\n';
      for (let j = 0; j < numOutput; j++) {
        output += '      ' + j + ' : out' + j + ' = 1;\n';
      }
      output += '    endcase\n';
      output += '  end\n';
      output += 'endmodule\n';
    }
    return output;
  }

  /**
   * reset the sized before Verilog generation
   */
  static resetVerilog() {
    Decoder.selSizes = new Set();
  }
}

/**
 * @memberof Decoder
 * Help Tip
 * @type {string}
 * @category modules
 */
Decoder.prototype.tooltipText =
  'Decoder ToolTip : Converts coded inputs into coded outputs.';
Decoder.prototype.helplink =
  'https://docs.circuitverse.org/#/decodersandplexers?id=decoder';
Decoder.prototype.objectType = 'Decoder';
Decoder.prototype.constructorParameters= ['direction', 'bitWidth'];
