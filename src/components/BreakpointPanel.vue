<template>
  <div v-if="isDebugMode && !embed" class="breakpoint-panel">
    <div class="panel-header">
      <h3>⚡ Breakpoints</h3>
      <button @click="showAddModal = true" class="btn-add">+ Add</button>
    </div>

    <div v-if="breakpoints.length === 0" class="empty-state">
      No breakpoints set. Click "+ Add" to create one.
    </div>

    <div v-else class="breakpoint-list">
      <div 
        v-for="bp in breakpoints" 
        :key="bp.id"
        class="breakpoint-item"
        :class="{ 
          disabled: !bp.enabled,
          triggered: isTriggered(bp.id)
        }"
      >
        <input 
          type="checkbox" 
          :checked="bp.enabled"
          @change="handleToggle(bp.id)"
          class="bp-checkbox"
        />
        
        <div class="breakpoint-info">
          <div class="bp-description">{{ bp.description }}</div>
          <div class="bp-stats">
            <span class="bp-hits">Hits: {{ bp.hitCount }}</span>
          </div>
        </div>
        
        <button @click="handleRemove(bp.id)" class="btn-remove">×</button>
      </div>
    </div>

    <!-- Breakpoint Hit Notification -->
    <div v-if="triggeredBp" class="breakpoint-notification">
      <div class="notification-content">
        <span class="notification-icon">⚠️</span>
        <div class="notification-text">
          <strong>Breakpoint Hit!</strong>
          <p>{{ triggeredBp.description }}</p>
        </div>
        <button @click="handleResume" class="btn-resume">Resume ▶</button>
      </div>
    </div>

    <!-- Add Breakpoint Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal-content">
        <h3>Add Breakpoint</h3>
        
        <div class="form-group">
          <label>Wire/Node ID:</label>
          <input 
            v-model.number="newBp.wireId" 
            type="number" 
            placeholder="e.g., 5"
            min="0"
          />
          <small>Hover over wires to see their ID (or use watch panel)</small>
        </div>

        <div class="form-group">
          <label>Condition:</label>
          <select v-model="newBp.condition">
            <option value="equals">Equals value</option>
            <option value="changes">Value changes</option>
            <option value="risingEdge">Rising edge (0→1)</option>
            <option value="fallingEdge">Falling edge (1→0)</option>
            <option value="greaterThan">Greater than</option>
            <option value="lessThan">Less than</option>
          </select>
        </div>

        <div 
          v-if="['equals', 'greaterThan', 'lessThan'].includes(newBp.condition)" 
          class="form-group"
        >
          <label>Value:</label>
          <input v-model.number="newBp.value" type="number" />
        </div>

        <div class="modal-actions">
          <button @click="handleAdd" class="btn-primary">Add Breakpoint</button>
          <button @click="showAddModal = false" class="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Engine functions
let debugModeGet: () => boolean
let getAllBreakpoints: () => any[]
let addBreakpoint: (config: any) => any
let removeBreakpoint: (id: number) => void
let toggleBreakpoint: (id: number) => void
let getTriggeredBreakpoint: () => any
let resumeSimulation: () => void
let pausedByBreakpointGet: () => boolean

const loadEngineFunctions = async () => {
  try {
    const engine = await import('../simulator/src/engine')
    debugModeGet = engine.debugModeGet
    getAllBreakpoints = engine.getAllBreakpoints
    addBreakpoint = engine.addBreakpoint
    removeBreakpoint = engine.removeBreakpoint
    toggleBreakpoint = engine.toggleBreakpoint
    getTriggeredBreakpoint = engine.getTriggeredBreakpoint
    resumeSimulation = engine.resumeSimulation
    pausedByBreakpointGet = engine.pausedByBreakpointGet
  } catch (error) {
    console.error('Failed to load engine functions:', error)
  }
}

const isDebugMode = ref(false)
const breakpoints = ref<any[]>([])
const triggeredBp = ref<any>(null)
const showAddModal = ref(false)
const newBp = ref({
  wireId: 0,
  condition: 'equals',
  value: 1
})

// @ts-ignore
const embed = typeof window !== 'undefined' ? window.embed || false : false

const isTriggered = (id: number) => {
  return triggeredBp.value && triggeredBp.value.id === id
}

function handleAdd() {
  if (addBreakpoint) {
    addBreakpoint({
      wireId: newBp.value.wireId,
      condition: newBp.value.condition,
      value: newBp.value.value
    })
    showAddModal.value = false
    refreshBreakpoints()
    
    // Reset form
    newBp.value = {
      wireId: 0,
      condition: 'equals',
      value: 1
    }
  }
}

function handleRemove(id: number) {
  if (removeBreakpoint) {
    removeBreakpoint(id)
    refreshBreakpoints()
  }
}

function handleToggle(id: number) {
  if (toggleBreakpoint) {
    toggleBreakpoint(id)
    refreshBreakpoints()
  }
}

function handleResume() {
  if (resumeSimulation) {
    resumeSimulation()
    triggeredBp.value = null
  }
}

function refreshBreakpoints() {
  if (debugModeGet) {
    isDebugMode.value = debugModeGet()
  }
  if (isDebugMode.value && getAllBreakpoints) {
    breakpoints.value = getAllBreakpoints()
  }
  if (getTriggeredBreakpoint) {
    triggeredBp.value = getTriggeredBreakpoint()
  }
}

let updateInterval: NodeJS.Timeout | null = null

onMounted(async () => {
  await loadEngineFunctions()
  updateInterval = setInterval(refreshBreakpoints, 100)
  refreshBreakpoints()
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})
</script>

<style scoped>
.breakpoint-panel {
  position: fixed;
  right: 20px;
  top: 100px;
  width: 350px;
  background: white;
  border: 2px solid #007bff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 1000;
  max-height: 500px;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 2px solid #e9ecef;
  background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  color: #007bff;
}

.btn-add {
  padding: 6px 12px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
}

.btn-add:hover {
  background: #218838;
}

.empty-state {
  padding: 30px 20px;
  text-align: center;
  color: #6c757d;
  font-size: 13px;
}

.breakpoint-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.breakpoint-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  margin-bottom: 8px;
  background: white;
  transition: all 0.2s;
}

.breakpoint-item:hover {
  border-color: #007bff;
  box-shadow: 0 2px 4px rgba(0,123,255,0.1);
}

.breakpoint-item.disabled {
  opacity: 0.5;
  background: #f8f9fa;
}

.breakpoint-item.triggered {
  background: #fff3cd;
  border-color: #ffc107;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(255, 193, 7, 0); }
}

.bp-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.breakpoint-info {
  flex: 1;
}

.bp-description {
  font-weight: 600;
  font-size: 13px;
  color: #212529;
  font-family: monospace;
}

.bp-stats {
  font-size: 11px;
  color: #6c757d;
  margin-top: 4px;
}

.bp-hits {
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 3px;
}

.btn-remove {
  width: 24px;
  height: 24px;
  border: none;
  background: #dc3545;
  color: white;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  font-weight: bold;
}

.btn-remove:hover {
  background: #c82333;
}

.breakpoint-notification {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border: 3px solid #ffc107;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  z-index: 10000;
  animation: slideIn 0.3s;
}

@keyframes slideIn {
  from {
    transform: translate(-50%, -60%);
    opacity: 0;
  }
  to {
    transform: translate(-50%, -50%);
    opacity: 1;
  }
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.notification-icon {
  font-size: 32px;
}

.notification-text strong {
  display: block;
  color: #856404;
  font-size: 16px;
  margin-bottom: 4px;
}

.notification-text p {
  margin: 0;
  color: #212529;
  font-family: monospace;
  font-size: 14px;
}

.btn-resume {
  padding: 8px 16px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  white-space: nowrap;
}

.btn-resume:hover {
  background: #218838;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 8px;
  min-width: 400px;
  max-width: 500px;
}

.modal-content h3 {
  margin: 0 0 20px 0;
  color: #212529;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  font-size: 13px;
  color: #495057;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
}

.form-group small {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  color: #6c757d;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn-primary {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary {
  padding: 8px 16px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.btn-secondary:hover {
  background: #545b62;
}
</style>