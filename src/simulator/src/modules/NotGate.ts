import CircuitElement from "../circuitElement";
import Node, { findNode } from "../node";
import { simulationArea } from "../simulationArea";
import { correctWidth, lineTo, moveTo, drawCircle2 } from "../canvasApi";
import { colors } from "../themer/themer";

/**
 * NotGate
 * Inverts the input digital signal (logical NOT / complement).
 * @extends CircuitElement
 * @category modules
 */
export default class NotGate extends CircuitElement {
  private inp1: Node;
  private output1: Node;

  constructor(
    x: number,
    y: number,
    scope: any = globalScope,
    dir: string = "RIGHT",
    bitWidth: number = 1,
  ) {
    super(x, y, scope, dir, bitWidth);
    this.rectangleObject = false;
    this.setDimensions(15, 15);
    this.inp1 = new Node(-10, 0, 0, this);
    this.output1 = new Node(20, 0, 1, this);
  }

  /** Serialize the gate state for save/load. */
  customSave(): object {
    return {
      constructorParamaters: [this.direction, this.bitWidth],
      nodes: {
        output1: findNode(this.output1),
        inp1: findNode(this.inp1),
      },
    };
  }

  /**
   * Compute bitwise NOT of the input value, masked to the gate's bit width,
   * and propagate to the output node.
   */
  resolve(): void {
    if (this.isResolvable() === false) {
      return;
    }
    this.output1.value =
      ((~this.inp1.value >>> 0) << (32 - this.bitWidth)) >>> (32 - this.bitWidth);
    simulationArea.simulationQueue.add(this.output1);
  }

  /** Draw the NOT gate triangle body and the inversion bubble. */
  customDraw(): void {
    const ctx = simulationArea.context;
    if (!ctx) return;
    ctx.strokeStyle = colors["stroke"];
    ctx.lineWidth = correctWidth(3);

    const xx = this.x;
    const yy = this.y;

    ctx.beginPath();
    ctx.fillStyle = colors["fill"];
    moveTo(ctx, -10, -10, xx, yy, this.direction);
    lineTo(ctx, 10, 0, xx, yy, this.direction);
    lineTo(ctx, -10, 10, xx, yy, this.direction);
    ctx.closePath();

    if (
      (this.hover && !simulationArea.shiftDown) ||
      simulationArea.lastSelected === this ||
      simulationArea.multipleObjectSelections.includes(this)
    ) {
      ctx.fillStyle = colors["hover_select"];
    }
    ctx.fill();
    ctx.stroke();

    // Inversion bubble
    ctx.beginPath();
    drawCircle2(ctx, 15, 0, 5, xx, yy, this.direction);
    ctx.stroke();
  }

  /** Generate Verilog assign statement for NOT logic. */
  generateVerilog(): string {
    return (
      "assign " +
      this.output1.verilogLabel +
      " = ~" +
      this.inp1.verilogLabel +
      ";"
    );
  }
}

NotGate.prototype.tooltipText =
  "Not Gate ToolTip : Inverts the input digital signal.";
NotGate.prototype.helplink =
  "https://docs.circuitverse.org/chapter4/chapter4-gates#not-gate";
NotGate.prototype.objectType = "NotGate";
NotGate.prototype.verilogType = "not";
