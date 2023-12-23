import {CircuitElement} from '../circuit_element';
import {Node, findNode} from '../node';

import {correctWidth, lineTo, moveTo, arc} from '../canvas_api';
import {changeInputSize} from '../modules';
import {colors} from '../themer/themer';
import {gateGenerateVerilog} from '../utils';

/**
 * @class
 * AndGate
 * @extends CircuitElement
 * @param {number} x - x coordinate
 * @param {number} y - y coordinate
 * @param {Scope} scope - Circuit on which and gate is drawn
 * @param {string} dir - direction
 * @param {number} inputLength - number of input nodes
 * @param {number} bitWidth - bit width per node.
 * @category modules
 */
export class AndGate extends CircuitElement {
  /**
   * Create an AndGate
   * @param {number} x x coordinate
   * @param {number} y y coordinate
   * @param {Scope} scope Circuit on which and gate is drawn
   * @param {string} dir direction
   * @param {number} inputLength number of input nodes
   * @param {number} bitWidth bit width per node.
   */
  constructor(
      x,
      y,
      scope = globalScope,
      dir = 'RIGHT',
      inputLength = 2,
      bitWidth = 1,
  ) {
    super(x, y, scope, dir, bitWidth);
    this.rectangleObject = false;
    this.setDimensions(15, 20);
    this.inp = [];
    this.inputSize = inputLength;

    // variable inputLength , node creation
    if (inputLength % 2 === 1) {
      for (let i = 0; i < inputLength / 2 - 1; i++) {
        const a = new Node(-10, -10 * (i + 1), 0, this);
        this.inp.push(a);
      }
      let a = new Node(-10, 0, 0, this);
      this.inp.push(a);
      for (let i = inputLength / 2 + 1; i < inputLength; i++) {
        a = new Node(-10, 10 * (i + 1 - inputLength / 2 - 1), 0, this);
        this.inp.push(a);
      }
    } else {
      for (let i = 0; i < inputLength / 2; i++) {
        const a = new Node(-10, -10 * (i + 1), 0, this);
        this.inp.push(a);
      }
      for (let i = inputLength / 2; i < inputLength; i++) {
        const a = new Node(-10, 10 * (i + 1 - inputLength / 2), 0, this);
        this.inp.push(a);
      }
    }

    this.output1 = new Node(20, 0, 1, this);
  }

  /**
   * @memberof AndGate
   * Create save JSON data of object.
   * @return {JSON}
   */
  customSave() {
    const data = {
      customData: {
        inputSize: this.inputSize,
        direction: this.direction,
        bitWidth: this.bitWidth,
      },
      nodes: {
        inp: this.inp.map(findNode),
        output1: findNode(this.output1),
      },
    };
    return data;
  }

  /**
   * @memberof AndGate
   * Determine output values and add to simulation queue.
   */
  resolve() {
    let result = this.inp[0].value || 0;
    if (this.isResolvable() === false) {
      return;
    }
    for (let i = 1; i < this.inputSize; i++) {
      result &= this.inp[i].value || 0;
    }
    this.output1.value = result >>> 0;
    globalScope.simulationArea.simulationQueue.add(this.output1);
  }

  /**
   * @memberof AndGate
   * Draw And Gate
   * @param {CanvasRenderingContext2D} ctx
   */
  customDraw(ctx) {
    ctx.beginPath();
    ctx.lineWidth = correctWidth(3);
    ctx.strokeStyle = colors['stroke']; // ("rgba(0,0,0,1)");
    ctx.fillStyle = colors['fill'];
    const xx = this.x;
    const yy = this.y;

    moveTo(ctx, -10, -20, xx, yy, this.direction);
    lineTo(ctx, 0, -20, xx, yy, this.direction);
    arc(ctx, 0, 0, 20, -Math.PI / 2, Math.PI / 2, xx, yy, this.direction);
    lineTo(ctx, -10, 20, xx, yy, this.direction);
    lineTo(ctx, -10, -20, xx, yy, this.direction);
    ctx.closePath();

    if (
      (this.hover && !globalScope.simulationArea.shiftDown) ||
      globalScope.simulationArea.lastSelected === this ||
      globalScope.simulationArea.multipleObjectSelections.includes(this)
    ) {
      ctx.fillStyle = colors['hover_select'];
    }
    ctx.fill();
    ctx.stroke();
  }

  /**
   * @memberof AndGate
   * Generates Verilog string for this CircuitElement.
   * @return {string} String representing the Verilog.
   */
  generateVerilog() {
    return gateGenerateVerilog.call(this, '&');
  }
}

/**
 * @memberof AndGate
 * Help Tip
 * @type {string}
 * @category modules
 */
AndGate.prototype.tooltipText =
  'And Gate Tooltip : Implements logical conjunction';

/**
 * @memberof AndGate
 * @type {boolean}
 * @category modules
 */
AndGate.prototype.alwaysResolve = true;

/**
 * @memberof AndGate
 * @type {string}
 * @category modules
 */
AndGate.prototype.verilogType = 'and';

/**
 * @memberof AndGate
 * function to change input nodes of the gate
 * @category modules
 */
AndGate.prototype.changeInputSize = changeInputSize;
AndGate.prototype.helplink = 'https://docs.circuitverse.org/#/gates?id=and-gate';
AndGate.prototype.objectType = 'AndGate';
AndGate.prototype.constructorParameters= ['direction', 'inputSize', 'bitWidth'];
