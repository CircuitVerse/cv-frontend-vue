import CircuitElement from "../circuitElement";
import Node, { findNode } from "../node";
import Scope from "../circuit";
import { simulationArea } from "../simulationArea";
import { correctWidth, lineTo, moveTo } from "../canvasApi";
import { colors } from "../themer/themer";
import type { QueueObject } from "../eventQueue";
import type {
  ICircuitElement,
  SavedCircuitElement,
  CustomSaveData,
} from "../types/circuitElement.types";

/**
 * Class representing Power.
 * All bits are High(1).
 * @category modules
 */
export default class Power extends CircuitElement implements ICircuitElement {
  output1: Node;

  declare propagationDelay: number;
  declare tooltipText: string;
  declare helplink: string;
  declare objectType: string;
  declare saveObject: () => SavedCircuitElement;

  constructor(x: number, y: number, scope: Scope = globalScope, bitWidth: number = 1) {
    super(x, y, scope, "RIGHT", bitWidth);
    this.directionFixed = true;
    this.rectangleObject = false;
    this.setDimensions(10, 10);
    this.output1 = new Node(0, 10, 1, this);
  }

  /**
   * Resolve output values based on inputData.
   */
  resolve(): void {
    this.output1.value = ~0 >>> (32 - this.bitWidth);
    // Node is from node.js and implements QueueObject at runtime
    simulationArea.simulationQueue.add(this.output1 as unknown as QueueObject);
  }

  /**
   * Function to create save JSON data of object.
   */
  customSave(): CustomSaveData {
    return {
      nodes: {
        output1: findNode(this.output1),
      },
      constructorParamaters: [this.bitWidth],
    };
  }

  /**
   * Function to draw element.
   */
  customDraw(): void {
    const ctx = simulationArea.context;
    if (!ctx) return;

    const xx = this.x;
    const yy = this.y;
    ctx.beginPath();
    ctx.strokeStyle = "rgba(0,0,0,1)";
    ctx.lineWidth = correctWidth(3);
    ctx.fillStyle = colors["fill"];
    moveTo(ctx, 0, -10, xx, yy, this.direction);
    lineTo(ctx, -10, 0, xx, yy, this.direction);
    lineTo(ctx, 10, 0, xx, yy, this.direction);
    lineTo(ctx, 0, -10, xx, yy, this.direction);
    ctx.closePath();
    ctx.stroke();
    if (
      (this.hover && !simulationArea.shiftDown) ||
      simulationArea.lastSelected === this ||
      simulationArea.multipleObjectSelections.includes(this)
    ) {
      ctx.fillStyle = colors["hover_select"];
    }
    ctx.fill();
    moveTo(ctx, 0, 0, xx, yy, this.direction);
    lineTo(ctx, 0, 10, xx, yy, this.direction);
    ctx.stroke();
  }

  generateVerilog(): string {
    // verilogLabel is assigned to Node dynamically during Verilog export
    return `assign ${(this.output1 as Node & { verilogLabel: string }).verilogLabel} = ~${this.bitWidth}'b0;`;
  }
}

Power.prototype.tooltipText = "Power: All bits are High(1).";
Power.prototype.helplink = "https://docs.circuitverse.org/chapter4/chapter4-input#power";
Power.prototype.propagationDelay = 0;
Power.prototype.objectType = "Power";
