import { changeScale } from "../canvasApi";
import { gridUpdateSet, scheduleUpdate } from "../engine";

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
