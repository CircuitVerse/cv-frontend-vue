import {CircuitElement} from '../circuit_element';

import {correctWidth, lineTo, moveTo} from '../canvas_api';
import {colors} from '../themer/themer';

/**
 * @class
 * Arrow
 * @extends CircuitElement
 * @param {number} x - x coordinate of element.
 * @param {number} y - y coordinate of element.
 * @param {Scope} scope - Circuit on which element is drawn
 * @param {string} dir - direction of element
 * @category modules
 */
export class Arrow extends CircuitElement {
  /**
   * Create an Arrow
   * @param {number} x x coordinate
   * @param {number} y y coordinate
   * @param {Scope} scope Circuit on which and gate is drawn
   * @param {string} dir direction
   */
  constructor(x, y, scope = globalScope, dir = 'RIGHT') {
    super(x, y, scope, dir, 8);
    this.rectangleObject = false;
    this.fixedBitWidth = true;
    this.setDimensions(30, 20);
  }

  /**
   * @memberof Arrow
   * Create save JSON data of object.
   * @return {JSON}
   */
  customSave() {
    const data = {
      customData: {
        direction: this.direction,
      },
    };
    return data;
  }

  /**
   * @memberof Arrow
   * function to draw element
   * @param {CanvasRenderingContext2D} ctx
   */
  customDraw(ctx) {
    ctx.lineWidth = correctWidth(3);
    const xx = this.x;
    const yy = this.y;
    ctx.strokeStyle = colors['stroke_alt'];
    ctx.fillStyle = colors['fill'];

    ctx.beginPath();

    moveTo(ctx, -30, -3, xx, yy, this.direction);
    lineTo(ctx, 10, -3, xx, yy, this.direction);
    lineTo(ctx, 10, -15, xx, yy, this.direction);
    lineTo(ctx, 30, 0, xx, yy, this.direction);
    lineTo(ctx, 10, 15, xx, yy, this.direction);
    lineTo(ctx, 10, 3, xx, yy, this.direction);
    lineTo(ctx, -30, 3, xx, yy, this.direction);
    ctx.closePath();
    ctx.stroke();
    if (
      (this.hover && !globalScope.simulationArea.shiftDown) ||
      globalScope.simulationArea.lastSelected === this ||
      globalScope.simulationArea.multipleObjectSelections.includes(this)
    ) {
      ctx.fillStyle = colors['hover_select'];
    }
    ctx.fill();
  }
}

/**
 * @memberof Arrow
 * Help Tip
 * @type {string}
 * @category modules
 */
Arrow.prototype.tooltipText = 'Arrow ToolTip : Arrow Selected.';
Arrow.prototype.propagationDelayFixed = true;
Arrow.prototype.helplink = 'https://docs.circuitverse.org/#/annotation?id=arrow';
Arrow.prototype.objectType = 'Arrow';
Arrow.prototype.constructorParameters = ['direction'];
