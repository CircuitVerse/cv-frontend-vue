import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useVerilogStore = defineStore('verilogStore', () => {
  const isTerminalVisible = ref(false)
  
  const selectedTheme = ref(localStorage.getItem('verilog-theme') || 'default')

  const toggleTerminal = () => {
    isTerminalVisible.value = !isTerminalVisible.value
  }

  const showTerminal = () => {
    isTerminalVisible.value = true
  }

  const hideTerminal = () => {
    isTerminalVisible.value = false
  }

  const setTheme = (theme: string) => {
    selectedTheme.value = theme
    localStorage.setItem('verilog-theme', theme)
  }

  return {
    isTerminalVisible,
    toggleTerminal,
    showTerminal,
    hideTerminal,
    
    selectedTheme,
    setTheme,
  }
})
