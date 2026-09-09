import CircuitElement from "../circuitElement";
import Node, { findNode } from "../node";
import { simulationArea } from "../simulationArea";
import { correctWidth, lineTo, moveTo } from "../canvasApi";
import { colors } from "../themer/themer";
import type { Scope, ICircuitElement, SavedCircuitElement } from "../types/circuitElement.types";

export default class Buffer extends CircuitElement implements ICircuitElement {
  state: number;
  preState: number;
  inp1: Node;
  reset: Node;
  output1: Node;

  declare propagationDelay: number;
  declare tooltipText: string;
  declare helplink: string;
  declare saveObject: () => SavedCircuitElement;

  constructor(
    x: number,
    y: number,
    scope: Scope = globalScope,
    dir: string = "RIGHT",
    bitWidth: number = 1,
  ) {
    super(x, y, scope, dir, bitWidth);
    this.rectangleObject = false;
    this.setDimensions(15, 15);
    this.state = 0;
    this.preState = 0;
    this.inp1 = new Node(-10, 0, 0, this);
    this.reset = new Node(0, 0, 0, this, 1, "reset");
    this.output1 = new Node(20, 0, 1, this);
  }

  customSave() {
    const data = {
      constructorParamaters: [this.direction, this.bitWidth],
      nodes: {
        output1: findNode(this.output1),
        inp1: findNode(this.inp1),
        reset: findNode(this.reset),
      },
    };
    return data;
  }

  newBitWidth(bitWidth: number) {
    this.inp1.bitWidth = bitWidth;
    this.output1.bitWidth = bitWidth;
    this.bitWidth = bitWidth;
  }

  isResolvable() {
    return true;
  }

  resolve() {
    if (this.reset.value === 1) {
      this.state = this.preState;
    }
    if (this.inp1.value !== undefined) {
      this.state = this.inp1.value;
    }

    this.output1.value = this.state;
    simulationArea.simulationQueue.add(this.output1);
  }

  customDraw() {
    var ctx = simulationArea.context;
    if (!ctx) return;
    ctx.strokeStyle = colors["stroke_alt"];
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
  }

  generateVerilog() {
    return "assign " + this.output1.verilogLabel + " = " + this.inp1.verilogLabel + ";";
  }
}

Buffer.prototype.tooltipText = "Buffer ToolTip : Isolate the input from the output.";
Buffer.prototype.helplink = "https://docs.circuitverse.org/chapter4/chapter4-misc#buffer";
Buffer.prototype.objectType = "Buffer";
