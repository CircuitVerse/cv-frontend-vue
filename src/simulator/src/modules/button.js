import {CircuitElement} from '../circuit_element';
import {Node, findNode} from '../node';

import {correctWidth, lineTo, moveTo, drawCircle2} from '../canvas_api';

/**
 * @class
 * Button
 * @extends CircuitElement
 * @param {number} x - x coordinate of element.
 * @param {number} y - y coordinate of element.
 * @param {Scope} scope - Circuit on which element is drawn
 * @param {string} dir - direction of element
 * @category modules
 */
export class Button extends CircuitElement {
  /**
* @param {number} x - x coordinate of element.
 * @param {number} y - y coordinate of element.
 * @param {Scope} scope - Circuit on which element is drawn
 * @param {string} dir - direction of element
     */
  constructor(x, y, scope = globalScope, dir = 'RIGHT') {
    super(x, y, scope, dir, 1);
    this.state = 0;
    this.output1 = new Node(30, 0, 1, this);
    this.wasClicked = false;
    this.rectangleObject = false;
    this.setDimensions(10, 10);
  }

  /**
   * @memberof Button
   * Create save JSON data of object.
   * @return {JSON}
   */
  customSave() {
    const data = {
      nodes: {
        output1: findNode(this.output1),
      },
      customData: {
        state: this.state,
        direction: this.direction,
        bitWidth: this.bitWidth,
      },
    };
    return data;
  }

  /**
   * @memberof Button
   * Determine output values and add to simulation queue.
   */
  resolve() {
    if (this.wasClicked) {
      this.state = 1;
      this.output1.value = this.state;
    } else {
      this.state = 0;
      this.output1.value = this.state;
    }
    globalScope.simulationArea.simulationQueue.add(this.output1);
  }

  /**
     * @memberof Button
     * function to draw element
     * @param {CanvasRenderingContext2D} ctx
   */
  customDraw(ctx) {
    const xx = this.x;
    const yy = this.y;
    ctx.fillStyle = '#ddd';

    ctx.strokeStyle = '#353535';
    ctx.lineWidth = correctWidth(5);

    ctx.beginPath();

    moveTo(ctx, 10, 0, xx, yy, this.direction);
    lineTo(ctx, 30, 0, xx, yy, this.direction);
    ctx.stroke();

    ctx.beginPath();

    drawCircle2(ctx, 0, 0, 12, xx, yy, this.direction);
    ctx.stroke();

    if (
      (this.hover && !globalScope.simulationArea.shiftDown) ||
      globalScope.simulationArea.lastSelected === this ||
      globalScope.simulationArea.multipleObjectSelections.includes(this)
    ) {
      ctx.fillStyle = 'rgba(232, 13, 13,0.6)';
    }

    if (this.wasClicked) {
      ctx.fillStyle = 'rgba(232, 13, 13,0.8)';
    }
    ctx.fill();
  }

  /**
   * Draw subcircuit
   * @param {CanvasRenderingContext2D} ctx
   * @param {*} xOffset
   * @param {*} yOffset
   */
  subcircuitDraw(ctx, xOffset = 0, yOffset = 0) {
    const xx = this.subcircuitMetadata.x + xOffset;
    const yy = this.subcircuitMetadata.y + yOffset;
    ctx.fillStyle = '#ddd';

    ctx.strokeStyle = '#353535';
    ctx.lineWidth = correctWidth(3);
    ctx.beginPath();
    drawCircle2(ctx, 0, 0, 6, xx, yy, this.direction);
    ctx.stroke();
    if (
      (this.hover && !globalScope.simulationArea.shiftDown) ||
      globalScope.simulationArea.lastSelected == this ||
      globalScope.simulationArea.multipleObjectSelections.includes(this)
    ) {
      ctx.fillStyle = 'rgba(232, 13, 13,0.6)';
    }
    if (this.wasClicked) {
      ctx.fillStyle = 'rgba(232, 13, 13,0.8)';
    }
    ctx.fill();
  }
  /**
   * Verilog instructions for unsupported elements.
   * @return {string} Verilog instructions for unsupported elements.
   */
  static verilogInstructions() {
    return `Button - Buttons are not natively supported in verilog, ` +
      `consider using Inputs instead\n`;
  }

  /**
   * Verilog base type.
   * @return {string} Unique Verilog type name.
   */
  verilogBaseType() {
    return this.verilogName() + (Button.selSizes.length - 1);
  }

  /**
   * @memberof Button
   * Generates Verilog string for this CircuitElement.
   * @return {string} String representing the Verilog.
   */
  generateVerilog() {
    Button.selSizes.push(this.data);
    return CircuitElement.prototype.generateVerilog.call(this);
  }

  /**
   * @memberof Button
   * Generate Verilog string for this CircuitClement.
   * @return {string} String describing this element in Verilog.
   */
  static moduleVerilog() {
    let output = '';

    for (let i = 0; i < Button.selSizes.length; i++) {
      output += `// Skeleton for Button${i}
    /*
    module Button${i}(out);
      output reg out;
    
      initial begin
        //do something with the button here
      end
    endmodule
    */
    `;
    }

    return output;
  }

  // reset the sized before Verilog generation
  static resetVerilog() {
    Button.selSizes = [];
  }
}

/**
 * @memberof Button
 * Help Tip
 * @type {string}
 * @category modules
 */
Button.prototype.tooltipText =
  'Button ToolTip: High(1) when pressed and Low(0) when released.';

/**
 * @memberof Button
 * Help URL
 * @type {string}
 * @category modules
 */
Button.prototype.helplink =
  'https://docs.circuitverse.org/#/inputElements?id=button';

/**
 * @memberof Button
 * @type {number}
 * @category modules
 */
Button.prototype.propagationDelay = 0;
Button.prototype.objectType = 'Button';
Button.prototype.canShowInSubcircuit = true;
Button.prototype.constructorParameters= ['direction', 'bitWidth'];
