import CircuitElement from "../circuitElement";
import Node, { findNode } from "../node";
import { simulationArea } from "../simulationArea";
import { correctWidth, lineTo, moveTo, drawCircle2 } from "../canvasApi";
import { colors } from "../themer/themer";

declare var globalScope: any;

/**
 * @class
 * ControlledInverter
 * @extends CircuitElement
 * @param {number} x - x coordinate of element.
 * @param {number} y - y coordinate of element.
 * @param {any=} scope - Cirucit on which element is drawn
 * @param {string=} dir - direction of element
 * @param {number=} bitWidth - bit width per node.
 * @category modules
 */
export default class ControlledInverter extends CircuitElement {
  private inp1: Node;
  private output1: Node;
  private state: Node;

  constructor(
    x: number,
    y: number,
    // scope uses any because globalScope is loosely typed across the codebase
    scope: any = globalScope,
    dir: string = "RIGHT",
    bitWidth: number = 1,
  ) {
    super(x, y, scope, dir, bitWidth);
    this.rectangleObject = false;
    this.setDimensions(15, 15);

    this.inp1 = new Node(-10, 0, 0, this);
    this.output1 = new Node(30, 0, 1, this);
    this.state = new Node(0, 0, 0, this, 1, "Enable");
  }

  /**
   * @memberof ControlledInverter
   * fn to create save Json Data of object
   * @return {object}
   */
  customSave(): object {
    const data = {
      constructorParamaters: [this.direction, this.bitWidth],
      nodes: {
        output1: findNode(this.output1),
        inp1: findNode(this.inp1),
        state: findNode(this.state),
      },
    };
    return data;
  }

  /**
   * @memberof ControlledInverter
   * function to change bitwidth of the element
   * @param {number} bitWidth - new bitwidth
   */
  newBitWidth(bitWidth: number): void {
    this.inp1.bitWidth = bitWidth;
    this.output1.bitWidth = bitWidth;
    this.bitWidth = bitWidth;
  }

  /**
   * @memberof ControlledInverter
   * resolve output values based on inputData
   */
  resolve(): void {
    if (this.isResolvable() === false) {
      return;
    }
    if (this.state.value === 1) {
      this.output1.value =
        ((~this.inp1.value >>> 0) << (32 - this.bitWidth)) >>> (32 - this.bitWidth);
      simulationArea.simulationQueue.add(this.output1, 0);
    } else if (
      this.output1.value !== undefined &&
      !simulationArea.contentionPending.has(this.output1)
    ) {
      this.output1.value = undefined;
      simulationArea.simulationQueue.add(this.output1, 0);
    }
    simulationArea.contentionPending.removeAllContentionsForNode(this.output1);
  }

  /**
   * @memberof ControlledInverter
   * function to draw element
   */
  customDraw(): void {
    var ctx = simulationArea.context;
    if (ctx) {
      ctx.strokeStyle = colors["stroke"];
      ctx.lineWidth = correctWidth(3);
      const xx = this.x;
      const yy = this.y;
      ctx.beginPath();
      ctx.fillStyle = colors["fill"];
      moveTo(ctx, -10, -15, xx, yy, this.direction);
      lineTo(ctx, 20, 0, xx, yy, this.direction);
      lineTo(ctx, -10, 15, xx, yy, this.direction);
      ctx.closePath();
      if (
        (this.hover && !simulationArea.shiftDown) ||
        simulationArea.lastSelected === this ||
        simulationArea.multipleObjectSelections.includes(this)
      )
        ctx.fillStyle = colors["hover_select"];
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      drawCircle2(ctx, 25, 0, 5, xx, yy, this.direction);
      ctx.stroke();
    }
  }

  generateVerilog(): string {
    return `assign ${this.output1.verilogLabel} = (${this.state.verilogLabel}!=0) ? ~${this.inp1.verilogLabel} : ${this.inp1.verilogLabel};`;
  }
}

/**
 * @memberof ControlledInverter
 * Help Tip
 * @type {string}
 * @category modules
 */
ControlledInverter.prototype.tooltipText =
  "Controlled Inverter ToolTip : Controlled buffer and NOT gate.";
ControlledInverter.prototype.objectType = "ControlledInverter";
ControlledInverter.prototype.helplink =
  "https://docs.circuitverse.org/chapter4/chapter4-misc/#controlled-inverter";
