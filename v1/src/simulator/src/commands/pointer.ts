/**
 * Canvas pointer commands: pan, pinch-zoom, tap/double-tap and wheel-zoom.
 *
 * These mutate the imperative simulator model (`simulationArea`, `globalScope`,
 * the render scheduler). They are bound to the canvas element by
 * `SimulatorCanvas.vue` and reused by `embedListeners.js`.
 *
 * Note: for now variable names start with `mouse` (e.g. `mouseDown`) but are
 * used for both mouse and touch input.
 */
import { toRefs } from "vue";
import { simulationArea } from "../simulationArea";
import {
  scheduleUpdate,
  update,
  updateSelectionsAndPane,
  wireToBeCheckedSet,
  updatePositionSet,
  updateSimulationSet,
  updateCanvasSet,
  gridUpdateSet,
  errorDetectedSet,
} from "../engine";
import { findDimensions } from "../canvasApi";
import { scheduleBackup } from "../data/backupCircuit";
import { uxvar } from "../ux";
import { removeMiniMap, updatelastMinimapShown } from "../minimap";
import { layoutModeGet, layoutUpdate } from "../layoutMode";
import { updateRestrictedElementsList } from "../restrictedElementDiv";
import { useSimulatorMobileStore } from "#/store/simulatorMobileStore";
import { zoomBy } from "./zoom";

type PointerLikeEvent = MouseEvent | TouchEvent;

const unit = 10;

let coordinate: { x: number; y: number };
const returnCoordinate = {
  x: 0,
  y: 0,
};

// Pinch-zoom state for the current two-finger gesture (see pinchZoom / resetPinch).
let pinchActive = false;
let pinchDistance = 0;
let pinchScale = 0;
// Scale change per pinch step; matches the legacy 0.02 * 3 sensitivity.
const PINCH_STEP = 0.06;
let lastTap = 0;

/**
 * Handles a double click or double tap on the canvas.
 * @param e - the originating event
 */
export function onDoubleClickorTap(e: Event): void {
  updateCanvasSet(true);
  const lastSelected = simulationArea.lastSelected as { dblclick?: () => void } | null | undefined;
  if (lastSelected && lastSelected.dblclick !== undefined) {
    lastSelected.dblclick();
  } else if (!simulationArea.shiftDown) {
    simulationArea.multipleObjectSelections = [];
  }
  scheduleUpdate(2);
  e.preventDefault();
}

/**
 * Detects a tap and a double tap (two taps within 500ms).
 * @param e - the originating touch event
 */
function getTap(e: Event): void {
  const currentTime = new Date().getTime();
  const tapLength = currentTime - lastTap;
  if (tapLength < 500 && tapLength > 0) {
    onDoubleClickorTap(e);
  } else {
    // Single tap
  }
  lastTap = currentTime;
  e.preventDefault();
}

/**
 * Returns the client coordinate of the event.
 * If touch is enabled it returns the first touch coordinate, otherwise the mouse coordinate.
 * @param e - mouse or touch event
 */
export function getCoordinate(e: PointerLikeEvent): { x: number; y: number } {
  if (simulationArea.touch) {
    const touch = (e as TouchEvent).touches[0];
    returnCoordinate.x = touch.clientX;
    returnCoordinate.y = touch.clientY;
    return returnCoordinate;
  }

  if (!simulationArea.touch) {
    returnCoordinate.x = (e as MouseEvent).clientX;
    returnCoordinate.y = (e as MouseEvent).clientY;
    return returnCoordinate;
  }

  return returnCoordinate;
}

/**
 * Two-finger pinch to zoom, about the midpoint of the two touches.
 *
 * The first two-finger move seeds the gesture from the current zoom (so a
 * pinch continues from where the canvas already is), and every later move
 * nudges the scale by PINCH_STEP depending on whether the fingers spread or
 * close. The pan offset is adjusted the same way `changeScale` does, so the
 * point between the fingers stays put.
 * @param e - touch event with two touches
 * @param scope - scope to zoom (defaults to the global scope)
 */
export function pinchZoom(e: TouchEvent, scope = globalScope): void {
  e.preventDefault();
  const a = e.touches[0];
  const b = e.touches[1];
  const distance = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);

  if (!pinchActive) {
    pinchActive = true;
    pinchDistance = distance;
    pinchScale = scope.scale;
    syncPanOrigin(scope);
    return;
  }

  if (distance > pinchDistance) {
    pinchScale += PINCH_STEP;
  } else if (distance < pinchDistance) {
    pinchScale -= PINCH_STEP;
  }
  pinchDistance = distance;
  // Same bounds as changeScale
  pinchScale = Math.max(0.5, Math.min(4 * DPR, pinchScale));

  const oldScale = scope.scale;
  const newScale = Math.round(pinchScale * 10) / 10;
  if (newScale === oldScale) return;

  // Zoom about the midpoint of the two touches, in canvas coordinates
  const rect = simulationArea.canvas.getBoundingClientRect();
  const midX = ((a.clientX + b.clientX) / 2 - rect.left) * DPR;
  const midY = ((a.clientY + b.clientY) / 2 - rect.top) * DPR;
  const xx = (midX - scope.ox) / oldScale;
  const yy = (midY - scope.oy) / oldScale;

  scope.scale = newScale;
  scope.ox -= Math.round(xx * (newScale - oldScale));
  scope.oy -= Math.round(yy * (newScale - oldScale));
  syncPanOrigin(scope);

  gridUpdateSet(true);
  updateSimulationSet(true);
  updatePositionSet(true);
  updateCanvasSet(true);
  scheduleUpdate(1);
}

/**
 * While a finger is down with the root selected, the engine's pan logic
 * (`updateSelectionsAndPane`) rewrites `ox/oy` as
 * `mouseRaw - mouseDownRaw + oldx/oldy` on every update. Re-base `oldx/oldy`
 * so that formula reproduces the offset the pinch just set instead of
 * overwriting it.
 */
function syncPanOrigin(scope: typeof globalScope): void {
  simulationArea.oldx = scope.ox - (simulationArea.mouseRawX - simulationArea.mouseDownRawX);
  simulationArea.oldy = scope.oy - (simulationArea.mouseRawY - simulationArea.mouseDownRawY);
}

/**
 * Ends the current pinch gesture so the next one starts from the live zoom.
 */
export function resetPinch(): void {
  pinchActive = false;
  pinchDistance = 0;
}

/**
 * Starts a pan / drag on the canvas. Works for both touch and mouse.
 * @param e - mouse or touch event
 */
export function panStart(e: PointerLikeEvent): void {
  coordinate = getCoordinate(e);
  simulationArea.mouseDown = true;
  // Deselect Input
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  errorDetectedSet(false);
  updateSimulationSet(true);
  updatePositionSet(true);
  updateCanvasSet(true);
  simulationArea.lastSelected = undefined;
  simulationArea.selected = false;
  simulationArea.hover = undefined;
  const rect = simulationArea.canvas.getBoundingClientRect();
  simulationArea.mouseDownRawX = (coordinate.x - rect.left) * DPR;
  simulationArea.mouseDownRawY = (coordinate.y - rect.top) * DPR;
  simulationArea.mouseDownX =
    Math.round((simulationArea.mouseDownRawX - globalScope.ox) / globalScope.scale / unit) * unit;
  simulationArea.mouseDownY =
    Math.round((simulationArea.mouseDownRawY - globalScope.oy) / globalScope.scale / unit) * unit;
  if (simulationArea.touch) {
    simulationArea.mouseX = simulationArea.mouseDownX;
    simulationArea.mouseY = simulationArea.mouseDownY;
  }

  simulationArea.oldx = globalScope.ox;
  simulationArea.oldy = globalScope.oy;
  e.preventDefault();
  scheduleBackup();
  scheduleUpdate(1);
  document.querySelectorAll(".dropdown.open").forEach((el) => el.classList.remove("open"));
}

/**
 * Pans the canvas / drags the selected element. Works for both touch and mouse.
 * Two-finger touch triggers pinch zoom instead.
 * @param e - mouse or touch event
 */
export function panMove(e: PointerLikeEvent): void {
  // If only one it touched
  // pan left or right
  if (!simulationArea.touch || (e as TouchEvent).touches.length === 1) {
    coordinate = getCoordinate(e);
    const rect = simulationArea.canvas.getBoundingClientRect();
    simulationArea.mouseRawX = (coordinate.x - rect.left) * DPR;
    simulationArea.mouseRawY = (coordinate.y - rect.top) * DPR;
    simulationArea.mouseXf = (simulationArea.mouseRawX - globalScope.ox) / globalScope.scale;
    simulationArea.mouseYf = (simulationArea.mouseRawY - globalScope.oy) / globalScope.scale;
    simulationArea.mouseX = Math.round(simulationArea.mouseXf / unit) * unit;
    simulationArea.mouseY = Math.round(simulationArea.mouseYf / unit) * unit;
    updateCanvasSet(true);
    const lastSelected = simulationArea.lastSelected as
      | { newElement?: boolean; update?: () => unknown }
      | null
      | undefined;
    if (lastSelected && (simulationArea.mouseDown || lastSelected.newElement)) {
      updateCanvasSet(true);
      let fn;

      if (simulationArea.lastSelected == globalScope.root) {
        fn = function () {
          updateSelectionsAndPane();
        };
      } else {
        fn = function () {
          const selected = simulationArea.lastSelected as
            | { update?: () => unknown }
            | null
            | undefined;
          if (selected) {
            selected.update?.();
          }
        };
      }

      scheduleUpdate(0, 20, fn);
    } else {
      scheduleUpdate(0, 200);
    }
  }

  // If two fingers are touched
  // pinchZoom
  if (simulationArea.touch && (e as TouchEvent).touches.length === 2) {
    pinchZoom(e as TouchEvent, globalScope);
  }
}

/**
 * Ends a pan / drag on the canvas. Works for both touch and mouse.
 * @param e - mouse or touch event
 */
export function panStop(e: PointerLikeEvent): void {
  const simulatorMobileStore = useSimulatorMobileStore();
  simulationArea.mouseDown = false;
  if (simulationArea.touch && (e as TouchEvent).touches.length < 2) {
    resetPinch();
  }
  if (!lightMode) {
    updatelastMinimapShown();
    setTimeout(removeMiniMap, 2000);
  }

  errorDetectedSet(false);
  updateSimulationSet(true);
  updatePositionSet(true);
  updateCanvasSet(true);
  gridUpdateSet(true);
  wireToBeCheckedSet(1);

  scheduleUpdate(1);
  simulationArea.mouseDown = false;

  for (let i = 0; i < 2; i++) {
    updatePositionSet(true);
    wireToBeCheckedSet(1);
    update();
  }

  errorDetectedSet(false);
  updateSimulationSet(true);
  updatePositionSet(true);
  updateCanvasSet(true);
  gridUpdateSet(true);
  wireToBeCheckedSet(1);

  scheduleUpdate(1);

  if (
    !(
      simulationArea.mouseRawX < 0 ||
      simulationArea.mouseRawY < 0 ||
      simulationArea.mouseRawX > width ||
      simulationArea.mouseRawY > height
    )
  ) {
    uxvar.smartDropXX = simulationArea.mouseX + 100;
    uxvar.smartDropYY = simulationArea.mouseY - 50;
  }

  if (simulationArea.touch) {
    const { isCopy } = toRefs(simulatorMobileStore);
    // small hack so Current circuit element should not spawn above last circuit element
    if (!isCopy.value) {
      findDimensions(globalScope);
      simulationArea.mouseX = 100 + simulationArea.maxWidth || 0;
      simulationArea.mouseY = simulationArea.minHeight || 0;
      getTap(e);
    }
  }
}

/**
 * Post-drop bookkeeping on canvas mouseup: clears the `newElement` flag,
 * records restricted element usage and collapses a multi-selection on plain click.
 */
export function onCanvasMouseUp(): void {
  const restrictedElements: string[] = (window as any).restrictedElements || [];
  const lastSelected = simulationArea.lastSelected as any;

  if (lastSelected) {
    lastSelected.newElement = false;
  }
  // handling restricted circuit elements
  if (
    lastSelected &&
    restrictedElements.includes(lastSelected.objectType) &&
    !globalScope.restrictedCircuitElementsUsed.includes(lastSelected.objectType)
  ) {
    globalScope.restrictedCircuitElementsUsed.push(lastSelected.objectType);
    updateRestrictedElementsList();
  }

  // deselect multiple elements with click
  if (!simulationArea.shiftDown && simulationArea.multipleObjectSelections.length > 0) {
    if (!simulationArea.multipleObjectSelections.includes(lastSelected)) {
      simulationArea.multipleObjectSelections = [];
    }
  }
}

/**
 * Wheel-zoom on the canvas. Reads the standard `deltaY`, falling back to the
 * legacy `wheelDelta` / `detail` fields for old `mousewheel` / `DOMMouseScroll` events.
 * @param event - wheel event
 */
export function onCanvasWheel(event: WheelEvent): void {
  updateCanvasSet(true);
  event.preventDefault();
  const legacy = event as WheelEvent & { wheelDelta?: number };
  let deltaY: number;
  if (event.type === "wheel") {
    deltaY = -event.deltaY;
  } else {
    deltaY = legacy.wheelDelta ? legacy.wheelDelta : -event.detail;
  }
  const direction = deltaY > 0 ? 1 : -1;
  zoomBy(direction);
  updateCanvasSet(true);
  gridUpdateSet(true);

  if (layoutModeGet()) layoutUpdate();
  else update(); // Schedule update not working, this is INEFFICIENT
}
