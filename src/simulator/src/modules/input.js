import {CircuitElement} from '../circuit_element';
import {Node, findNode} from '../node';

import {correctWidth, oppositeDirection, fillText} from '../canvas_api';
import {getNextPosition} from '../modules';
import {converters, generateId} from '../utils';
import {colors} from '../themer/themer';

/**
 * @class
 * Input
 * @extends CircuitElement
 * @param {number} x - x coordinate of element.
 * @param {number} y - y coordinate of element.
 * @param {Scope} scope - Circuit on which element is drawn.
 * @param {string} dir - direction of element.
 * @param {number} bitWidth - bit width per node.
 * @param {Object=} layoutProperties - x,y and id.
 * @category modules
 */
export class Input extends CircuitElement {
  /**
   * @param {number} x - x coordinate of element.
   * @param {number} y - y coordinate of element.
   * @param {Scope} scope - Circuit on which element is drawn.
   * @param {string} dir - direction of element.
   * @param {number} bitWidth - bit width per node.
   * @param {Object=} layoutProperties - x,y and id.
   * @param {number} state - state of input.
   * @category modules
   */
  constructor(
      x,
      y,
      scope,
      dir = 'RIGHT',
      bitWidth = 1,
      layoutProperties,
      state = 0,
  ) {
    super(x, y, scope, dir, bitWidth);
    if (layoutProperties) {
      this.layoutProperties = layoutProperties;
    } else {
      this.layoutProperties = {};
      this.layoutProperties.x = 0;
      this.layoutProperties.y = getNextPosition(0, scope);
      this.layoutProperties.id = generateId();
    }
    this.state = state;
    this.orientationFixed = false;
    this.output1 = new Node(this.bitWidth * 10, 0, 1, this);
    this.wasClicked = false;
    this.directionFixed = true;
    this.setWidth(this.bitWidth * 10);
    this.rectangleObject = true; // Trying to make use of base class draw
  }

  /**
   * @memberof Input
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
        layoutProperties: this.layoutProperties,
      },
    };
    return data;
  }

  /**
   * @memberof Input
   * Determine output values and add to simulation queue.
   */
  resolve() {
    this.output1.value = this.state;
    this.scope.simulationArea.simulationQueue.add(this.output1);
  }

  /**
   * @memberof Input
   * Change bitwidth of the element
   * @param {number} bitWidth - new bitwidth
   */
  newBitWidth(bitWidth) {
    if (bitWidth < 1) {
      return;
    }
    const diffBitWidth = bitWidth - this.bitWidth;
    this.bitWidth = bitWidth; // ||parseInt(prompt("Enter bitWidth"),10);
    this.setWidth(this.bitWidth * 10);
    this.state = 0;
    this.output1.bitWidth = bitWidth;
    if (this.direction === 'RIGHT') {
      this.x -= 10 * diffBitWidth;
      this.output1.x = 10 * this.bitWidth;
      this.output1.leftX = 10 * this.bitWidth;
    } else if (this.direction === 'LEFT') {
      this.x += 10 * diffBitWidth;
      this.output1.x = -10 * this.bitWidth;
      this.output1.leftX = 10 * this.bitWidth;
    }
  }

  /**
   * @memberof Input
   * listener function to set selected index
   */
  click() {
    // toggle
    let pos = this.findPos();
    if (pos === 0) {
      pos = 1;
    } // minor correction
    if (pos < 1 || pos > this.bitWidth) {
      return;
    }
    this.state = ((this.state >>> 0) ^ (1 << (this.bitWidth - pos))) >>> 0;
  }

  /**
   * @memberof Input
   * function to draw element
   * @param {CanvasRenderingContext2D} ctx
   */
  customDraw(ctx) {
    ctx.beginPath();
    ctx.lineWidth = correctWidth(3);
    const xx = this.x;
    const yy = this.y;
    ctx.beginPath();
    ctx.fillStyle = colors['input_text'];
    ctx.textAlign = 'center';
    const bin = converters.dec2bin(this.state, this.bitWidth);
    for (let k = 0; k < this.bitWidth; k++) {
      fillText(ctx, bin[k], xx - 10 * this.bitWidth + 10 + k * 20, yy + 5);
    }
    ctx.fill();
  }

  /**
   * @memberof Input
   * function to change direction of input
   * @param {string} dir - new direction
   */
  newDirection(dir) {
    if (dir === this.direction) {
      return;
    }
    this.direction = dir;
    this.output1.refresh();
    if (dir === 'RIGHT' || dir === 'LEFT') {
      this.output1.leftX = 10 * this.bitWidth;
      this.output1.leftY = 0;
    } else {
      this.output1.leftX = 10; // 10*this.bitWidth;
      this.output1.leftY = 0;
    }

    this.output1.refresh();
    this.labelDirection = oppositeDirection[this.direction];
  }

  /**
   * @memberof Input
   * function to find position of mouse click
   * @return {number}
   */
  findPos() {
    return Math.round(
        (this.scope.simulationArea.mouseX - this.x + 10 * this.bitWidth) / 20.0,
    );
  }
}

/**
 * @memberof Input
 * Help Tip
 * @type {string}
 * @category modules
 */
Input.prototype.tooltipText =
  'Input ToolTip: Toggle the individual bits by clicking on them.';

/**
 * @memberof Input
 * Help URL
 * @type {string}
 * @category modules
 */
Input.prototype.helplink =
  'https://docs.circuitverse.org/#/inputElements?id=input';

/**
 * @memberof Input
 * @type {number}
 * @category modules
 */
Input.prototype.propagationDelay = 0;
Input.prototype.objectType = 'Input';
Input.prototype.constructorParameters= [
  'direction',
  'bitWidth',
  'layoutProperties',
  'state',
];
