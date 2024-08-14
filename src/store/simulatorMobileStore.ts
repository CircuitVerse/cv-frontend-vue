import { defineStore } from "pinia";
import { ref } from "vue";

export const useSimulatorMobileStore = defineStore("simulatorMobileStore", () => {
  const showElementsPanel = ref(false);
  const minWidthToShowSidebar = ref(992);
  const showMobileView = ref(false);
  const isCopy = ref(false);

  showMobileView.value = window.innerWidth < minWidthToShowSidebar.value ? true : false

  return {
    showElementsPanel,
    minWidthToShowSidebar,
    showMobileView,
    isCopy
  };
});