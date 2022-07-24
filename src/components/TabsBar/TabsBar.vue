<template>
    <div id="tabsBar" class="noSelect pointerCursor">
        <div
            v-for="item in tabList"
            :id="item.id"
            :key="item.id"
            style=""
            class="circuits toolbarButton current"
            :class="embed ? 'embed-tabs' : ''"
            draggable="true"
            @click="switchCircuit(item.id)"
        >
            <span class="circuitName noSelect">
                {{ truncateString(item.name, 18) }}
            </span>
            <span
                id="scope.id"
                class="tabsCloseButton"
                @click="closeCircuit($event, item)"
            >
                x
            </span>
        </div>
        <button id="createNewCircuitScope" class="logixButton" onclick="">
            &#43;
        </button>
    </div>
</template>

<script lang="ts" setup>
import { truncateString } from '#/simulator/src/utils'
import { ref } from '@vue/reactivity'
import { onMounted } from '@vue/runtime-core'
import { deleteCurrentCircuit, switchCircuit } from '#/simulator/src/circuit'
import { SimulatorStore } from '#/store/SimulatorStore/SimulatorStore'
const tabList = ref([])
onMounted(() => {
    tabList.value = SimulatorStore().circuit_list
})

function closeCircuit(e, circuitItem) {
    e.stopPropagation()
    console.log(circuitItem)
    var index = tabList.value.indexOf(circuitItem)
    if (index !== -1) {
        tabList.value.splice(index, 1)
    }
    deleteCurrentCircuit(circuitItem.id)
}
</script>
