<template>
    <div id="tabsBar" class="noSelect pointerCursor">
        <draggable
            :key="updateCount"
            v-model="SimulatorStore().circuit_list"
            class="list-group"
            tag="transition-group"
            :component-data="{
                tag: 'div',
                type: 'transition-group',
                name: !drag ? 'flip-list' : null,
            }"
            v-bind="dragOptions"
            @start="drag = true"
            @end="drag = false"
        >
            <template #item="{ element }">
                <div
                    :id="element.id"
                    :key="element.id"
                    style=""
                    class="circuits toolbarButton current"
                    :class="embed ? 'embed-tabs' : ''"
                    draggable="true"
                    @click="switchCircuit(element.id)"
                >
                    <span class="circuitName noSelect">
                        {{ truncateString(element.name, 18) }}
                    </span>
                    <span
                        id="scope.id"
                        class="tabsCloseButton"
                        @click="closeCircuit($event, element)"
                    >
                        x
                    </span>
                </div>
            </template>
        </draggable>
        <button id="createNewCircuitScope" class="logixButton" onclick="">
            &#43;
        </button>
    </div>
</template>

<script lang="ts" setup>
import draggable from 'vuedraggable'
import { truncateString } from '#/simulator/src/utils'
import { ref } from '@vue/reactivity'
import { computed, onMounted } from '@vue/runtime-core'
import { deleteCurrentCircuit, switchCircuit } from '#/simulator/src/circuit'
import { SimulatorStore } from '#/store/SimulatorStore/SimulatorStore'

const drag = ref(false)
const updateCount = ref(0)

function closeCircuit(e, circuitItem) {
    e.stopPropagation()
    console.log(circuitItem)
    var index = SimulatorStore().circuit_list.indexOf(circuitItem)
    if (index !== -1) {
        SimulatorStore().circuit_list.splice(index, 1)
    }
    deleteCurrentCircuit(circuitItem.id)
    updateCount.value++
}

function dragOptions() {
    return {
        animation: 200,
        group: 'description',
        disabled: false,
        ghostClass: 'ghost',
    }
}
</script>

<style scoped>
.list-group {
    display: inline;
}
</style>
