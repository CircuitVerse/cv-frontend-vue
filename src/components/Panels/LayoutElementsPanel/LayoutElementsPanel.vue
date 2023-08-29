<template>
    <div
        class="noSelect defaultCursor layoutElementPanel draggable-panel draggable-panel-css"
    >
        <PanelHeader
            :header-title="$t('simulator.panel_header.layout_elements')"
        />
        <div class="panel-body">
            <!-- <div
                v-if="!SimulatorState.isEmptySubCircuitElementList"
                class="search-results"
            ></div> -->
            <!-- <div id="subcircuitMenu" class="accordion"></div> -->
            <div
                v-if="SimulatorState.isEmptySubCircuitElementList"
                id="subcircuitMenu"
                class="accordion"
            >
                <p>No layout elements available</p>
            </div>
            <div v-else id="subcircuitMenu" class="accordion">
                <v-expansion-panels
                    id="menu"
                    class="accordion"
                    variant="accordion"
                >
                    <v-expansion-panel
                        v-for="elems in SimulatorState.subCircuitElementList"
                        :key="elems.type"
                    >
                        <v-expansion-panel-title>
                            {{ elems.type }}
                        </v-expansion-panel-title>
                        <v-expansion-panel-text eager>
                            <div class="panel-content">
                                <div
                                    v-for="element in elems.elements"
                                    :id="element.id"
                                    :key="element.id"
                                    :title="element.description"
                                    class="icon logixModules"
                                    @click="placeElementOnCanvas(element)"
                                >
                                    <!-- @mousedown="onDragStart($event, element)"
                                    @mouseup="onDragEnd($event, element)" -->
                                    <div class="icon-wrapper">
                                        <img
                                            :src="element.src"
                                            :alt="element.elementName"
                                        />
                                        <p class="description">
                                            {{ element.description }}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                </v-expansion-panels>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
// import { ref } from 'vue'
import PanelHeader from '../Shared/PanelHeader.vue'
import { useState } from '#/store/SimulatorStore/state'
import { tempBuffer } from '#/simulator/src/layoutMode'

const SimulatorState = useState()

function placeElementOnCanvas(element) {
    // const sideBarWidth = document.getElementById('guide_1').clientWidth
    // const tempElement = globalScope[element.elementName][element.elementId]

    // const sideBarWidth = 200
    // tempElement.x = sideBarWidth + 100 // You can adjust this value based on your requirements
    // tempElement.y = 50 // You can adjust this value based on where you want to place the element

    // for (let node of tempElement.nodeList) {
    //     node.x = sideBarWidth + 100
    //     node.y = 50
    // }

    tempBuffer.subElements.push(tempElement)

    // Remove the element from subCircuitElementList
    SimulatorState.subCircuitElementList.forEach((typeGroup) => {
        typeGroup.elements = typeGroup.elements.filter(
            (el) => el.id !== element.id
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
#menu {
    margin-bottom: 0;
}

.icon-wrapper {
    display: inline-block;
    text-align: center;
}

.description {
    margin: 0;
}

.draggableSubcircuitElement {
    cursor: grab;
}
.draggableSubcircuitElement:active {
    cursor: grabbing;
}
</style>
