import { ref } from "vue";
import { changeScale } from "../canvasApi";
import { gridUpdateSet, scheduleUpdate, updateCanvasSet } from "../engine";
import { layoutModeGet } from "../layoutMode";

function getEffectiveDpr(): number {
  const rawDpr = typeof DPR === "number" ? DPR : window.devicePixelRatio || 1;
  return typeof lightMode !== "undefined" && lightMode ? 1 : rawDpr;
}

export function getMaxZoomLevel(dpr: number = getEffectiveDpr()): number {
  return Math.max(0, Math.round((4 * dpr - 0.5) * 10));
}

export const zoomLevel = ref(5);
export const maxZoomLevel = ref(35);
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
  const dpr = getEffectiveDpr();
  const maxLevel = getMaxZoomLevel(dpr);
  maxZoomLevel.value = maxLevel;
  const scale = typeof globalScope !== "undefined" ? globalScope.scale : dpr;
  const computedLevel = Math.max(0, Math.min(maxLevel, Math.round((scale - 0.5) * 10)));
  zoomLevel.value = computedLevel;
  curLevel = computedLevel;
}

export function increment(): void {
  const maxLevel = getMaxZoomLevel();
  maxZoomLevel.value = maxLevel;
  if (zoomLevel.value < maxLevel) {
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
