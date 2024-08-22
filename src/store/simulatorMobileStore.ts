import { defineStore } from "pinia";
import { ref } from "vue";

export type ElementsType = 'elements' | 'layout-elements'

export const useSimulatorMobileStore = defineStore("simulatorMobileStore", () => {
  const minWidthToShowMobile = ref(991);
  const showMobileView = ref(false);
  const showCanvas = ref(false);
  const showTimingDiagram = ref(false);
  const showElementsPanel = ref(false);
  const showPropertiesPanel = ref(false);
  const isCopy = ref(false);
  const showCircuits = ref<ElementsType>('elements')

  showMobileView.value = window.innerWidth <= minWidthToShowMobile.value ? true : false

  return {
    minWidthToShowMobile,
    showMobileView,
    showCanvas,
    showTimingDiagram,
    showElementsPanel,
    showPropertiesPanel,
    isCopy,
    showCircuits,
  };
});
