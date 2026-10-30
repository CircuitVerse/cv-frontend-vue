import CircuitElement from "../circuitElement";
import Node, { findNode, dec2bin } from "../node";
import { simulationArea } from "../simulationArea";
import type { QueueObject } from "../eventQueue";
import { correctWidth, rect, fillText } from "../canvasApi";
import type {
  CustomSaveData,
  ICircuitElement,
  SavedCircuitElement,
} from "../types/circuitElement.types";
import type CircuitScope from "../circuit";

import { colors } from "../themer/themer";

/** node.js is still JavaScript; verilogLabel exists at runtime but is not inferred yet. */
type VerilogNode = Node & { verilogLabel: string };

/**
 * @class
 * LSB
 * @extends CircuitElement
 * @param {number} x - x coordinate of element.
 * @param {number} y - y coordinate of element.
 * @param {Scope=} scope - Cirucit on which element is drawn
 * @param {string=} dir - direction of element
 * @param {number=} bitWidth - bit width per node.
 * @category modules
 */
export default class LSB extends CircuitElement implements ICircuitElement {
  private inp1: Node;
  private output1: Node;
  private enable: Node;

  declare propagationDelay: number;
  declare saveObject: () => SavedCircuitElement;
  declare inputSize: number;
  declare intputSize: number;
  declare tooltipText: string;
  declare helplink: string;
  declare objectType: string;

  constructor(
    x: number,
    y: number,
    scope: CircuitScope = globalScope,
    dir: string = "RIGHT",
    bitWidth: number = 1,
  ) {
    super(x, y, scope, dir, bitWidth);
    this.leftDimensionX = 10;
    this.rightDimensionX = 20;
    this.setHeight(30);
    this.directionFixed = true;
    this.bitWidth = bitWidth || parseInt(prompt("Enter bitWidth") ?? "", 10);
    this.rectangleObject = false;
    this.intputSize = this.bitWidth;

    // Node's bitWidth parameter is inferred as `undefined` from its JSDoc; runtime accepts a number.
    this.inp1 = new Node(-10, 0, 0, this, this.inputSize as unknown as undefined);
    this.output1 = new Node(20, 0, 1, this, this.bitWidth);
    this.enable = new Node(20, 20, 1, this, 1 as unknown as undefined);
  }

  /**
   * @memberof LSB
   * fn to create save Json Data of object
   * @return {JSON}
   */
  customSave(): CustomSaveData {
    return {
      nodes: {
        inp1: findNode(this.inp1),
        output1: findNode(this.output1),
        enable: findNode(this.enable),
      },
      constructorParamaters: [this.direction, this.bitWidth],
    };
  }

  /**
   * @memberof LSB
   * function to change bitwidth of the element
   * @param {number} bitWidth - new bitwidth
   */
  newBitWidth(bitWidth: number): void {
    this.inputSize = bitWidth;
    this.inp1.bitWidth = this.inputSize;
    this.bitWidth = bitWidth;
    this.output1.bitWidth = bitWidth;
  }

  /**
   * @memberof LSB
   * resolve output values based on inputData
   */
  resolve(): void {
    const inp = dec2bin(this.inp1.value);
    let out = 0;
    for (let i = inp.length - 1; i >= 0; i--) {
      if (inp[i] === "1") {
        out = inp.length - 1 - i;
        break;
      }
    }
    this.output1.value = out;
    simulationArea.simulationQueue.add(this.output1 as QueueObject);
    if (inp != 0) {
      this.enable.value = 1;
    } else {
      this.enable.value = 0;
    }
    simulationArea.simulationQueue.add(this.enable as QueueObject);
  }

  /**
   * @memberof LSB
   * function to draw element
   */
  customDraw(): void {
    const ctx = simulationArea.context;
    if (ctx) {
      ctx.beginPath();
      ctx.strokeStyle = colors["stroke"];
      ctx.fillStyle = colors["fill"];
      ctx.lineWidth = correctWidth(3);
      const xx = this.x;
      const yy = this.y;
      rect(ctx, xx - 10, yy - 30, 30, 60);
      if (
        (this.hover && !simulationArea.shiftDown) ||
        simulationArea.lastSelected === this ||
        simulationArea.multipleObjectSelections.includes(this)
      )
        ctx.fillStyle = colors["hover_select"];
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.fillStyle = "black";
      ctx.textAlign = "center";
      fillText(ctx, "LSB", xx + 6, yy - 12, 10);
      fillText(ctx, "EN", xx + this.enable.x - 12, yy + this.enable.y + 3, 8);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = "green";
      ctx.textAlign = "center";
      if (this.output1.value !== undefined) {
        fillText(ctx, this.output1.value, xx + 5, yy + 14, 13);
      }
      ctx.stroke();
      ctx.fill();
    }
  }

  generateVerilog(): string {
    const output1 = this.output1 as unknown as VerilogNode;
    const enable = this.enable as unknown as VerilogNode;
    const inp1 = this.inp1 as unknown as VerilogNode;
    return `assign ${output1.verilogLabel} = (${enable.verilogLabel}!=0) ? ${inp1.verilogLabel}[0] : 0;`;
  }
}

/**
 * @memberof LSB
 * Help Tip
 * @type {string}
 * @category modules
 */
LSB.prototype.tooltipText = "LSB ToolTip : The least significant bit or the low-order bit.";
LSB.prototype.helplink =
  "https://docs.circuitverse.org/#/chapter4/5muxandplex?id=least-significant-bit-lsb-detector";
LSB.prototype.objectType = "LSB";
