import { EventQueue } from "../eventQueue";
import type { ICircuitElement } from "../types/circuitElement.types";
import type Wire from "../wire";
import type Node from "../node";
import type LayoutNode from "../layout/layoutNode";

/** Anything that can be selected/hovered on the canvas. */
export type SelectableElement = ICircuitElement | Wire | Node | LayoutNode;

export interface SimulationArea {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D | null;
  selected: boolean;
  hover: SelectableElement | null | undefined | boolean;
  clockState: number;
  clockEnabled: boolean;
  lastSelected: SelectableElement | null | undefined;
  stack: ICircuitElement[];
  prevScale: number;
  oldx: number;
  oldy: number;
  objectList: ICircuitElement[];
  maxHeight: number;
  maxWidth: number;
  minHeight: number;
  minWidth: number;
  multipleObjectSelections: SelectableElement[];
  copyList: SelectableElement[];
  shiftDown: boolean;
  controlDown: boolean;
  timePeriod: number;
  mouseX: number;
  mouseY: number;
  mouseDownX: number;
  mouseDownY: number;
  mouseRawX: number;
  mouseRawY: number;
  mouseDownRawX: number;
  mouseDownRawY: number;
  simulationQueue: EventQueue;
  clickCount: number;
  lock: string;
  mouseDown: boolean;
  ClockInterval: NodeJS.Timeout | null;
  touch: boolean;
  timer: () => void;
  setup: () => void;
  changeClockTime: (t: number) => void;
  clear: () => void;
}
