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
  objectList: ICircuitElement[] | string[];
  maxHeight: number | undefined;
  maxWidth: number | undefined;
  minHeight: number | undefined;
  minWidth: number | undefined;
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
  /** Unsnapped (fractional) canvas coordinates of the pointer, set by panMove. */
  mouseXf?: number;
  mouseYf?: number;
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
