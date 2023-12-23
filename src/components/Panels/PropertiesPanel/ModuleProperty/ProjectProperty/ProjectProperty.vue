<template>
  <p>
    <span>Project:</span>
    <input id="projname" type="text" autocomplete="off" name="setProjectName" v-model="projectStore.project.name"
      :oninput="projectStore.setProjectNameDefined" />
  </p>

  <p>
    <span>Circuit:</span>
    <input id="circname" :key="SimulatorState.activeCircuit.id" class="objectPropertyAttribute" type="text"
      autocomplete="off" name="changeCircuitName" :value="SimulatorState.activeCircuit.name" />
  </p>

  <InputGroups property-name="Clock Time (ms):" :property-value="SimulatorState.timePeriod" property-value-type="number"
    value-min="50" step-size="10" property-input-name="changeClockTime" property-input-id="clockTime" />

  <p>
    <span>Clock Enabled:</span>
    <label class="switch">
      <input type="checkbox" class="objectPropertyAttributeChecked" name="changeClockEnable" />
      <span class="slider"></span></label>
  </p>

  <p>
    <span>Lite Mode:</span>
    <label class="switch">
      <input type="checkbox" class="objectPropertyAttributeChecked" name="changeLightMode" />
      <span class="slider"></span>
    </label>
  </p>

  <p>
    <button type="button" class="panelButton btn btn-xs custom-btn--primary" @click="toggleLayoutMode">
      Edit Layout
    </button>
    <button type="button" class="panelButton btn btn-xs custom-btn--tertiary"
      @click.stop="closeCircuit(SimulatorState.activeCircuit)">
      Delete Circuit
    </button>
  </p>
</template>

<script lang="ts" setup>
import { toggleLayoutMode } from '#/simulator/src/layout_mode'
import { simulationArea } from '#/simulator/src/simulation_area'
import InputGroups from '#/components/Panels/Shared/InputGroups.vue'
import { useState } from '#/store/SimulatorStore/state'
import { useProjectStore } from '#/store/projectStore'
import { closeCircuit } from '#/components/helpers/deleteCircuit/DeleteCircuit.vue'

const projectStore = useProjectStore()
const SimulatorState = <SimulatorStateType>useState()

type SimulatorStateType = {
  activeCircuit: {
    id: string | number
    name: string
  }
  timePeriod: number
  circuitList: Array<Object>
  dialogBox: {
    delete_circuit: boolean
  }
}
</script>

<style scoped>
.panelButton {
  width: 100%;
  margin-bottom: 5px;
}
</style>