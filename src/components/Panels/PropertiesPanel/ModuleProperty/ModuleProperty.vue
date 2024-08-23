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
import SubcircuitProperty from '#/components/Panels/PropertiesPanel/ModuleProperty/SubcircuitProperty/SubcircuitProperty.vue'
import { ref, toRefs } from 'vue'
import { onMounted } from 'vue'

const props = defineProps({
    panleBodyData: { type: Object, default: undefined },
    panelType: { type: Number, default: 1 },
    panelBodyHeader: { type: String, default: 'Properties' },
})

const { panleBodyData, panelType, panelBodyHeader } = toRefs(props)
</script>

<style>
.moduleProperty {
    font: inherit;
    width: 250px;
    top: 90px;
    right: 10px;
}

#moduleProperty-toolTip {
    padding: 10px;
}

#moduleProperty-inner {
    width: 85%;
    margin: auto;
}

#moduleProperty-header {
    font-size: 1.1em;
    text-transform: uppercase;
    margin-bottom: 20px;
    text-align: left;
}

#moduleProperty-inner > p span {
    display: inline-block;
    font-weight: bold;
}

#moduleProperty-inner > div span {
    display: inline-block;
    font-weight: bold;
}

#moduleProperty-inner > p button {
    border-radius: 2px;
    margin: 3px;
}

#moduleProperty-inner > div button {
    border-radius: 2px;
    margin: 3px;
}

#moduleProperty-inner:last-child {
    margin-bottom: 15px;
}

.moduleProperty select {
    background-color: transparent;
    border: none;
    margin-left: 2px;
    outline: none;
}

.moduleProperty input,
.moduleProperty textarea {
    background-color: transparent;
    margin-top: 7px;
    outline: none;
    padding: 5px 5px;
    width: 100%;
}

.moduleProperty textarea {
    text-align: left;
}

.moduleProperty select,
.moduleProperty input,
.moduleProperty textarea {
    border-radius: 7px !important;
}

.moduleProperty input:focus,
.moduleProperty select:focus,
.moduleProperty textarea {
    outline-width: 0;
    outline: none;
    box-shadow: none;
}
</style>
