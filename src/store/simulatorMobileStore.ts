import { defineStore } from "pinia";
import { ref } from "vue";

export const useSimulatorMobileStore = defineStore("simulatorMobileStore", () => {
  const minWidthToShowMobile = ref(992);
  const showMobileView = ref(false);

  showMobileView.value = window.innerWidth < minWidthToShowMobile.value ? true : false

  return {
    minWidthToShowMobile,
    showMobileView,
  };
});
