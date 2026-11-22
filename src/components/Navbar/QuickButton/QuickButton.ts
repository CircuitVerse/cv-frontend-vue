import logixFunction from "#/simulator/src/data";
import { deleteSelected } from "#/simulator/src/ux";
import undo from "#/simulator/src/data/undo";
import redo from "#/simulator/src/data/redo";
import { fullView } from "#/simulator/src/ux";
import { ZoomIn, ZoomOut } from "#/simulator/src/listeners";

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
  const val = parseInt(slider.value, 10);
  if (val > 0) {
    slider.value = String(val - 1);
    // Drive the slider's change handler to keep curLevel and canvas scale in sync
    slider.dispatchEvent(new Event("change", { bubbles: true }));
  }
}
export function increment(): void {
  const slider = document.getElementById("customRange1") as HTMLInputElement | null;
  if (!slider) {
    ZoomIn();
    return;
  }
  const val = parseInt(slider.value, 10);
  if (val < 45) {
    slider.value = String(val + 1);
    // Drive the slider's change handler to keep curLevel and canvas scale in sync
    slider.dispatchEvent(new Event("change", { bubbles: true }));
  }
}
