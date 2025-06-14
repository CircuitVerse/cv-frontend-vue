import { SimulatorStore } from '#/store/SimulatorStore/SimulatorStore';
import Scope from '../circuit'; 

// Type declaration for global variable
declare var globalScope: Scope;

/**
 * Function called to generate a prompt to save an image
 * @category data
 * @param {Scope=} scope - circuit whose image we want
 * @exports createSaveAsImgPrompt
 */
export default function createSaveAsImgPrompt(scope: Scope = globalScope): void {
    const simulatorStore = SimulatorStore();
    simulatorStore.dialogBox.saveimage_dialog = true;
}