import { fullView } from "./ux";
import { createSubCircuitPrompt } from "./subcircuit";
import save from "./data/save";
import load from "./data/load";
import createSaveAsImgPrompt from "./data/saveImage";
import { clearProject, newProject, saveOffline, openOffline, recoverProject } from "./data/project";
import { createNewCircuitScope } from "./circuit";
import { createCombinationalAnalysisPrompt } from "./combinationalAnalysis";
import { colorThemes } from "./themer/themer";
import { showTourGuide } from "./tutorials";
import { createVerilogCircuit } from "./Verilog2CV";
import { generateVerilog } from "./verilog";
import { bitConverterDialog } from "./utils";
import { keyBinder } from "#/components/DialogBox/CustomShortcut.vue";
import { ExportProject } from "#/components/DialogBox/ExportProject.vue";
import { ImportProject } from "#/components/DialogBox/ImportProject.vue";
import { beautifyCircuit } from "./utils/autoLayout";
import { simulationArea } from "./simulationArea";

interface LogixFunction {
  save: typeof save;
  load: typeof load;
  createSaveAsImgPrompt: typeof createSaveAsImgPrompt;
  clearProject: typeof clearProject;
  newProject: typeof newProject;
  saveOffline: typeof saveOffline;
  createOpenLocalPrompt: typeof openOffline;
  recoverProject: typeof recoverProject;
  createSubCircuitPrompt: typeof createSubCircuitPrompt;
  createCombinationalAnalysisPrompt: typeof createCombinationalAnalysisPrompt;
  fullViewOption: typeof fullView;
  colorThemes: typeof colorThemes;
  showTourGuide: () => void;
  newVerilogModule: typeof createVerilogCircuit;
  generateVerilog: typeof generateVerilog;
  bitconverter: typeof bitConverterDialog;
  createNewCircuitScope: () => void;
  customShortcut: typeof keyBinder;
  ExportProject: typeof ExportProject;
  ImportProject: typeof ImportProject;
  beautifyCircuit: () => void;
}

const logixFunction: LogixFunction = {
  save,
  load,
  createSaveAsImgPrompt,
  clearProject,
  newProject,
  saveOffline,
  createOpenLocalPrompt: openOffline,
  recoverProject,
  createSubCircuitPrompt,
  createCombinationalAnalysisPrompt,
  fullViewOption: fullView,
  colorThemes,
  showTourGuide: showTourGuideHelper,
  newVerilogModule: createVerilogCircuit,
  generateVerilog,
  bitconverter: bitConverterDialog,
  createNewCircuitScope: createNewCircuit,
  customShortcut: keyBinder,
  ExportProject,
  ImportProject,
  beautifyCircuit: triggerBeautifyCircuit,
};

export default logixFunction;

// Hack to restart tour guide
function showTourGuideHelper(): void {
  try {
    showTourGuide();
  } catch (error) {
    console.error("Failed to start tour guide:", error);
    throw error;
  }
}

// Hack to call createNewCircuitScope with keyboard shortcut
function createNewCircuit(): void {
  createNewCircuitScope();
}

// Hack to call beautifyCircuit with keyboard shortcut and navbar button
function triggerBeautifyCircuit(): void {
  const hasSelection = (simulationArea.multipleObjectSelections?.length ?? 0) > 0;
  beautifyCircuit(undefined, hasSelection).catch((err) =>
    console.error("[autoLayout] Error:", err),
  );
}
