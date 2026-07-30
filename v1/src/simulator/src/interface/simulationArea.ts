import { EventQueue } from "../eventQueue";
import ContentionPendingData from "../contention";
export interface SimulationArea {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D | null;
  selected: boolean;
  // Holds the element or node currently under the pointer, or undefined.
  // TODO: make this CircuitElement|Node|undefined once converted to typescript
  hover: any;
  clockState: number;
  clockEnabled: boolean;
  // TODO: make this CircuitElement|null once converted to typescript
  lastSelected: any | null;
  stack: any[];
  prevScale: number;
  oldx: number;
  oldy: number;
  objectList: any[];
  maxHeight: number;
  maxWidth: number;
  minHeight: number;
  minWidth: number;
  multipleObjectSelections: any[];
  copyList: any[];
  shiftDown: boolean;
  controlDown: boolean;
  timePeriod: number;
  mouseX: number;
  mouseY: number;
  // Unrounded pointer position. listeners.js assigns these on the first pointer
  // event, so they are absent until the pointer moves.
  mouseXf?: number;
  mouseYf?: number;
  mouseDownX: number;
  mouseDownY: number;
  simulationQueue: EventQueue;
  contentionPending: ContentionPendingData;
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
