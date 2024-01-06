import {scheduleBackup} from './data/backup_circuit';
import {SimulatorStore} from '#/store/SimulatorStore/SimulatorStore';

// var inputSample = 5
// var dataSample = [
//     ['01---', '11110', '01---', '00000'],
//     ['01110', '1-1-1', '----0'],
//     ['01---', '11110', '01110', '1-1-1', '0---0'],
//     ['----1'],
// ]

/**
 * The prompt for combinational analysis
 * @param {Scope} scope - the circuit in which we want combinational analysis
 * @category combinationalAnalysis
 */
export function createCombinationalAnalysisPrompt(scope = globalScope) {
  scheduleBackup();
  SimulatorStore().dialogBox.combinationalanalysis_dialog = true;
}
