import { defineStore } from "pinia";
import { ref } from "vue";

export const useSimulatorMobileStore = defineStore("simulatorMobileStore", () => {
  const minWidthToShowMobile = ref(992);
  const showMobileView = ref(false);
  const showCanvas = ref(false);
  const showTimingDiagram = ref(false);
  const showElementsPanel = ref(false);
  const isCopy = ref(false);

  showMobileView.value = window.innerWidth < minWidthToShowMobile.value ? true : false

  return {
    minWidthToShowMobile,
    showMobileView,
    showCanvas,
    showTimingDiagram,
    showElementsPanel,
    isCopy
  };
});
