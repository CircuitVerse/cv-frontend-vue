<template>
  <div class="noSelect defaultCursor layoutElementPanel draggable-panel draggable-panel-css">
    <div class="panel-header">
      {{ $t('simulator.layout.layout_elements') }}
      <span class="fas fa-minus-square minimize"></span>
      <span class="fas fa-external-link-square-alt maximize"></span>
    </div>
    <div class="panel-body">
      <div class="search-results"></div>
      <div id="subcircuitMenu" class="accordion">
        <div v-for="(group, groupIndex) in SimulatorState.subCircuitElementList" :key="groupIndex">
          <div class="panelHeader">{{ group.type }}s</div>
          <div class="panel">
            <div
              v-for="(element, elementIndex) in group.elements"
              class="icon subcircuitModule"
              :key="`${groupIndex}-${elementIndex}`"
              :id="`${group.type}-${elementIndex}`" :data-element-id="elementIndex" :data-element-name="group.type"
              @mousedown="dragElement(group.type, element, elementIndex)"
            >
              <div class="icon-image">
                <img :src="`#/simulator/src/img/${group.type}.svg`" />
                <p class="img__description">
                  {{ element.label !== '' ? element.label : $t('simulator.unlabeled') }}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div v-if="SimulatorState.subCircuitElementList.length === 0">
          <p>{{ $t('simulator.layout.no_elements_available') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useState } from '#/store/SimulatorStore/state'
import { simulationArea } from '#/simulator/src/simulationArea'

const SimulatorState = useState();

const dragElement = (groupType: string, element: any, index: number) => {
  element.subcircuitMetadata.showInSubcircuit = true
  element.newElement = true
  simulationArea.lastSelected = element

  // Remove the element from subCircuitElementList
  SimulatorState.subCircuitElementList.forEach((typeGroup) => {
    typeGroup.elements = typeGroup.elements.filter(
      (_, elementIndex) => {
        if(typeGroup.type === groupType && index === elementIndex)
        return false

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
