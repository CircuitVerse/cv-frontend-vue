import { onMounted, onUnmounted } from "vue";
import { handleSimulatorKeyDown, handleSimulatorKeyUp } from "#/simulator/src/commands/keyboard";

/**
 * Binds the simulator's global keyboard shortcuts (undo/redo, zoom, delete,
 * select-all, per-element keys, ...) to `window` for the lifetime of the
 * calling component.
 */
export function useSimulatorShortcuts(): void {
  onMounted(() => {
    // keydown is captured so element key handlers win over other listeners
    window.addEventListener("keydown", handleSimulatorKeyDown, true);
    window.addEventListener("keyup", handleSimulatorKeyUp);
  });

  onUnmounted(() => {
    window.removeEventListener("keydown", handleSimulatorKeyDown, true);
    window.removeEventListener("keyup", handleSimulatorKeyUp);
  });
}
