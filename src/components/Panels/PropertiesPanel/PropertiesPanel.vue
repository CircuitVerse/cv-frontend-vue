<template>
    <ModuleProperty
        v-if="!inLayoutMode"
        :panle-body-data="toRaw(propertiesPanelObj)"
        :panel-type="panelType"
        :panel-body-header="panelBodyHeader"
    />
    <LayoutProperty v-else />
</template>

<script lang="ts" setup>
import ModuleProperty from '#/components/Panels/PropertiesPanel/ModuleProperty/ModuleProperty.vue'
import LayoutProperty from '#/components/Panels/PropertiesPanel/LayoutProperty/LayoutProperty.vue'
import { ref, toRaw } from '@vue/reactivity'
import { onMounted } from 'vue'
import { checkPropertiesUpdate, prevPropertyObjSet } from '#/simulator/src/ux'
import { layoutModeGet } from '#/simulator/src/layoutMode'
import { SimulationareaStore } from '#/store/SimulationareaCanvas/SimulationareaStore'

const inLayoutMode = ref(false)
const panelBodyHeader = ref('PROJECT PROPERTIES')
const propertiesPanelObj = ref(undefined)
const panelType = ref(1) // default is panel type 2 (project properties)

onMounted(() => {
    // checks for which type of properties panel to show
    setInterval(showPropertiesPanel, 100)
})
function showPropertiesPanel() {
    const simulationAreaStore = SimulationareaStore()
    if (inLayoutMode.value != layoutModeGet())
        inLayoutMode.value = layoutModeGet()
    checkPropertiesUpdate()
    if (toRaw(propertiesPanelObj.value) == simulationAreaStore.lastSelected)
        return
    prevPropertyObjSet(simulationAreaStore.lastSelected)
    propertiesPanelObj.value = simulationAreaStore.lastSelected
    // there are 3 types of panel body for Properties Panel
    // depending upon which is last selected
    // 1. Properties Panel in Layout mode
    // 2. Properties Panel showing Project Properties
    // 3. Properties Panel showing Circiut Element Properties
    if (inLayoutMode.value) {
        // will look into it later !!!
        if (
            simulationAreaStore.lastSelected === undefined ||
            ['Wire', 'CircuitElement', 'Node'].indexOf(
                simulationAreaStore.lastSelected.objectType
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
            simulationAreaStore.lastSelected === undefined ||
            ['Wire', 'CircuitElement', 'Node'].indexOf(
                simulationAreaStore.lastSelected.objectType
            ) !== -1
        ) {
            panelType.value = 1
            panelBodyHeader.value = 'PROJECT PROPERTIES'
            if (simulationAreaStore.lastSelected === undefined)
                propertiesPanelObj.value = undefined
        } else {
            panelType.value = 2
            panelBodyHeader.value = propertiesPanelObj.value.objectType
        }
    }
}
</script>
