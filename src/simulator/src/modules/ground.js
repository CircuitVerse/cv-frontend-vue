import {CircuitElement} from '../circuit_element';
import {Node, findNode} from '../node';
import {simulationArea} from '../simulation_area';
import {correctWidth, lineTo, moveTo} from '../canvas_api';
import {colors} from '../themer/themer';
/**
 * @class
 * Ground
 * @extends CircuitElement
 * @param {number} x - x coordinate of element.
 * @param {number} y - y coordinate of element.
 * @param {Scope} scope - Circuit on which element is drawn
 * @param {number} bitWidth - bit width per node.
 * @category modules
 */
export class Ground extends CircuitElement {
  constructor(x, y, scope = globalScope, bitWidth = 1) {
    super(x, y, scope, 'RIGHT', bitWidth);
    this.rectangleObject = false;
    this.setDimensions(10, 10);
    this.directionFixed = true;
    this.output1 = new Node(0, -10, 1, this);
  }

  /**
   * @memberof Ground
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
     * @memberof Ground
     * resolve output values based on inputData
     */
  resolve() {
    this.output1.value = 0;
    simulationArea.simulationQueue.add(this.output1);
  }

  /**
   * @memberof Ground
   * function to draw element
   */
  customDraw() {
    const ctx = simulationArea.context;
    //
    ctx.beginPath();
    ctx.strokeStyle = [colors['stroke'], 'brown'][
        ((this.hover && !simulationArea.shiftDown) ||
        simulationArea.lastSelected === this ||
        simulationArea.multipleObjectSelections.includes(this)) + 0
    ];
    ctx.lineWidth = correctWidth(3);

    const xx = this.x;
    const yy = this.y;

    moveTo(ctx, 0, -10, xx, yy, this.direction);
    lineTo(ctx, 0, 0, xx, yy, this.direction);
    moveTo(ctx, -10, 0, xx, yy, this.direction);
    lineTo(ctx, 10, 0, xx, yy, this.direction);
    moveTo(ctx, -6, 5, xx, yy, this.direction);
    lineTo(ctx, 6, 5, xx, yy, this.direction);
    moveTo(ctx, -2.5, 10, xx, yy, this.direction);
    lineTo(ctx, 2.5, 10, xx, yy, this.direction);
    ctx.stroke();
  }

  /**
   * @memberof Ground
   * Generates Verilog string for this CircuitElement.
   * @return {string} String representing the Verilog.
   */
  generateVerilog() {
    return `assign ${this.output1.verilogLabel} = ${this.bitWidth}'b0;`;
  }
}

/**
 * @memberof Ground
 * Help Tip
 * @type {string}
 * @category modules
 */
Ground.prototype.tooltipText = 'Ground: All bits are Low(0).';

/**
 * @memberof Ground
 * Help URL
 * @type {string}
 * @category modules
 */
Ground.prototype.helplink =
  'https://docs.circuitverse.org/#/inputElements?id=ground';

/**
 * @memberof Ground
 * @type {number}
 * @category modules
 */
Ground.prototype.propagationDelay = 0;
Ground.prototype.objectType = 'Ground';
Ground.prototype.constructorParameters= ['direction', 'bitWidth'];