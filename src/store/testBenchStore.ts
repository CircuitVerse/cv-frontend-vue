import { defineStore } from "pinia";
import { reactive, ref } from "vue";

interface PopupStyle {
  height: number;
  width: number;
  top: number;
  left: number;
}

export const useTestBenchStore = defineStore("testBenchStore", () => {
  const showTestBenchCreator = ref(false);
  const scopeId = ref<string | null>(null);
  const showPopup = ref(false);
  const data = ref<string | null>(null);
  const popupStyle: PopupStyle = reactive({
    height: 0,
    width: 0,
    top: 0,
    left: 0
  })

  const toggleTestBenchCreator = (value: boolean) => {
    showTestBenchCreator.value = value;
  }

  const createCreator = (id: string, popup: boolean, style: PopupStyle) => {
    scopeId.value = id;
    showPopup.value = popup;
    popupStyle.height = style.height;
    popupStyle.width = style.width;
    popupStyle.top = style.top;
    popupStyle.left = style.left;
  }

  return {
    showTestBenchCreator,
    toggleTestBenchCreator,
    createCreator,
    scopeId,
    showPopup,
    popupStyle,
  }
})