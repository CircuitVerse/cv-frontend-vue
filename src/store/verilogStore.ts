import { defineStore } from "pinia";
import { ref } from "vue";

const getInitialTheme = (): string => {
  try {
    if (typeof localStorage !== "undefined" && typeof localStorage.getItem === "function") {
      return localStorage.getItem("verilog-theme") || "default";
    }
  } catch {
    // Ignore in environments where localStorage is restricted or mocked
  }
  return "default";
};

export const useVerilogStore = defineStore("verilogStore", () => {
  const isTerminalVisible = ref(false);

  const selectedTheme = ref(getInitialTheme());

  const toggleTerminal = () => {
    isTerminalVisible.value = !isTerminalVisible.value;
  };

  const showTerminal = () => {
    isTerminalVisible.value = true;
  };

  const hideTerminal = () => {
    isTerminalVisible.value = false;
  };

  const setTheme = (theme: string) => {
    selectedTheme.value = theme;
    try {
      if (typeof localStorage !== "undefined" && typeof localStorage.setItem === "function") {
        localStorage.setItem("verilog-theme", theme);
      }
    } catch {
      // Ignore
    }
  };

  return {
    isTerminalVisible,
    toggleTerminal,
    showTerminal,
    hideTerminal,

    selectedTheme,
    setTheme,
  };
});
