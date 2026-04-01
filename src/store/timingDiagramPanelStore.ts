import { defineStore } from "pinia";
import { ref } from "vue";
import buttonsJSON from "#/assets/constants/Panels/TimingDiagramPanel/buttons.json";

export interface TimingDiagramButton {
  title: string;
  icon: string;
  class: string;
  type: string;
  click: string;
}

export const useTimingDiagramPanelStore = defineStore("timingDiagramPanelStore", () => {
  const buttons = ref<TimingDiagramButton[]>(buttonsJSON);
  const plotRef = ref<HTMLElement | null>(null);
  const cycleUnits = ref(1000);
  const timingDiagramPanelRef = ref<HTMLElement | null>(null);

  const logMessage = ref("");
  const logColor = ref("#42b983");

  const setLog = (message: string, color: string) => {
    logMessage.value = message;
    logColor.value = color;
  };

  const clearLog = () => {
    logMessage.value = "";
    logColor.value = "#42b983";
  };

  return {
    buttons,
    plotRef,
    cycleUnits,
    timingDiagramPanelRef,
    logMessage,
    logColor,
    setLog,
    clearLog,
  };
});
