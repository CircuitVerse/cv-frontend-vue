<template>
  <div v-if="!embed" class="debug-controls">
    <div class="debug-toolbar">
      <button @click="toggleDebugMode" :class="{ active: isDebugMode }" class="debug-btn">
        <span v-if="!isDebugMode">🐛 Enable Debug Mode</span>
        <span v-else>❌ Exit Debug</span>
      </button>
      
      <div v-if="isDebugMode" class="debug-buttons">
        <button @click="handleStepBack" :disabled="!canStepBack" class="step-btn">
          ⬅️ Step Back
        </button>
        
        <button @click="handleStepForward" class="step-btn">
          Step Forward ➡️
        </button>
        
        <div class="state-counter">
          Step {{ currentStep }} / {{ totalSteps }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Import debug functions from engine
let debugModeSet: (param: boolean) => void
let debugModeGet: () => boolean
let stepBack: () => void
let stepForward: () => void
let getStateHistory: () => any

// Dynamically import to avoid errors if functions don't exist yet
const loadEngineFunctions = async () => {
  try {
    const engine = await import('../simulator/src/engine')
    debugModeSet = engine.debugModeSet
    debugModeGet = engine.debugModeGet
    stepBack = engine.stepBack
    stepForward = engine.stepForward
    getStateHistory = engine.getStateHistory
  } catch (error) {
    console.error('Failed to load engine functions:', error)
  }
}

const isDebugMode = ref(false)
const stateInfo = ref({
  states: [],
  currentIndex: -1,
  canStepBack: false,
  canStepForward: false,
})

// @ts-ignore - embed is a global variable
const embed = typeof window !== 'undefined' ? window.embed || false : false

const canStepBack = computed(() => stateInfo.value.canStepBack)
const canStepForward = computed(() => stateInfo.value.canStepForward)
const currentStep = computed(() => stateInfo.value.currentIndex + 1)
const totalSteps = computed(() => stateInfo.value.states.length)

let updateInterval: NodeJS.Timeout | null = null

function toggleDebugMode() {
  if (!debugModeSet) return
  
  isDebugMode.value = !isDebugMode.value
  debugModeSet(isDebugMode.value)
  
  if (isDebugMode.value) {
    // Start polling for state updates
    updateInterval = setInterval(refreshStateInfo, 100)
  } else {
    // Stop polling
    if (updateInterval) {
      clearInterval(updateInterval)
      updateInterval = null
    }
  }
  
  refreshStateInfo()
}

function handleStepBack() {
  if (stepBack) {
    stepBack()
    refreshStateInfo()
  }
}

function handleStepForward() {
  if (stepForward) {
    stepForward()
    refreshStateInfo()
  }
}

function refreshStateInfo() {
  if (isDebugMode.value && getStateHistory) {
    stateInfo.value = getStateHistory()
  }
}

onMounted(async () => {
  await loadEngineFunctions()
  
  // Check if debug mode was already enabled
  if (debugModeGet) {
    isDebugMode.value = debugModeGet()
    if (isDebugMode.value) {
      updateInterval = setInterval(refreshStateInfo, 100)
    }
  }
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})
</script>

<style scoped>
.debug-controls {
  padding: 8px 20px;
  background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
  border-bottom: 2px solid #dee2e6;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 100;
}

.debug-toolbar {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.debug-btn {
  padding: 8px 16px;
  border: 2px solid #6c757d;
  background: white;
  cursor: pointer;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s;
}

.debug-btn:hover {
  background: #f8f9fa;
  transform: translateY(-1px);
}

.debug-btn.active {
  background: #28a745;
  color: white;
  border-color: #28a745;
}

.debug-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 5px 15px;
  background: white;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.step-btn {
  padding: 6px 12px;
  border: 1px solid #007bff;
  background: white;
  color: #007bff;
  cursor: pointer;
  border-radius: 4px;
  font-weight: 500;
  font-size: 13px;
  transition: all 0.2s;
}

.step-btn:hover:not(:disabled) {
  background: #007bff;
  color: white;
  transform: translateY(-1px);
}

.step-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  border-color: #ccc;
  color: #999;
}

.state-counter {
  padding: 4px 12px;
  background: #e9ecef;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #495057;
  margin-left: 10px;
  font-family: monospace;
}
</style>