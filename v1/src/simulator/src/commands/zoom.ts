import { ref } from "vue";
import { changeScale } from "../canvasApi";
import { gridUpdateSet, scheduleUpdate, updateCanvasSet } from "../engine";
import { layoutModeGet } from "../layoutMode";

export const zoomLevel = ref(5);
let curLevel = 5;

export function getCurLevel(): number {
  return curLevel;
}

export function setCurLevel(value: number): void {
  curLevel = value;
}

/**
 * Synchronizes the zoom slider UI and internal level with current canvas scale
 * without triggering a canvas rescale.
 */
export function syncZoomSlider(): void {
  if (layoutModeGet()) return;
  const dpr = (window as any).DPR || window.devicePixelRatio || 1;
  const scale = (window as any).globalScope?.scale ?? dpr;
  const computedLevel = Math.max(0, Math.min(45, Math.round(5 + (scale - dpr) * 10)));
  zoomLevel.value = computedLevel;
  curLevel = computedLevel;
}

export function increment(): void {
  if (zoomLevel.value < 45) {
    zoomLevel.value++;
    const changeInScale = zoomLevel.value - curLevel;
    updateCanvasSet(true);
    changeScale(changeInScale * 0.1, "zoomButton", "zoomButton", 3);
    gridUpdateSet(true);
    curLevel = zoomLevel.value;
  }
}

export function decrement(): void {
  if (zoomLevel.value > 0) {
    zoomLevel.value--;
    const changeInScale = zoomLevel.value - curLevel;
    updateCanvasSet(true);
    changeScale(changeInScale * 0.1, "zoomButton", "zoomButton", 3);
    gridUpdateSet(true);
    curLevel = zoomLevel.value;
  }
}

/**
 * Changes zoom level by the given direction.
 * @param direction - 1 to zoom in, -1 to zoom out
 */
export function zoomBy(direction: 1 | -1): void {
  const canZoom = direction === 1 ? globalScope.scale < 4 * DPR : globalScope.scale > 0.5;
  if (canZoom) {
    changeScale(direction * 0.1 * DPR);
  }
  gridUpdateSet(true);
  scheduleUpdate();
}

export const ZoomIn = () => zoomBy(1);
export const ZoomOut = () => zoomBy(-1);
