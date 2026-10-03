import { simulationArea } from "../simulationArea";
import { deleteSelected } from "../ux";
import { updateSimulationSet, updatePositionSet, errorDetectedSet } from "../engine";

/**
 * Clears the current multiple element selection.
 */
export function clearMultiSelection(): void {
  simulationArea.multipleObjectSelections = [];
}

/**
 * Starts a simulation update cycle for the selected elements.
 */
export function startSelectionUpdate(): void {
  errorDetectedSet(false);
  updateSimulationSet(true);
  updatePositionSet(true);
}

export { deleteSelected };
