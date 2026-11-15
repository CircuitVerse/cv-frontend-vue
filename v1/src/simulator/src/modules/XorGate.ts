import CircuitElement from "../circuitElement";
import Node, { findNode } from "../node";
import { simulationArea } from "../simulationArea";
import { correctWidth, bezierCurveTo, moveTo, arc2 } from "../canvasApi";
import { changeInputSize } from "../modules";
import { gateGenerateVerilog } from "../utils";
import { colors } from "../themer/themer";
import type { Scope, ICircuitElement, SavedCircuitElement } from "../types/circuitElement.types";

export default class XorGate extends CircuitElement implements ICircuitElement {
  inp: Node[];
  inputSize: number;
  output1: Node;

  declare propagationDelay: number;
  declare tooltipText: string;
  declare changeInputSize: (size: number) => void;
  declare verilogType: string;
  declare helplink: string;
  declare saveObject: () => SavedCircuitElement;

  constructor(
    x: number,
    y: number,
    scope: Scope = globalScope,
    dir: string = "RIGHT",
    inputs: number = 2,
    bitWidth: number = 1,
  ) {
    super(x, y, scope, dir, bitWidth);
    this.rectangleObject = false;
    this.setDimensions(15, 20);

    this.inp = [];
    this.inputSize = inputs;

    if (inputs % 2 === 1) {
      for (let i = 0; i < Math.floor(inputs / 2); i++) {
        const a = new Node(-20, -10 * (i + 1), 0, this);
        this.inp.push(a);
      }
      let a = new Node(-20, 0, 0, this);
      this.inp.push(a);
      for (let i = Math.floor(inputs / 2) + 1; i < inputs; i++) {
        const nodeY = 10 * (i + 1 - Math.floor(inputs / 2) - 1);
        const a = new Node(-20, nodeY, 0, this);
        this.inp.push(a);
      }
    } else {
      for (let i = 0; i < Math.floor(inputs / 2); i++) {
        const a = new Node(-20, -10 * (i + 1), 0, this);
        this.inp.push(a);
      }
      for (let i = Math.floor(inputs / 2); i < inputs; i++) {
        const a = new Node(-20, 10 * (i + 1 - Math.floor(inputs / 2)), 0, this);
        this.inp.push(a);
      }
    }
    this.output1 = new Node(20, 0, 1, this);
  }

  customSave() {
    const data = {
      constructorParamaters: [this.direction, this.inputSize, this.bitWidth],
      nodes: {
        inp: this.inp.map(findNode),
        output1: findNode(this.output1),
      },
    };
    return data;
  }

  resolve() {
    let result = this.inp[0].value || 0;
    if (this.isResolvable() === false) {
      return;
    }
    for (let i = 1; i < this.inputSize; i++) result ^= this.inp[i].value || 0;

    this.output1.value = result;
    simulationArea.simulationQueue.add(this.output1);
  }

  customDraw() {
    var ctx = simulationArea.context;
    if (!ctx) return;
    ctx.strokeStyle = colors["stroke"];
    ctx.lineWidth = correctWidth(3);

    const xx = this.x;
    const yy = this.y;
    ctx.beginPath();
    ctx.fillStyle = colors["fill"];
    moveTo(ctx, -10, -20, xx, yy, this.direction, true);
    bezierCurveTo(0, -20, +15, -10, 20, 0, xx, yy, this.direction);
    bezierCurveTo(0 + 15, 0 + 10, 0, 0 + 20, -10, +20, xx, yy, this.direction);
    bezierCurveTo(0, 0, 0, 0, -10, -20, xx, yy, this.direction);
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
    arc2(ctx, -35, 0, 25, 1.7 * Math.PI, 0.3 * Math.PI, xx, yy, this.direction);
    ctx.stroke();
  }

  generateVerilog() {
    return gateGenerateVerilog.call(this, "^");
  }
}

XorGate.prototype.tooltipText = "Xor Gate ToolTip : Implements an exclusive OR.";
XorGate.prototype.alwaysResolve = true;
XorGate.prototype.changeInputSize = changeInputSize;
XorGate.prototype.verilogType = "xor";
XorGate.prototype.helplink = "https://docs.circuitverse.org/chapter4/chapter4-gates#xor-gate";
XorGate.prototype.objectType = "XorGate";
