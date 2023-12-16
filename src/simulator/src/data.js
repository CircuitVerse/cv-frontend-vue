import {fullView} from './ux';
import {createSubCircuitPrompt} from './subcircuit';
import {save} from './data/save';
import {load} from './data/load';
import {createSaveAsImgPrompt} from './data/saveImage';
import {
  clearProject,
  newProject,
  saveOffline,
  openOffline,
  recoverProject,
} from './data/project';
import {createNewCircuitScope} from './circuit';
import {createCombinationalAnalysisPrompt} from './combinational_analysis';
import {colorThemes} from './themer/themer';
import {showTourGuide} from './tutorials';
import {SimulatorStore} from '#/store/SimulatorStore/SimulatorStore';

import {
  createVerilogCircuit,
} from './verilog_to_cv';
import {generateVerilog} from './verilog';
import {keyBinder} from '#/components/DialogBox/CustomShortcut.vue';
import {ExportProject} from '#/components/DialogBox/ExportProject.vue';
import {ImportProject} from '#/components/DialogBox/ImportProject.vue';

export const logixFunction = {};
logixFunction.save = save;
logixFunction.load = load;
logixFunction.createSaveAsImgPrompt = createSaveAsImgPrompt;
logixFunction.clearProject = clearProject;
logixFunction.newProject = newProject;
logixFunction.saveOffline = saveOffline;
// logixFunction.newCircuit = newCircuit
logixFunction.createOpenLocalPrompt = openOffline;
logixFunction.recoverProject = recoverProject;
logixFunction.createSubCircuitPrompt = createSubCircuitPrompt;
logixFunction.createCombinationalAnalysisPrompt =
    createCombinationalAnalysisPrompt;
logixFunction.fullViewOption = fullView;
logixFunction.colorThemes = colorThemes;
logixFunction.showTourGuide = showTourGuideHelper;
logixFunction.newVerilogModule = createVerilogCircuit;
// logixFunction.saveVerilogCode = saveVerilogCode
// logixFunction.resetVerilogCode = resetVerilogCode
logixFunction.generateVerilog = generateVerilog;
// logixFunction.applyVerilogTheme = applyVerilogTheme
logixFunction.bitconverter = function bitConverterDialog() {
  const simulatorStore = SimulatorStore();
  simulatorStore.dialogBox.hex_bin_dec_converter_dialog = true;
};
logixFunction.createNewCircuitScope = createNewCircuitScope;
logixFunction.customShortcut = keyBinder;
logixFunction.ExportProject = ExportProject;
logixFunction.ImportProject = ImportProject;

// Hack to restart tour guide
function showTourGuideHelper() {
  setTimeout(() => {
    showTourGuide();
  }, 100);
}
