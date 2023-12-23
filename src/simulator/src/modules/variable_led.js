import {CircuitElement} from '../circuit_element';
import {Node, findNode} from '../node';

import {
  correctWidth,
  lineTo,
  moveTo,
  arc,
  drawCircle2,
  colorToRGBA,
  validColor,
} from '../canvas_api';
import {colors} from '../themer/themer';
/**
 * @class
 * VariableLed
 * @extends CircuitElement
 * @param {number} x - x coordinate of element.
 * @param {number} y - y coordinate of element.
 * @param {Scope} scope - Circuit on which element is drawn.
 * @category modules
 */
export class VariableLed extends CircuitElement {
  /**
   * @param {number} x - x coordinate of element.
   * @param {number} y - y coordinate of element.
   * @param {Scope} scope - Circuit on which element is drawn.
   * @param {string} color - color
   */
  constructor(x, y, scope = globalScope, color = 'Red') {
    super(x, y, scope, 'UP', 8);
    this.rectangleObject = false;
    this.setDimensions(10, 20);
    this.inp1 = new Node(-40, 0, 0, this, 8);
    this.directionFixed = true;
    this.fixedBitWidth = true;
    this.color = color;
    const temp = colorToRGBA(this.color);
    this.actualColor = `rgba(${temp[0]},${temp[1]},${temp[2]},${0.8})`;
  }

  /**
     * @memberof VariableLed
     * fn to change the color of VariableLed
     * @param {string} value - color to change to.
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
     * @memberof VariableLed
     * fn to set the rgba value of the color
     * @param {number} alpha - alpha value of the color.
     * @return {string}
     */
  createRGBA(alpha = 1) {
    const len = this.actualColor.length;
    const temp = this.actualColor
        .split('')
        .slice(5, len - 1)
        .join('')
        .split(',');
    if (alpha.toString() === 'NaN') {
      return `rgba(${temp[0]}, ${temp[1]}, ${temp[2]}, 1)`;
    }
    return `rgba(${temp[0]},${temp[1]},${temp[2]},${alpha})`;
  }

  /**
   * @memberof VariableLed
   * Create save JSON data of object.
   * @return {JSON}
   */
  customSave() {
    const data = {
      customData: {
        color: this.color,
      },
      nodes: {
        inp1: findNode(this.inp1),
      },
    };
    return data;
  }

  /**
     * @memberof VariableLed
     * function to draw element
     * @param {CanvasRenderingContext2D} ctx
   */
  customDraw(ctx) {
    const xx = this.x;
    const yy = this.y;

    ctx.strokeStyle = '#353535';
    ctx.lineWidth = correctWidth(3);
    ctx.beginPath();
    moveTo(ctx, -20, 0, xx, yy, this.direction);
    lineTo(ctx, -40, 0, xx, yy, this.direction);
    ctx.stroke();
    const c = this.inp1.value;
    const alpha = c / 255;
    ctx.strokeStyle = '#090a0a';
    ctx.fillStyle = [this.createRGBA(alpha), 'rgba(227, 228, 229, 0.8)'][
        (c === undefined || c === 0) + 0
    ];
    ctx.lineWidth = correctWidth(1);

    ctx.beginPath();

    moveTo(ctx, -20, -9, xx, yy, this.direction);
    lineTo(ctx, 0, -9, xx, yy, this.direction);
    arc(ctx, 0, 0, 9, -Math.PI / 2, Math.PI / 2, xx, yy, this.direction);
    lineTo(ctx, -20, 9, xx, yy, this.direction);
    lineTo(ctx, -20, -9, xx, yy, this.direction);
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

  /**
   * Draws the element in the subcircuit. Used in layout mode
   * @param {CanvasRenderingContext2D} ctx
   * @param {*} xOffset x position to draw the subcircuit.
   * @param {*} yOffset y position to draw the subcircuit.
   */
  subcircuitDraw(ctx, xOffset = 0, yOffset = 0) {
    const xx = this.subcircuitMetadata.x + xOffset;
    const yy = this.subcircuitMetadata.y + yOffset;

    const c = this.inp1.value;
    const alpha = c / 255;
    ctx.strokeStyle = '#090a0a';
    ctx.fillStyle = [this.createRGBA(alpha), 'rgba(227, 228, 229, 0.8)'][
        (c === undefined || c == 0) + 0
    ];
    ctx.lineWidth = correctWidth(1);

    ctx.beginPath();
    drawCircle2(ctx, 0, 0, 6, xx, yy, this.direction);
    ctx.stroke();

    if (
      (this.hover && !globalScope.simulationArea.shiftDown) ||
      globalScope.simulationArea.lastSelected == this ||
      globalScope.simulationArea.multipleObjectSelections.includes(this)
    ) {
      ctx.fillStyle = 'rgba(255, 255, 32,0.8)';
    }
    ctx.fill();
  }

  /**
   * @memberof VariableLed
   * Generates Verilog string for this CircuitElement.
   * @return {string} String representing the Verilog.
   */
  generateVerilog() {
    return `
      always @ (*)
        $display("VeriableLed:${this.inp1.verilogLabel}=%d", `+
        `${this.inp1.verilogLabel});`;
  }
}

/**
 * @memberof VariableLed
 * Help Tip
 * @type {string}
 * @category modules
 */
VariableLed.prototype.tooltipText = 'Variable Led ToolTip: Variable LED ' +
        'inputs an 8 bit value and glows with a proportional intensity.';

/**
 * @memberof VariableLed
 * Mutable properties of the element
 * @type {JSON}
 * @category modules
 */
VariableLed.prototype.mutableProperties = {
  color: {
    name: 'Color: ',
    type: 'text',
    func: 'changeColor',
  },
};

/**
 * @memberof VariableLed
 * Help URL
 * @type {string}
 * @category modules
 */
VariableLed.prototype.helplink =
  'https://docs.circuitverse.org/#/outputs?id=variable-led';
VariableLed.prototype.objectType = 'VariableLed';
VariableLed.prototype.canShowInSubcircuit = true;
VariableLed.prototype.constructorParameters= ['color'];
