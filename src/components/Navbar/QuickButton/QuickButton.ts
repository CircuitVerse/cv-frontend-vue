import logixFunction from "#/simulator/src/data";
import { deleteSelected } from "#/simulator/src/ux";
import undo from "#/simulator/src/data/undo";
import redo from "#/simulator/src/data/redo";
import { fullView } from "#/simulator/src/ux";
import { ZoomIn, ZoomOut, syncZoomSlider } from "#/simulator/src/listeners";
import { changeScale } from "#/simulator/src/canvasApi";
import { gridUpdateSet, scheduleUpdate, updateCanvasSet } from "#/simulator/src/engine";

function getEffectiveDpr(): number {
  const rawDpr = typeof window.DPR === "number" ? window.DPR : window.devicePixelRatio || 1;
  return typeof lightMode !== "undefined" && lightMode ? 1 : rawDpr;
}

export function saveOnline(): void {
  logixFunction.save();
}
export function saveOffline(): void {
  logixFunction.saveOffline();
}
export function deleteSelectedItem(): void {
  deleteSelected();
}
export function createSaveAsImgPrompt(): void {
  logixFunction.createSaveAsImgPrompt();
}
export function zoomToFit(): void {
  globalScope.centerFocus(false);
  syncZoomSlider();
}
export function undoit(): void {
  undo();
}
export function redoit(): void {
  redo();
}
export function view(): void {
  fullView();
}
export function decrement(): void {
  const slider = document.getElementById("customRange1") as HTMLInputElement | null;
  if (!slider) {
    ZoomOut();
    return;
  }
  const min = parseInt(slider.min || "0", 10);
  const val = parseInt(slider.value, 10);
  if (val > min) {
    slider.value = String(val - 1);
    // Drive the slider's change handler to keep curLevel and canvas scale in sync
    slider.dispatchEvent(new Event("change", { bubbles: true }));
  } else if (globalScope.scale > 0.5) {
    updateCanvasSet(true);
    changeScale(-0.1, "zoomButton", "zoomButton", 3);
    gridUpdateSet(true);
    syncZoomSlider();
    scheduleUpdate();
  }
}
export function increment(): void {
  const slider = document.getElementById("customRange1") as HTMLInputElement | null;
  if (!slider) {
    ZoomIn();
    return;
  }
  const max = parseInt(slider.max || "45", 10);
  const val = parseInt(slider.value, 10);
  const maxScale = 4 * getEffectiveDpr();
  if (val < max) {
    slider.value = String(val + 1);
    // Drive the slider's change handler to keep curLevel and canvas scale in sync
    slider.dispatchEvent(new Event("change", { bubbles: true }));
  } else if (globalScope.scale < maxScale) {
    updateCanvasSet(true);
    changeScale(0.1, "zoomButton", "zoomButton", 3);
    gridUpdateSet(true);
    syncZoomSlider();
    scheduleUpdate();
  }
}
