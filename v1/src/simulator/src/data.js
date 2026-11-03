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
import { bitConverterDialog, showError } from './utils'
import { keyBinder } from '#/components/DialogBox/CustomShortcut.vue'
import { ExportProject } from '#/components/DialogBox/ExportProject.vue'
import { ImportProject } from '#/components/DialogBox/ImportProject.vue'
import { beautifyCircuit, isBeautifyInProgress } from './utils/autoLayout'
import { simulationArea } from './simulationArea'

const logixFunction = {}
logixFunction.save = save
logixFunction.load = load
logixFunction.createSaveAsImgPrompt = createSaveAsImgPrompt
logixFunction.clearProject = clearProject
logixFunction.newProject = newProject
logixFunction.saveOffline = saveOffline
logixFunction.createOpenLocalPrompt = openOffline
logixFunction.recoverProject = recoverProject
logixFunction.createSubCircuitPrompt = createSubCircuitPrompt
logixFunction.createCombinationalAnalysisPrompt =
    createCombinationalAnalysisPrompt
logixFunction.fullViewOption = fullView
logixFunction.colorThemes = colorThemes
logixFunction.showTourGuide = showTourGuideHelper
logixFunction.newVerilogModule = createVerilogCircuit
logixFunction.generateVerilog = generateVerilog
logixFunction.bitconverter = bitConverterDialog
logixFunction.createNewCircuitScope = createNewCircuit
logixFunction.customShortcut = keyBinder
logixFunction.ExportProject = ExportProject
logixFunction.ImportProject = ImportProject
logixFunction.beautifyCircuit = triggerBeautifyCircuit
export default logixFunction

// Hack to restart tour guide
function showTourGuideHelper() {
    setTimeout(() => {
        showTourGuide()
    }, 100)
}

// Hack to call createNewCircuitScope with keyboard shortcut
function createNewCircuit() {
    createNewCircuitScope()
}

function triggerBeautifyCircuit() {
    if (isBeautifyInProgress()) return
    const hasSelection = (simulationArea.multipleObjectSelections?.length ?? 0) > 0
    beautifyCircuit(undefined, hasSelection)
        .then((ok) => {
            if (!ok) showError('Beautify Circuit could not lay out the circuit.')
        })
        .catch((err) => {
            console.error('[autoLayout] Error:', err)
            showError('Beautify Circuit failed.')
        })
}
