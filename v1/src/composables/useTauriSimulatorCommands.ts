import { onMounted, onUnmounted } from "vue";
import { isTauri } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import logixFunction from "#/simulator/src/data";

/** Desktop (Tauri) menu events and the `logixFunction` action each one triggers. */
const TAURI_MENU_COMMANDS: Record<string, string> = {
  "new-project": "newProject",
  "save-online": "save",
  "save-offline": "saveOffline",
  "open-offline": "createOpenLocalPrompt",
  export: "ExportProject",
  import: "ImportProject",
  recover: "recoverProject",
  clear: "clearProject",
  "preview-circuit": "fullViewOption",
  "new-circuit": "createNewCircuitScope",
  "new-verilog-module": "newVerilogModule",
  "insert-sub-circuit": "createSubCircuitPrompt",
  "combinational-analysis": "createCombinationalAnalysisPrompt",
  "hex-bin-dec": "bitconverter",
  "download-image": "createSaveAsImgPrompt",
  themes: "colorThemes",
  "custom-shortcut": "customShortcut",
  "export-verilog": "generateVerilog",
  tutorial: "showTourGuide",
  "user-manual": "showUserManual",
  "learn-digital-circuit": "showDigitalCircuit",
  "discussion-forum": "showDiscussionForum",
};

const actions = logixFunction as unknown as Record<string, (() => unknown) | undefined>;

function runMenuCommand(event: string, action: string): void {
  const fn = actions[action];
  if (typeof fn !== "function") {
    console.warn(`[tauri] menu event "${event}" has no simulator action "${action}"`);
    return;
  }
  fn();
}

/**
 * Registers the desktop app's menu commands while the calling component is
 * mounted. Does nothing outside Tauri, so the browser build never calls
 * `listen()` (which throws without the Tauri runtime).
 */
export function useTauriSimulatorCommands(): void {
  let unlisteners: UnlistenFn[] = [];
  let active = false;

  onMounted(async () => {
    if (!isTauri()) return;
    active = true;
    const registrations = await Promise.all(
      Object.entries(TAURI_MENU_COMMANDS).map(([event, action]) =>
        listen(event, () => runMenuCommand(event, action)),
      ),
    );
    // Component may have unmounted while listen() was resolving
    if (!active) {
      registrations.forEach((unlisten) => unlisten());
      return;
    }
    unlisteners = registrations;
  });

  onUnmounted(() => {
    active = false;
    unlisteners.forEach((unlisten) => unlisten());
    unlisteners = [];
  });
}
