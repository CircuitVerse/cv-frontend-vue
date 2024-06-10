import { defineStore } from "pinia";
import { ref } from "vue";

export const useTestBenchStore = defineStore("testBenchStore", () => {
  const showTestBenchCreator = ref(false);

  return {
    showTestBenchCreator,
  }
})