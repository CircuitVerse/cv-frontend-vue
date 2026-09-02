import type { Direction } from "./canonical.types";

/** Minimal structural view of a Node until node.js is converted to TypeScript. */
export interface CircuitNode {
  x: number;
  y: number;
  type: number;
  bitWidth: number;
  parent: CircuitElement;
  value: number | undefined;
  connections: CircuitNode[];
  label: string;
  delete: () => void;
  checkDeleted: () => void;
  updateScope: (scope: Scope) => void;
}

/** Minimal structural view of a Scope until scope.js is converted to TypeScript. */
export interface Scope {
  id: string | number;
  name: string;
  root: CircuitElement;
  allNodes: CircuitNode[];
  wires: unknown[];
  [objectType: string]: unknown;
}

/** Event-queue bookkeeping attached to every simulatable element. */
export interface QueueProperties {
  inQueue: boolean;
  time?: number;
  index?: number;
}

/** Placement metadata for elements shown inside a subcircuit. */
export interface SubcircuitMetadata {
  showInSubcircuit: boolean;
  showLabelInSubcircuit: boolean;
  labelDirection: Direction;
  x: number;
  y: number;
}

/** Layout-mode dimensions; Input/Output elements also carry x/y. */
export interface LayoutProperties {
  leftDimensionX?: number;
  rightDimensionX?: number;
  upDimensionY?: number;
  downDimensionY?: number;
  x?: number;
  y?: number;
}

/** Input types rendered by the properties panel. */
export type MutablePropertyType = "text" | "checkbox" | "number" | "button" | "textarea";

/** One entry of `mutableProperties` / `subcircuitMutableProperties`, rendered by the properties panel. */
export interface MutableProperty {
  name: string;
  type: MutablePropertyType | string;
  func: string;
  min?: string;
  max?: string;
  maxlength?: number;
}

/** Shape returned by `customSave()`. */
export interface CustomSaveData {
  constructorParamaters?: unknown[];
  nodes?: Record<string, number | number[]>;
  values?: Record<string, unknown>;
}

/** Shape returned by `saveObject()` and consumed by data/load. */
export interface SavedCircuitElement {
  x: number;
  y: number;
  objectType: string;
  label: string;
  direction: Direction;
  labelDirection: Direction;
  propagationDelay: number;
  customData: CustomSaveData;
  subcircuitMetadata?: SubcircuitMetadata;
}

/**
 * Shared contract implemented by every circuit component
 * (`simulator/src/modules/*`, `simulator/src/sequential/*`, ...).
 *
 * This is the surface consumed by the rest of the app: the render loop
 * (engine), the simulation event queue, the properties/elements panels,
 * save/load and listeners. Component classes extend the JS base class
 * `circuitElement.js`, which provides default implementations.
 */
export interface CircuitElement {
  // Geometry & rendering (engine.js renderCanvas/update, minimap, canvasApi)
  x: number;
  y: number;
  hover: boolean;
  clicked: boolean;
  newElement?: boolean;
  leftDimensionX: number;
  rightDimensionX: number;
  upDimensionY: number;
  downDimensionY: number;
  absX(): number;
  absY(): number;
  draw(): void;
  update(): boolean | undefined;

  // Simulation (eventQueue.ts, node.js, circuit.ts, subcircuit.ts)
  queueProperties: QueueProperties;
  propagationDelay: number;
  resolve(): void;
  isResolvable(): boolean;
  removePropagation(): void;

  // Identity & metadata (panels, registry)
  objectType: string;
  label: string;
  bitWidth: number;
  direction: Direction;
  labelDirection: Direction;
  scope: Scope;
  nodeList: CircuitNode[];
  fixedBitWidth?: boolean;
  propagationDelayFixed?: boolean;
  disableLabel?: boolean;
  directionFixed?: boolean;
  labelDirectionFixed?: boolean;
  orientationFixed?: boolean;
  canShowInSubcircuit?: boolean;
  alwaysResolve?: boolean;
  rectangleObject?: boolean;
  helplink?: string;
  tooltipText?: string;
  inputSize?: number;
  mutableProperties?: Record<string, MutableProperty>;
  subcircuitMutableProperties?: Record<string, MutableProperty>;
  subcircuitMetadata?: SubcircuitMetadata;
  layoutProperties?: LayoutProperties;

  // Mutators (ux.js, hotkeys, listeners, properties panel)
  setLabel(label: string): void;
  newBitWidth(bitWidth: number): void;
  newDirection(dir: Direction): void;
  newLabelDirection(dir: Direction): void;
  changePropagationDelay(delay: number): void;
  changeInputSize?(size: number): void;
  fixDirection(): void;

  // Lifecycle & persistence (backupCircuit, load, events, ux)
  saveObject(): SavedCircuitElement;
  customSave(): CustomSaveData;
  updateScope(scope: Scope): void;
  copyFrom(obj: Pick<CircuitElement, "label" | "labelDirection">): void;
  delete(): void;
  cleanDelete(): void;

  // Optional per-component hooks
  customDraw?(): void;
  subcircuitDraw?(xOffset?: number, yOffset?: number): void;
  click?(): void;
  dblclick?(): void;
  keyDown?(key: string): void;
  keyDown2?(key: string): void;
  keyDown3?(key: string): void;
  toggleState?(): void;
  removeConnections?(): void;
  makeConnections?(): void;
  generateVerilog?(): string;
}
