import {CircuitElement} from '../circuit_element';

import {correctWidth, rect} from '../canvas_api';
/**
 * @class
 * Rectangle
 * @extends CircuitElement
 * @param {number} x - x coordinate of element.
 * @param {number} y - y coordinate of element.
 * @param {Scope} scope - Circuit on which element is drawn.
 * @param {number} rows - number of rows.
 * @param {number} cols - number of columns.
 * @category modules
 */
export class Rectangle extends CircuitElement {
  /**
   * @param {number} x - x coordinate of element.
   * @param {number} y - y coordinate of element.
   * @param {Scope} scope - Circuit on which element is drawn.
   * @param {number} rows - number of rows.
   * @param {number} cols - number of columns.
   */
  constructor(x, y, scope, rows = 15, cols = 20) {
    super(x, y, scope, 'RIGHT', 1);
    this.directionFixed = true;
    this.fixedBitWidth = true;
    this.rectangleObject = false;
    this.cols = cols;
    this.rows = rows;
    this.setSize();
  }

  /**
   * Change the row size.
   * @memberof Rectangle
   * @param {number} size - new size of rows
   */
  changeRowSize(size) {
    if (size === undefined || size < 5 || size > 1000) {
      return;
    }
    if (this.rows === size) {
      return;
    }
    this.rows = parseInt(size, 10);
    this.setSize();
  }

  /**
   * Change the column size.
   * @memberof Rectangle
   * @param {number} size - new size of columns
   */
  changeColSize(size) {
    if (size === undefined || size < 5 || size > 1000) {
      return;
    }
    if (this.cols === size) {
      return;
    }
    this.cols = parseInt(size, 10);
    this.setSize();
  }

  /**
     * @memberof Rectangle
     * listener function to change direction of rectangle
     * @param {string} dir - new direction
     */
  keyDown3(dir) {
    if (dir === 'ArrowRight') {
      this.changeColSize(this.cols + 2);
    }
    if (dir === 'ArrowLeft') {
      this.changeColSize(this.cols - 2);
    }
    if (dir === 'ArrowDown') {
      this.changeRowSize(this.rows + 2);
    }
    if (dir === 'ArrowUp') {
      this.changeRowSize(this.rows - 2);
    }
  }

  /**
   * @memberof Rectangle
   * Create save JSON data of object.
   * @return {JSON}
   */
  customSave() {
    const data = {
      customData: {
        rows: this.rows,
        cols: this.cols,
      },
    };
    return data;
  }

  /**
     * @memberof Rectangle
     * function to draw element
     * @param {CanvasRenderingContext2D} ctx
   */
  customDraw(ctx) {
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0,0,0,1)';
    ctx.setLineDash([5 * this.scope.scale, 5 * this.scope.scale]);
    ctx.lineWidth = correctWidth(1.5);
    const xx = this.x;
    const yy = this.y;
    rect(ctx, xx, yy, this.elementWidth, this.elementHeight);
    ctx.stroke();

    if (
      this.scope.simulationArea.lastSelected === this ||
      this.scope.simulationArea.multipleObjectSelections.includes(this)
    ) {
      ctx.fillStyle = 'rgba(255, 255, 32,0.1)';
      ctx.fill();
    }
    ctx.setLineDash([]);
  }

  /**
     * @memberof Rectangle
     * function to reset or (internally) set size
     */
  setSize() {
    this.elementWidth = this.cols * 10;
    this.elementHeight = this.rows * 10;
    this.upDimensionY = 0;
    this.leftDimensionX = 0;
    this.rightDimensionX = this.elementWidth;
    this.downDimensionY = this.elementHeight;
  }
}

/**
 * @memberof Rectangle
 * Help Tip
 * @type {string}
 * @category modules
 */
Rectangle.prototype.tooltipText =
  'Rectangle ToolTip : Used to Box the Circuit or area you want to highlight.';
Rectangle.prototype.helplink =
  'https://docs.circuitverse.org/#/chapter4/7annotation?id=rectangle';
Rectangle.prototype.propagationDelayFixed = true;

/**
 * @memberof Rectangle
 * Mutable properties of the element
 * @type {JSON}
 * @category modules
 */
Rectangle.prototype.mutableProperties = {
  cols: {
    name: 'Columns',
    type: 'number',
    max: '1000',
    min: '5',
    func: 'changeColSize',
  },
  rows: {
    name: 'Rows',
    type: 'number',
    max: '1000',
    min: '5',
    func: 'changeRowSize',
  },
};
Rectangle.prototype.objectType = 'Rectangle';
Rectangle.prototype.constructorParameters= ['rows', 'cols'];
