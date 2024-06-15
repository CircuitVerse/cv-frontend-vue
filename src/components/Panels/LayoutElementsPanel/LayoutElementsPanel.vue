<template>
  <div class="noSelect defaultCursor layoutElementPanel draggable-panel draggable-panel-css">
    <div class="panel-header">
      Layout Elements
      <span class="fas fa-minus-square minimize"></span>
      <span class="fas fa-external-link-square-alt maximize"></span>
    </div>
    <div class="panel-body">
      <div class="search-results"></div>
      <div id="subcircuitMenu" class="accordion">
        <div v-for="(group, i) in SimulatorState.subCircuitElementList" :key="i">
          <div class="panelHeader">{{ group.type }}s</div>
          <div class="panel">
            <div
              v-for="(element, j) in group.elements"
              class="icon subcircuitModule"
              :key="`${i}-${j}`"
              :id="`${group.type}-${j}`" :data-element-id="j" :data-element-name="group.type"
              @mousedown="dragElement(group.type, element, j)"
            >
              <div class="icon-image">
                <img :src="`/img/${group.type}.svg`" />
                <p class="img__description">
                  {{ element.description !== '' ? element.description : 'unlabeled' }}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div v-if="SimulatorState.subCircuitElementList.length === 0">
          <p>No layout elements available</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useState } from '#/store/SimulatorStore/state'
import simulationArea from '#/simulator/src/simulationArea'

const SimulatorState = useState();

const dragElement = (groupType: string, element: any, index: number) => {
  element.subcircuitMetadata.showInSubcircuit = true
  element.newElement = true
  simulationArea.lastSelected = element

  // Remove the element from subCircuitElementList
  SimulatorState.subCircuitElementList.forEach((typeGroup) => {
    typeGroup.elements = typeGroup.elements.filter(
      (_, i) => {
        if(typeGroup.type === groupType && index === i) return false
        return true;
      }
    )
  })

  // Remove the type group if its elements array is empty
  SimulatorState.subCircuitElementList =
    SimulatorState.subCircuitElementList.filter(
      (typeGroup) => typeGroup.elements.length > 0
    )
}
</script>

<style scoped>

.layoutElementPanel {
  width: 220px;
  font: inherit;
  display: none;
  top: 90px;
  left: 10px;
}
</style>
