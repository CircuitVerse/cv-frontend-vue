<template>
    <div
        id="moduleProperty"
        class="moduleProperty noSelect effect1 properties-panel draggable-panel draggable-panel-css guide_2"
    >
        <PanelHeader :header-title="$t('simulator.panel_header.properties')" />
        <div class="panel-body">
            <div id="moduleProperty-inner">
                <div id="moduleProperty-header">{{ panelBodyHeader }}</div>
                <ProjectProperty
                    v-if="panelType == 1"
                    :key="circuitId"
                    :circuit-name="circuitName"
                />
                <ElementProperty
                    v-else-if="panelType == 2"
                    :key="panleBodyData"
                    :obj="panleBodyData"
                />
                <SubcircuitProperty
                    v-else-if="panelType == 3"
                    :key="panleBodyData"
                    :obj="panleBodyData"
                />
                <HelpButton :key="panleBodyData" :obj="panleBodyData" />
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import PanelHeader from '#/components/Panels/Shared/PanelHeader.vue'
import HelpButton from '#/components/Panels/Shared/HelpButton.vue'
import ElementProperty from '#/components/Panels/PropertiesPanel/ModuleProperty/ElementProperty/ElementProperty.vue'
import ProjectProperty from '#/components/Panels/PropertiesPanel/ModuleProperty/ProjectProperty/ProjectProperty.vue'
import SubcircuitPropert from '#/components/Panels/PropertiesPanel/ModuleProperty/SubcircuitProperty/SubcircuitProperty.vue'
import { ref, toRefs } from '@vue/reactivity'
import { onMounted } from '@vue/runtime-core'

const props = defineProps({
    panleBodyData: { type: Object, default: undefined },
    panelType: { type: Number, default: 1 },
    panelBodyHeader: { type: String, default: 'Properties' },
})

const { panleBodyData, panelType, panelBodyHeader } = toRefs(props)

const circuitId = ref(0)
const circuitName = ref('Untitled-Cirucit')

onMounted(() => {
    // checking if circuit or tab is switched
    setInterval(() => {
        if (circuitId.value != globalScope.id) {
            circuitName.value = globalScope.name
            circuitId.value = globalScope.id
        }
    }, 100)
})
</script>
