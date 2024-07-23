import { defineStore } from "pinia";
import { ref, Ref, watch } from "vue";

export const useLayoutStore = defineStore("layoutStore", () => {
  const layoutMode = ref(false);
  const layoutDialog: Ref<HTMLElement | null> = ref(null);
  const layoutElementPanel: Ref<HTMLElement | null> = ref(null);
  const elementsPanel: Ref<HTMLElement | null> = ref(null);
  const timingDiagramPanel: Ref<HTMLElement | null> = ref(null);
  const testbenchPanel: Ref<HTMLElement | null> = ref(null);

  watch(layoutMode, (val) => {
    if (val) {
      fadeIn(layoutDialog.value);
      fadeIn(layoutElementPanel.value);
      fadeOut(elementsPanel.value);
      fadeOut(timingDiagramPanel.value);
      fadeOut(testbenchPanel.value);
    } else {
      fadeOut(layoutDialog.value);
      fadeOut(layoutElementPanel.value);
      fadeIn(elementsPanel.value);
      fadeIn(timingDiagramPanel.value);
      fadeIn(testbenchPanel.value);
    }
  });

  function fadeIn(element: HTMLElement | null, duration = 200) {
    if (!element) return;
    element.style.display = "block";
    element.style.opacity = "0";
    let startTime: number | null = null;

    function animate(currentTime: number | null) {
      if (!startTime) {
        startTime = currentTime;
      }

      const elapsedTime = (currentTime ?? 0) - (startTime ?? 0);
      const newOpacity = elapsedTime / duration;

      element!.style.opacity = newOpacity > 1 ? "1" : newOpacity.toString();

      if (elapsedTime < duration) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }

  function fadeOut(element: HTMLElement | null, duration = 200) {
    if (!element) return;
    let startTime: number | null = null;

    function animate(currentTime: number | null) {
      if (!startTime) {
        startTime = currentTime;
      }

      const elapsedTime = (currentTime ?? 0) - (startTime ?? 0);
      const newOpacity = 1 - elapsedTime / duration;

      element!.style.opacity = newOpacity < 0 ? "0" : newOpacity.toString();

      if (elapsedTime < duration) {
        requestAnimationFrame(animate);
      } else {
        element!.style.display = "none";
      }
    }

    requestAnimationFrame(animate);
  }

  return {
    layoutMode,
    layoutDialog,
    layoutElementPanel,
    elementsPanel,
    timingDiagramPanel,
    testbenchPanel,
  };
});