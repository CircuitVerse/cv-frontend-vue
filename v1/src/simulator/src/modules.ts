/* eslint-disable import/no-cycle */
import { simulationArea } from "./simulationArea";
import type CircuitElement from "./circuitElement";

/**
 * Layout coordinates that Input and Output elements expose for subcircuit layout.
 */
interface LayoutPosition {
  x: number;
  y: number;
}

/**
 * The parts of a Scope that getNextPosition reads.
 */
interface LayoutScope {
  Input: { layoutProperties: LayoutPosition }[];
  Output: { layoutProperties: LayoutPosition }[];
  layout: { height: number };
}

/**
 * Every registered module is a CircuitElement subclass, but they take differing
 * parameter lists, so only the arguments fall back to any[].
 */
type ElementConstructor = new (...args: any[]) => CircuitElement;

/**
 * The element properties changeInputSize needs. It is attached to element
 * prototypes (see modules/OrGate.ts) instead of being declared as a method,
 * so this has to be typed explicitly.
 */
interface ResizableElement {
  inputSize: number;
  objectType: string;
  x: number;
  y: number;
  scope: unknown;
  direction: string;
  bitWidth: number;
  delete(): void;
}

declare var globalScope: LayoutScope;

export function getNextPosition(x = 0, scope: LayoutScope = globalScope): number {
  let possibleY = 20;
  const done: Record<number, number> = {};
  // The element being constructed is already the last entry in scope.Input,
  // pushed there by baseSetup() during super(), and its layoutProperties is
  // still the prototype placeholder - so skip it. Not an off-by-one.
  for (let i = 0; i < scope.Input.length - 1; i++) {
    if (scope.Input[i].layoutProperties.x === x) {
      done[scope.Input[i].layoutProperties.y] = 1;
    }
  }
  for (let i = 0; i < scope.Output.length; i++) {
    if (scope.Output[i].layoutProperties.x === x) {
      done[scope.Output[i].layoutProperties.y] = 1;
    }
  }
  while (done[possibleY] || done[possibleY + 10] || done[possibleY - 10]) {
    possibleY += 10;
  }
  const height = possibleY + 20;
  if (height > scope.layout.height) {
    const oldHeight = scope.layout.height;
    scope.layout.height = height;
    for (let i = 0; i < scope.Input.length; i++) {
      if (scope.Input[i].layoutProperties.y === oldHeight) {
        scope.Input[i].layoutProperties.y = scope.layout.height;
      }
    }
    for (let i = 0; i < scope.Output.length; i++) {
      if (scope.Output[i].layoutProperties.y === oldHeight) {
        scope.Output[i].layoutProperties.y = scope.layout.height;
      }
    }
  }
  return possibleY;
}

/**
 * Global
 */
var modules: Record<string, ElementConstructor> = {};

export default modules;

export function changeInputSize(
  this: ResizableElement,
  size: number | string,
): CircuitElement | undefined {
  // Reject NaN and fractional sizes rather than letting parseInt truncate them
  // into an element with an unintended number of inputs.
  const newSize = Number(size);
  if (!Number.isInteger(newSize) || newSize < 2 || newSize > 10) return;
  if (this.inputSize === newSize) return;
  var obj = new modules[this.objectType](
    this.x,
    this.y,
    this.scope,
    this.direction,
    newSize,
    this.bitWidth,
  );
  this.delete();
  simulationArea.lastSelected = obj;
  return obj;
}
