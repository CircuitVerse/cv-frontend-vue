<template>
    <div
        id="moduleProperty"
        class="moduleProperty noSelect effect1 properties-panel draggable-panel draggable-panel-css guide_2"
    >
        <PanelHeader :header-title="$t('simulator.panel_header.properties')" />
        <div class="panel-body">
            <div id="moduleProperty-inner">
                <div id="moduleProperty-header">{{ panelBodyHeader }}</div>
                <ProjectProperty v-if="panelType == 1" />
                <ElementProperty
                    v-else-if="panelType == 2"
                    :key="panelBodyData"
                    :obj="panelBodyData"
                />
                <SubcircuitProperty
                    v-else-if="panelType == 3"
                    :key="panelBodyData"
                    :obj="panelBodyData"
                />
                <HelpButton :key="panelBodyData" :obj="panelBodyData" />
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import PanelHeader from '#/components/Panels/Shared/PanelHeader.vue'
import HelpButton from '#/components/Panels/Shared/HelpButton.vue'
import ElementProperty from '#/components/Panels/PropertiesPanel/ModuleProperty/ElementProperty/ElementProperty.vue'
import ProjectProperty from '#/components/Panels/PropertiesPanel/ModuleProperty/ProjectProperty/ProjectProperty.vue'
import SubcircuitProperty from '#/components/Panels/PropertiesPanel/ModuleProperty/SubcircuitProperty/SubcircuitProperty.vue'
import { ref, toRefs } from 'vue'
import { onMounted } from 'vue'

const props = defineProps({
    panelBodyData: { type: Object, default: undefined },
    panelType: { type: Number, default: 1 },
    panelBodyHeader: { type: String, default: 'Properties' },
})

const { panelBodyData, panelType, panelBodyHeader } = toRefs(props)
</script>
