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
 * Class representing Ground.
 * All bits are Low(0).
 * @category modules
 */
export default class Ground extends CircuitElement implements ICircuitElement {
  output1: Node;

  declare propagationDelay: number;
  declare tooltipText: string;
  declare helplink: string;
  declare objectType: string;
  declare saveObject: () => SavedCircuitElement;

  constructor(x: number, y: number, scope: Scope = globalScope, bitWidth: number = 1) {
    super(x, y, scope, "RIGHT", bitWidth);
    this.rectangleObject = false;
    this.setDimensions(10, 10);
    this.directionFixed = true;
    this.output1 = new Node(0, -10, 1, this);
  }

  /**
   * Resolve output values based on inputData.
   */
  resolve(): void {
    this.output1.value = 0;
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

    ctx.beginPath();
    const isSelected =
      (this.hover && !simulationArea.shiftDown) ||
      simulationArea.lastSelected === this ||
      simulationArea.multipleObjectSelections.includes(this);
    ctx.strokeStyle = isSelected ? "brown" : colors["stroke"];
    ctx.lineWidth = correctWidth(3);

    const xx = this.x;
    const yy = this.y;

    moveTo(ctx, 0, -10, xx, yy, this.direction);
    lineTo(ctx, 0, 0, xx, yy, this.direction);
    moveTo(ctx, -10, 0, xx, yy, this.direction);
    lineTo(ctx, 10, 0, xx, yy, this.direction);
    moveTo(ctx, -6, 5, xx, yy, this.direction);
    lineTo(ctx, 6, 5, xx, yy, this.direction);
    moveTo(ctx, -2.5, 10, xx, yy, this.direction);
    lineTo(ctx, 2.5, 10, xx, yy, this.direction);
    ctx.stroke();
  }

  generateVerilog(): string {
    // verilogLabel is assigned to Node dynamically during Verilog export
    return `assign ${(this.output1 as Node & { verilogLabel: string }).verilogLabel} = ${this.bitWidth}'b0;`;
  }
}

Ground.prototype.tooltipText = "Ground: All bits are Low(0).";
Ground.prototype.helplink = "https://docs.circuitverse.org/chapter4/chapter4-input#ground";
Ground.prototype.propagationDelay = 0;
Ground.prototype.objectType = "Ground";
