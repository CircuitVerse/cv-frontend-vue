import { fullView } from './ux'
import { createSubCircuitPrompt } from './subcircuit'
import save from './data/save'
import load from './data/load'
import createSaveAsImgPrompt from './data/saveImage'
import {
  clearProject,
  newProject,
  saveOffline,
  openOffline,
  recoverProject,
} from './data/project'
import { createNewCircuitScope } from './circuit'
import { createCombinationalAnalysisPrompt } from './combinationalAnalysis'
import { colorThemes } from './themer/themer'
import { showTourGuide } from './tutorials'
import { createVerilogCircuit } from './Verilog2CV'
import { generateVerilog } from './verilog'
import { bitConverterDialog } from './utils'
import { keyBinder } from '#/components/DialogBox/CustomShortcut.vue'
import { ExportProject } from '#/components/DialogBox/ExportProject.vue'
import { ImportProject } from '#/components/DialogBox/ImportProject.vue'

// Define an interface for the logixFunction object
interface LogixFunction {
  save: typeof save
  load: typeof load
  createSaveAsImgPrompt: typeof createSaveAsImgPrompt
  clearProject: typeof clearProject
  newProject: typeof newProject
  saveOffline: typeof saveOffline
  createOpenLocalPrompt: typeof openOffline
  recoverProject: typeof recoverProject
  createSubCircuitPrompt: typeof createSubCircuitPrompt
  createCombinationalAnalysisPrompt: typeof createCombinationalAnalysisPrompt
  fullViewOption: typeof fullView
  colorThemes: typeof colorThemes
  showTourGuide: () => void
  newVerilogModule: typeof createVerilogCircuit
  generateVerilog: typeof generateVerilog
  bitconverter: typeof bitConverterDialog
  createNewCircuitScope: () => void
  customShortcut: typeof keyBinder
  ExportProject: typeof ExportProject
  ImportProject: typeof ImportProject
}

// Implement the object
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
}

export default logixFunction

// Hack to restart tour guide
function showTourGuideHelper(): void {
  setTimeout(() => {
    showTourGuide()
  }, 100)
}

// Hack to call createNewCircuitScope with keyboard shortcut
function createNewCircuit(): void {
  createNewCircuitScope()
}
