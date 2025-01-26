import Vue from 'vue';
import { fullView } from './ux';
import { createSubCircuitPrompt } from './subcircuit';
import save from './data/save';
import load from './data/load';
import createSaveAsImgPrompt from './data/saveImage';
import {
    clearProject,
    newProject,
    saveOffline,
    openOffline,
    recoverProject,
} from './data/project';
import { createNewCircuitScope } from './circuit';
import { createCombinationalAnalysisPrompt } from './combinationalAnalysis';
import { colorThemes } from './themer/themer';
import { showTourGuide } from './tutorials';
import { createVerilogCircuit } from './Verilog2CV';
import { generateVerilog } from './verilog';
import { bitConverterDialog } from './utils';
import keyBinder from '#/components/DialogBox/CustomShortcut.vue';
import ExportProject from '#/components/DialogBox/ExportProject.vue';
import ImportProject from '#/components/DialogBox/ImportProject.vue';

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
    showTourGuide: typeof showTourGuideHelper;
    newVerilogModule: typeof createVerilogCircuit;
    generateVerilog: typeof generateVerilog;
    bitconverter: typeof bitConverterDialog;
    createNewCircuitScope: typeof createNewCircuitScope;
    customShortcut: typeof keyBinder;
    ExportProject: typeof ExportProject;
    ImportProject: typeof ImportProject;
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
    createNewCircuitScope,
    customShortcut: keyBinder,
    ExportProject,
    ImportProject,
};

export default logixFunction;

/**
 * Initializes the tour guide with a slight delay to ensure DOM is ready.
 * @todo Refactor to use proper lifecycle hooks or event-based initialization
 */
function showTourGuideHelper(): void {
    // Consider using Vue's nextTick or proper event listeners
    Vue.nextTick(() => {
            showTourGuide();
        });
}

// Hack to call createNewCircuitScope with keyboard shortcut
function createNewCircuit(): void {
    createNewCircuitScope();
}