import { defineStore } from "pinia";
import { ref } from "vue";

export const useTimingDiagramStore = defineStore("timingDiagramStore", () => {
  const showUtilization = ref(false);

  return {
    showUtilization,
  }
})