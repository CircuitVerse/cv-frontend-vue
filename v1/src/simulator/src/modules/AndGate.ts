import CircuitElement from "../circuitElement";
import Node, { findNode } from "../node";
import { simulationArea } from "../simulationArea";
import { correctWidth, lineTo, moveTo, arc } from "../canvasApi";
import { changeInputSize } from "../modules";
import { colors } from "../themer/themer";
import { gateGenerateVerilog } from "../utils";

/**
 * @class
 * AndGate
 * @extends CircuitElement
 * @param {number} x - x coordinate of And Gate.
 * @param {number} y - y coordinate of And Gate.
 * @param {any=} scope - Cirucit on which and gate is drawn
 * @param {string=} dir - direction of And Gate
 * @param {number=} inputLength - number of input nodes
 * @param {number=} bitWidth - bit width per node.
 * @category modules
 */
export default class AndGate extends CircuitElement {
  private inp: Node[];
  private inputSize: number;
  private output1: Node;

  constructor(
    x: number,
    y: number,
    // scope uses any because globalScope is loosely typed across the codebase
    scope: any = globalScope,
    dir: string = "RIGHT",
    inputLength: number = 2,
    bitWidth: number = 1,
  ) {
    /**
     * super call
     */
    super(x, y, scope, dir, bitWidth);
    /* this is done in this.baseSetup() now
        this.scope['AndGate'].push(this);
        */
    this.rectangleObject = false;
    this.setDimensions(15, 20);
    this.inp = [];
    this.inputSize = inputLength;

    // variable inputLength , node creation
    if (inputLength % 2 === 1) {
      for (let i = 0; i < Math.floor(inputLength / 2); i++) {
        const a = new Node(-10, -10 * (i + 1), 0, this);
        this.inp.push(a);
      }
      let a = new Node(-10, 0, 0, this);
      this.inp.push(a);
      for (let i = Math.floor(inputLength / 2) + 1; i < inputLength; i++) {
        a = new Node(-10, 10 * (i + 1 - Math.floor(inputLength / 2) - 1), 0, this);
        this.inp.push(a);
      }
    } else {
      for (let i = 0; i < Math.floor(inputLength / 2); i++) {
        const a = new Node(-10, -10 * (i + 1), 0, this);
        this.inp.push(a);
      }
      for (let i = Math.floor(inputLength / 2); i < inputLength; i++) {
        const a = new Node(-10, 10 * (i + 1 - Math.floor(inputLength / 2)), 0, this);
        this.inp.push(a);
      }
    }

    this.output1 = new Node(20, 0, 1, this);
  }

  /**
   * @memberof AndGate
   * fn to create save Json Data of object
   * @return {object}
   */
  customSave(): object {
    const data = {
      constructorParamaters: [this.direction, this.inputSize, this.bitWidth],
      nodes: {
        inp: this.inp.map(findNode),
        output1: findNode(this.output1),
      },
    };
    return data;
  }

  /**
   * @memberof AndGate
   * resolve output values based on inputData
   */
  resolve(): void {
    let result = this.inp[0].value || 0;
    if (this.isResolvable() === false) {
      return;
    }
    for (let i = 1; i < this.inputSize; i++) result &= this.inp[i].value || 0;
    this.output1.value = result >>> 0;
    simulationArea.simulationQueue.add(this.output1);
  }

  /**
   * @memberof AndGate
   * function to draw And Gate
   */
  customDraw(): void {
    var ctx = simulationArea.context;
    if (ctx) {
      ctx.beginPath();
      ctx.lineWidth = correctWidth(3);
      ctx.strokeStyle = colors["stroke"]; // ("rgba(0,0,0,1)");
      ctx.fillStyle = colors["fill"];
      const xx = this.x;
      const yy = this.y;

      moveTo(ctx, -10, -20, xx, yy, this.direction);
      lineTo(ctx, 0, -20, xx, yy, this.direction);
      arc(ctx, 0, 0, 20, -Math.PI / 2, Math.PI / 2, xx, yy, this.direction);
      lineTo(ctx, -10, 20, xx, yy, this.direction);
      lineTo(ctx, -10, -20, xx, yy, this.direction);
      ctx.closePath();

      if (
        (this.hover && !simulationArea.shiftDown) ||
        simulationArea.lastSelected === this ||
        simulationArea.multipleObjectSelections.includes(this)
      )
        ctx.fillStyle = colors["hover_select"];
      ctx.fill();
      ctx.stroke();
    }
  }

  generateVerilog(): string {
    return gateGenerateVerilog.call(this, "&");
  }
}

/**
 * @memberof AndGate
 * Help Tip
 * @type {string}
 * @category modules
 */
AndGate.prototype.tooltipText = "And Gate ToolTip : Implements logical conjunction";

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
AndGate.prototype.verilogType = "and";

/**
 * @memberof AndGate
 * function to change input nodes of the gate
 * @category modules
 */
AndGate.prototype.changeInputSize = changeInputSize;
AndGate.prototype.helplink = "https://docs.circuitverse.org/#/chapter4/4gates?id=and-gate";
AndGate.prototype.objectType = "AndGate";
