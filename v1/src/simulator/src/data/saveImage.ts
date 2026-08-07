import { SimulatorStore } from "#/store/SimulatorStore/SimulatorStore";

/**
 * Function called to generate a prompt to save an image
 * @category data
 * @exports createSaveAsImgPrompt
 */
export default function createSaveAsImgPrompt(): void {
  const simulatorStore = SimulatorStore();
  simulatorStore.dialogBox.saveimage_dialog = true;
}
