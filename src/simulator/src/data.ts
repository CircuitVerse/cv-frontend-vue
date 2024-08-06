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

const logixFunction = {
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
    createNewCircuitScope,
    customShortcut: keyBinder,
    ExportProject,
    ImportProject,
}

export default logixFunction

// Hack to restart tour guide
function showTourGuideHelper(): void {
    setTimeout((): void => {
        showTourGuide()
    }, 100)
}
