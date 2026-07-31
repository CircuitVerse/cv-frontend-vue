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
import { toRaw, onMounted, onUnmounted, watch } from 'vue'
import { showPropertiesPanel } from './PropertiesPanel';
import { usePropertiesPanelStore } from '#/store/propertiesPanelStore';
import { setupPanelListeners } from '#/simulator/src/ux'
import { simulationArea } from '#/simulator/src/simulationArea'

const propertiesPanelStore = usePropertiesPanelStore();

// The simulator mutates simulationArea.lastSelected imperatively (non-reactive),
// so we still need periodic sync. We use a minimal requestAnimationFrame loop
// instead of setInterval so it runs at display rate and stops when unmounted.
let rafId: number | null = null

function rafLoop() {
    showPropertiesPanel()
    rafId = requestAnimationFrame(rafLoop)
}

onMounted(() => {
    setupPanelListeners('#moduleProperty')
    rafId = requestAnimationFrame(rafLoop)
})

onUnmounted(() => {
    if (rafId !== null) cancelAnimationFrame(rafId)
})
</script>
