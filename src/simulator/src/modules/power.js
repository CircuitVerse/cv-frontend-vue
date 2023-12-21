import {CircuitElement} from '../circuit_element';
import {Node, findNode} from '../node';
import {simulationArea} from '../simulation_area';
import {correctWidth, lineTo, moveTo} from '../canvas_api';
import {colors} from '../themer/themer';
/**
 * @class
 * Power
 * @extends CircuitElement
 * @param {number} x - x coordinate of element.
 * @param {number} y - y coordinate of element.
 * @param {Scope} scope - Circuit on which element is drawn
 * @param {number} bitWidth - bit width per node.
 * @category modules
 */
export class Power extends CircuitElement {
  /**
    * @param {number} x - x coordinate of element.
    * @param {number} y - y coordinate of element.
    * @param {Scope} scope - Circuit on which element is drawn
    * @param {number} bitWidth - bit width per node.
    */
  constructor(x, y, scope = globalScope, bitWidth = 1) {
    super(x, y, scope, 'RIGHT', bitWidth);
    this.directionFixed = true;
    this.rectangleObject = false;
    this.setDimensions(10, 10);
    this.output1 = new Node(0, 10, 1, this);
  }

  /**
     * @memberof Power
     * resolve output values based on inputData
     */
  resolve() {
    this.output1.value = ~0 >>> (32 - this.bitWidth);
    simulationArea.simulationQueue.add(this.output1);
  }

  /**
   * @memberof Power
   * Create save JSON data of object.
   * @return {JSON}
   */
  customSave() {
    const data = {
      nodes: {
        output1: findNode(this.output1),
      },
      customData: {
        bitWidth: this.bitWidth,
      },
    };
    return data;
  }

  /**
     * @memberof Power
     * function to draw element
     */
  customDraw() {
    const ctx = simulationArea.context;
    const xx = this.x;
    const yy = this.y;
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0,0,0,1)';
    ctx.lineWidth = correctWidth(3);
    ctx.fillStyle = colors['fill'];
    moveTo(ctx, 0, -10, xx, yy, this.direction);
    lineTo(ctx, -10, 0, xx, yy, this.direction);
    lineTo(ctx, 10, 0, xx, yy, this.direction);
    lineTo(ctx, 0, -10, xx, yy, this.direction);
    ctx.closePath();
    ctx.stroke();
    if (
      (this.hover && !simulationArea.shiftDown) ||
      simulationArea.lastSelected === this ||
      simulationArea.multipleObjectSelections.includes(this)
    ) {
      ctx.fillStyle = colors['hover_select'];
    }
    ctx.fill();
    moveTo(ctx, 0, 0, xx, yy, this.direction);
    lineTo(ctx, 0, 10, xx, yy, this.direction);
    ctx.stroke();
  }

  /**
   * @memberof Power
   * Generates Verilog string for this CircuitElement.
   * @return {string} String representing the Verilog.
   */
  generateVerilog() {
    return `assign ${this.output1.verilogLabel} = ~${this.bitWidth}'b0;`;
  }
}

/**
 * @memberof Power
 * Help Tip
 * @type {string}
 * @category modules
 */
Power.prototype.tooltipText = 'Power: All bits are High(1).';

/**
 * @memberof Power
 * Help URL
 * @type {string}
 * @category modules
 */
Power.prototype.helplink =
  'https://docs.circuitverse.org/#/inputElements?id=power';

/**
 * @memberof Power
 * @type {number}
 * @category modules
 */
Power.prototype.propagationDelay = 0;
Power.prototype.objectType = 'Power';
Power.prototype.constructorParameters= ['bitWidth'];
