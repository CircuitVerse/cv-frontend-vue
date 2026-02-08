<template>
  <div v-if="isDebugMode && !embed" class="timeline-container">
    <div class="timeline-header">
      <span class="timeline-title">⏱️ Simulation Timeline</span>
      <span class="timeline-position">Step {{ currentStep }} / {{ totalSteps }}</span>
    </div>
    
    <div class="timeline-slider-container">
      <input 
        type="range" 
        class="timeline-slider"
        :min="0"
        :max="maxStep"
        :value="currentStep - 1"
        @input="onTimelineScrub"
        :disabled="totalSteps === 0"
      />
      
      <div class="timeline-track">
        <div 
          class="timeline-progress"
          :style="{ width: progressPercent + '%' }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Import debug functions from engine
let debugModeGet: () => boolean
let getStateHistory: () => any
let jumpToState: (index: number) => void

// Dynamically import to avoid errors
const loadEngineFunctions = async () => {
  try {
    const engine = await import('../simulator/src/engine')
    debugModeGet = engine.debugModeGet
    getStateHistory = engine.getStateHistory
    jumpToState = engine.jumpToState
  } catch (error) {
    console.error('Failed to load engine functions:', error)
  }
}

const isDebugMode = ref(false)
const stateInfo = ref({
  states: [],
  currentIndex: -1,
})

// @ts-ignore - embed is a global variable
const embed = typeof window !== 'undefined' ? window.embed || false : false

const currentStep = computed(() => stateInfo.value.currentIndex + 1)
const totalSteps = computed(() => stateInfo.value.states.length)
const maxStep = computed(() => Math.max(0, totalSteps.value - 1))
const progressPercent = computed(() => {
  if (totalSteps.value === 0) return 0
  return ((currentStep.value - 1) / maxStep.value) * 100
})

let updateInterval: NodeJS.Timeout | null = null

function onTimelineScrub(event: Event) {
  const target = event.target as HTMLInputElement
  const targetIndex = parseInt(target.value)
  if (jumpToState) {
    jumpToState(targetIndex)
    refreshStateInfo()
  }
}

function refreshStateInfo() {
  if (debugModeGet) {
    isDebugMode.value = debugModeGet()
  }
  if (isDebugMode.value && getStateHistory) {
    stateInfo.value = getStateHistory()
  }
}

onMounted(async () => {
  await loadEngineFunctions()
  updateInterval = setInterval(refreshStateInfo, 100)
  refreshStateInfo()
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})
</script>

<style scoped>
.timeline-container {
  padding: 12px 20px;
  background: #f8f9fa;
  border-top: 2px solid #dee2e6;
  box-shadow: 0 -2px 4px rgba(0,0,0,0.05);
  z-index: 100;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: 600;
  color: #495057;
}

.timeline-title {
  color: #007bff;
}

.timeline-position {
  font-family: monospace;
}

.timeline-slider-container {
  position: relative;
  height: 30px;
}

.timeline-track {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 6px;
  background: #dee2e6;
  border-radius: 3px;
  transform: translateY(-50%);
  pointer-events: none;
}

.timeline-progress {
  height: 100%;
  background: linear-gradient(to right, #28a745, #20c997);
  border-radius: 3px;
  transition: width 0.1s;
}

.timeline-slider {
  position: relative;
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  outline: none;
  border-radius: 3px;
  cursor: pointer;
  z-index: 10;
}

.timeline-slider:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.timeline-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: #007bff;
  cursor: pointer;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  transition: all 0.2s;
}

.timeline-slider::-webkit-slider-thumb:hover {
  background: #0056b3;
  transform: scale(1.1);
}

.timeline-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: #007bff;
  cursor: pointer;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.timeline-slider::-moz-range-thumb:hover {
  background: #0056b3;
  transform: scale(1.1);
}
</style>
