import {CircuitElement} from '../circuit_element';
import {Node, findNode} from '../node';


/**
 * @class
 * verilogMultiplier
 * @extends CircuitElement
 * @param {number} x - x coordinate of element.
 * @param {number} y - y coordinate of element.
 * @param {Scope} scope - Circuit on which element is drawn
 * @param {string} dir - direction of element
 * @param {number} bitWidth - bit width per node. modules.
 * @category modules
 */
export class verilogMultiplier extends CircuitElement {
  /**
   * @param {number} x - x coordinate of element.
   * @param {number} y - y coordinate of element.
   * @param {Scope} scope - Circuit on which element is drawn
   * @param {string} dir - direction of element
   * @param {number} bitWidth - bit width per node. modules.
   * @param {number} outputBitWidth - output bit width.
   */
  constructor(
      x,
      y,
      scope = globalScope,
      dir = 'RIGHT',
      bitWidth = 1,
      outputBitWidth = 1,
  ) {
    super(x, y, scope, dir, bitWidth);
    this.setDimensions(20, 20);
    this.outputBitWidth = outputBitWidth;
    this.inpA = new Node(-20, -10, 0, this, this.bitWidth, 'A');
    this.inpB = new Node(-20, 0, 0, this, this.bitWidth, 'B');
    this.product = new Node(20, 0, 1, this, this.outputBitWidth, 'Product');
  }

  /**
   * @memberof verilogMultiplier
   * Create save JSON data of object.
   * @return {JSON}
   */
  customSave() {
    const data = {
      customData: {
        direction: this.direction,
        bitWidth: this.bitWidth,
        outputBitWidth: this.outputBitWidth,
      },
      nodes: {
        inpA: findNode(this.inpA),
        inpB: findNode(this.inpB),
        product: findNode(this.product),
      },
    };
    return data;
  }

  /**
   * @memberof verilogMultiplier
   * Checks if the output value can be determined.
   * @return {boolean}
   */
  isResolvable() {
    return this.inpA.value !== undefined && this.inpB.value !== undefined;
  }

  /**
     * @memberof verilogMultiplier
     * function to change bitwidth of the element
     * @param {number} bitWidth - new bitwidth
     */
  newBitWidth(bitWidth) {
    this.bitWidth = bitWidth;
    this.inpA.bitWidth = bitWidth;
    this.inpB.bitWidth = bitWidth;
    this.product.bitWidth = bitWidth;
  }

  /**
   * @memberof verilogMultiplier
   * Determine output values and add to simulation queue.
   */
  resolve() {
    if (this.isResolvable() === false) {
      return;
    }
    const product = this.inpA.value * this.inpB.value;

    this.product.value =
      (product << (32 - this.outputBitWidth)) >>>
      (32 - this.outputBitWidth);
    globalScope.simulationArea.simulationQueue.add(this.product);
  }
}

/**
 * @memberof verilogMultiplier
 * Help Tip
 * @type {string}
 * @category modules
 */
verilogMultiplier.prototype.tooltipText =
  'verilogMultiplier ToolTip : Performs addition of numbers.';
verilogMultiplier.prototype.helplink =
  'https://docs.circuitverse.org/#/miscellaneous?id=verilogMultiplier';
verilogMultiplier.prototype.objectType = 'verilogMultiplier';
verilogMultiplier.prototype.constructorParameters= [
  'direction',
  'bitWidth',
  'outputBitWidth',
];
