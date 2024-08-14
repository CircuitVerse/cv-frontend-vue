<template>
  <v-dialog
      v-if="!inLayoutMode"
      v-model="simulatorMobileStore.showPropertiesPanel"
      :persistent="false"
  >
    <div id="moduleProperty-inner" class="messageBoxContent">
        <div id="moduleProperty-header">{{ panelBodyHeader }}</div>
        <ProjectProperty v-if="panelType == 1" />
        <ElementProperty
            v-else-if="panelType == 2"
            :key="objProperties"
            :obj="objProperties"
        />
        <SubcircuitProperty
            v-else-if="panelType == 3"
            :key="objProperties"
            :obj="objProperties"
        />
        <HelpButton :key="objProperties" :obj="objProperties" />
    </div>
  </v-dialog>
  <LayoutProperty v-else />
</template>

<script lang="ts" setup>
import LayoutProperty from '#/components/Panels/PropertiesPanel/LayoutProperty/LayoutProperty.vue'
import { ref, toRaw, onMounted, computed } from 'vue'
import { simulationArea } from '#/simulator/src/simulationArea'
import { checkPropertiesUpdate, prevPropertyObjSet } from '#/simulator/src/ux'
import { layoutModeGet } from '#/simulator/src/layoutMode'
import { useSimulatorMobileStore } from '#/store/simulatorMobileStore'
import ProjectProperty from './ModuleProperty/ProjectProperty/ProjectProperty.vue'
import ElementProperty from './ModuleProperty/ElementProperty/ElementProperty.vue'
import SubcircuitProperty from './ModuleProperty/SubcircuitProperty/SubcircuitProperty.vue'
import HelpButton from '../Shared/HelpButton.vue'

const inLayoutMode = ref(false)
const panelBodyHeader = ref('PROJECT PROPERTIES')
const propertiesPanelObj = ref(undefined)
const panelType = ref(1) // default is panel type 2 (project properties)
const simulatorMobileStore = useSimulatorMobileStore()
const objProperties = computed(() => toRaw(propertiesPanelObj.value))

onMounted(() => {
  // checks for which type of properties panel to show
  setInterval(showPropertiesPanel, 100)
})
function showPropertiesPanel() {
  if (inLayoutMode.value != layoutModeGet())
      inLayoutMode.value = layoutModeGet()
  checkPropertiesUpdate()
  if (toRaw(propertiesPanelObj.value) == simulationArea.lastSelected) return
  prevPropertyObjSet(simulationArea.lastSelected)
  propertiesPanelObj.value = simulationArea.lastSelected
  if(simulationArea.lastSelected && simulationArea.lastSelected.newElement) {
      simulationArea.lastSelected.label = ""
  }
  // there are 3 types of panel body for Properties Panel
  // depending upon which is last selected
  // 1. Properties Panel in Layout mode
  // 2. Properties Panel showing Project Properties
  // 3. Properties Panel showing Circiut Element Properties
  if (inLayoutMode.value) {
      // will look into it later !!!
      if (
          simulationArea.lastSelected === undefined ||
          ['Wire', 'CircuitElement', 'Node'].indexOf(
              simulationArea.lastSelected.objectType
          ) !== -1
      ) {
          panelType.value = 1
          // when we cancel layout mode -> show project properties
      } else {
          panelType.value = 3
          panelBodyHeader.value = propertiesPanelObj.value.objectType
      }
  } else {
      if (
          simulationArea.lastSelected === undefined ||
          ['Wire', 'CircuitElement', 'Node'].indexOf(
              simulationArea.lastSelected.objectType
          ) !== -1
      ) {
          panelType.value = 1
          panelBodyHeader.value = 'PROJECT PROPERTIES'
          if (simulationArea.lastSelected === undefined)
              propertiesPanelObj.value = undefined
      } else {
          panelType.value = 2
          panelBodyHeader.value = propertiesPanelObj.value.objectType
      }
  }
}
</script>
