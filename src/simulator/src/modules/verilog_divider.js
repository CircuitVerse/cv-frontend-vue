import {CircuitElement} from '../circuit_element';
import {Node, findNode} from '../node';


/**
 * @class
 * verilogDivider
 * @extends CircuitElement
 * @param {number} x - x coordinate of element.
 * @param {number} y - y coordinate of element.
 * @param {Scope} scope - Circuit on which element is drawn
 * @param {string} dir - direction of element
 * @param {number} bitWidth - bit width per node. modules
 * @category modules
 */
export class verilogDivider extends CircuitElement {
  /**
   * @param {number} x - x coordinate of element.
   * @param {number} y - y coordinate of element.
   * @param {Scope} scope - Circuit on which element is drawn
   * @param {string} dir - direction of element
   * @param {number} bitWidth - bit width per node. modules
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
    this.quotient = new Node(
        20,
        0,
        1,
        this,
        this.outputBitWidth,
        'Quotient',
    );
    this.remainder = new Node(
        20,
        0,
        1,
        this,
        this.outputBitWidth,
        'Remainder',
    );
  }

  /**
   * @memberof verilogDivider
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
        quotient: findNode(this.quotient),
        remainder: findNode(this.remainder),
      },
    };
    return data;
  }

  /**
   * @memberof verilogDivider
   * Checks if the output value can be determined.
   * @return {boolean}
   */
  isResolvable() {
    return this.inpA.value !== undefined && this.inpB.value !== undefined;
  }

  /**
     * @memberof verilogDivider
     * function to change bitwidth of the element
     * @param {number} bitWidth - new bitwidth
     */
  newBitWidth(bitWidth) {
    this.bitWidth = bitWidth;
    this.inpA.bitWidth = bitWidth;
    this.inpB.bitWidth = bitWidth;
    this.quotient.bitWidth = bitWidth;
    this.remainder.bitWidth = bitWidth;
  }

  /**
   * @memberof verilogDivider
   * Determine output values and add to simulation queue.
   */
  resolve() {
    if (this.isResolvable() === false) {
      return;
    }
    const quotient = this.inpA.value / this.inpB.value;
    const remainder = this.inpA.value % this.inpB.value;
    this.remainder.value =
      (remainder << (32 - this.outputBitWidth)) >>>
      (32 - this.outputBitWidth);
    this.quotient.value =
      (quotient << (32 - this.outputBitWidth)) >>>
      (32 - this.outputBitWidth);
    globalScope.simulationArea.simulationQueue.add(this.quotient);
    globalScope.simulationArea.simulationQueue.add(this.remainder);
  }
}

/**
 * @memberof verilogDivider
 * Help Tip
 * @type {string}
 * @category modules
 */
verilogDivider.prototype.tooltipText =
  'verilogDivider ToolTip : Performs addition of numbers.';
verilogDivider.prototype.helplink =
  'https://docs.circuitverse.org/#/miscellaneous?id=verilogDivider';
verilogDivider.prototype.objectType = 'verilogDivider';
verilogDivider.prototype.constructorParameters= [
  'direction',
  'bitWidth',
  'outputBitWidth',
];
