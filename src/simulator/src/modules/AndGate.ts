import CircuitElement from "../circuitElement";
import Node, { findNode } from "../node";
import { simulationArea } from "../simulationArea";
import { correctWidth, lineTo, moveTo, arc } from "../canvasApi";
import { changeInputSize } from "../modules";
import { colors } from "../themer/themer";
import { gateGenerateVerilog } from "../utils";

/**
 * AndGate
 * Implements logical AND: output is 1 only when all inputs are 1.
 * @extends CircuitElement
 * @category modules
 */
export default class AndGate extends CircuitElement {
  private inp: Node[];
  private inputSize: number;
  private output1: Node;

  constructor(
    x: number,
    y: number,
    scope: any = globalScope,
    dir: string = "RIGHT",
    inputLength: number = 2,
    bitWidth: number = 1,
  ) {
    super(x, y, scope, dir, bitWidth);
    this.rectangleObject = false;
    this.setDimensions(15, 20);
    this.inp = [];
    this.inputSize = inputLength;

    // Position input nodes symmetrically around the gate centre.
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

  /** Serialize the gate state for save/load. */
  customSave(): object {
    return {
      constructorParamaters: [this.direction, this.inputSize, this.bitWidth],
      nodes: {
        inp: this.inp.map(findNode),
        output1: findNode(this.output1),
      },
    };
  }

  /** Compute AND of all inputs and propagate to the output node. */
  resolve(): void {
    if (this.isResolvable() === false) {
      return;
    }
    let result = this.inp[0].value || 0;
    for (let i = 1; i < this.inputSize; i++) {
      result &= this.inp[i].value || 0;
    }
    this.output1.value = result >>> 0;
    simulationArea.simulationQueue.add(this.output1);
  }

  /** Draw the AND gate body (flat back + arc front). */
  customDraw(): void {
    const ctx = simulationArea.context;
    if (!ctx) return;
    ctx.beginPath();
    ctx.lineWidth = correctWidth(3);
    ctx.strokeStyle = colors["stroke"];
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
    ) {
      ctx.fillStyle = colors["hover_select"];
    }
    ctx.fill();
    ctx.stroke();
  }

  /** Generate Verilog assign statement for AND logic. */
  generateVerilog(): string {
    return gateGenerateVerilog.call(this, "&");
  }
}

AndGate.prototype.tooltipText =
  "And Gate ToolTip : Implements logical conjunction";
AndGate.prototype.alwaysResolve = true;
AndGate.prototype.verilogType = "and";
AndGate.prototype.changeInputSize = changeInputSize;
AndGate.prototype.helplink =
  "https://docs.circuitverse.org/chapter4/chapter4-gates#and-gate";
AndGate.prototype.objectType = "AndGate";
