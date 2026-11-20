<template>
  <div class="noSelect defaultCursor layoutElementPanel draggable-panel draggable-panel-css"
    ref="layoutElementPanelRef">
    <div class="panel-header">
      {{ $t('simulator.layout.layout_elements') }}
      <span class="fas fa-minus-square minimize"></span>
      <span class="fas fa-external-link-square-alt maximize"></span>
    </div>
    <div class="panel-body">
      <v-expansion-panels id="menu" class="accordion" variant="accordion">
        <v-expansion-panel v-for="(group, groupIndex) in SimulatorState.subCircuitElementList" :key="groupIndex">
          <v-expansion-panel-title>
            {{ group.type }}s
          </v-expansion-panel-title>
          <v-expansion-panel-text eager>
            <div class="panel customScroll">
              <div v-for="(element, elementIndex) in group.elements" class="icon subcircuitModule"
              :key="`${groupIndex}-${elementIndex}`" :id="`${group.type}-${elementIndex}`"
              :data-element-id="elementIndex" :data-element-name="group.type"
              draggable="true"
              @mousedown="dragElement(element)"
              @dragend="onSubcircuitDragEnd($event)">
              <div class="icon-image">
                <img :src="getImgUrl(group.type)" />
                <p class="img__description">
                  {{ element.label !== '' ? element.label : $t('simulator.unlabeled') }}
                </p>
              </div>
              </div>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useState } from '#/store/SimulatorStore/state'
import { simulationArea } from '#/simulator/src/simulationArea'
import { useLayoutStore } from '#/store/layoutStore';
import { tempBuffer } from '#/simulator/src/layoutMode';
import { ref, onMounted } from 'vue';

const layoutStore = useLayoutStore()

const layoutElementPanelRef = ref<HTMLElement | null>(null);
const draggingElement = ref<any>(null);

onMounted(() => {
    layoutStore.layoutElementPanelRef = layoutElementPanelRef.value
})

const SimulatorState = useState();

const dragElement = (element: any) => {
  // Store reference; list removal deferred to @dragend (valid drop only)
  element.newElement = true
  simulationArea.lastSelected = element
  draggingElement.value = element
}

function getImgUrl(elementName: string) {
  const elementImg = new URL(
    `../../../simulator/src/img/${elementName}.svg`,
    import.meta.url
  ).href;
  return elementImg;
}

function onSubcircuitDragEnd(event: DragEvent) {
  const panelEl = layoutElementPanelRef.value
  const rect = panelEl?.getBoundingClientRect()
  const top = event.clientY - (rect?.top ?? 0)
  const left = event.clientX - (rect?.left ?? 0)

  const sideBarWidth = document.getElementById('guide_1')?.clientWidth ?? 0

  if (top > 10 && left > sideBarWidth) {
    const tempElement = draggingElement.value
    if (!tempElement) return

    // Set showInSubcircuit here - deferred from mousedown, only on valid drop
    tempElement.subcircuitMetadata.showInSubcircuit = true
    tempElement.x = left - sideBarWidth
    tempElement.y = top
    for (const node of tempElement.nodeList) {
      node.x = left - sideBarWidth
      node.y = top
    }
    tempBuffer.subElements.push(tempElement)

    // Remove by object identity - safe even if indices shifted
    SimulatorState.subCircuitElementList.forEach((typeGroup) => {
      typeGroup.elements = typeGroup.elements.filter((el) => el !== tempElement)
    })
    SimulatorState.subCircuitElementList =
      SimulatorState.subCircuitElementList.filter((typeGroup) => typeGroup.elements.length > 0)
  }

  // Clear newElement flag native drag suppresses mouseup on simulationArea,
  // so the canvas never resets it. Must clear for both valid and cancelled drops.
  if (draggingElement.value) draggingElement.value.newElement = false
  draggingElement.value = null
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
