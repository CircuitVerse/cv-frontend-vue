<template>
    <ModuleProperty
        v-if="!propertiesPanelStore.inLayoutMode"
        :panle-body-data="toRaw(propertiesPanelStore.propertiesPanelObj)"
        :panel-type="propertiesPanelStore.panelType"
        :panel-body-header="propertiesPanelStore.panelBodyHeader"
    />
    <LayoutProperty v-else />
</template>

<script lang="ts" setup>
import ModuleProperty from '#/components/Panels/PropertiesPanel/ModuleProperty/ModuleProperty.vue'
import LayoutProperty from '#/components/Panels/PropertiesPanel/LayoutProperty/LayoutProperty.vue'
import { toRaw, onMounted, watch } from 'vue'
import { showPropertiesPanel } from './PropertiesPanel'
import { usePropertiesPanelStore } from '#/store/propertiesPanelStore'

const propertiesPanelStore = usePropertiesPanelStore()

// Run showPropertiesPanel initially when component mounts
onMounted(() => {
    showPropertiesPanel()
})

// Watch for relevant state changes that would require updating the properties panel
watch(
    () => [
        propertiesPanelStore.panelType,
        propertiesPanelStore.inLayoutMode,
        propertiesPanelStore.propertiesPanelObj
    ],
    () => {
        showPropertiesPanel()
    },
    { deep: true }
)
</script>
