import { onMounted, onUnmounted } from "vue";
import {
  cutSelection,
  copySelection,
  pasteFromClipboard,
} from "#/simulator/src/commands/clipboard";

/**
 * Binds the simulator's cut / copy / paste handling to `document` for the
 * lifetime of the calling component.
 */
export function useSimulatorClipboard(): void {
  onMounted(() => {
    document.addEventListener("cut", cutSelection);
    document.addEventListener("copy", copySelection);
    document.addEventListener("paste", pasteFromClipboard);
  });

  onUnmounted(() => {
    document.removeEventListener("cut", cutSelection);
    document.removeEventListener("copy", copySelection);
    document.removeEventListener("paste", pasteFromClipboard);
  });
}
