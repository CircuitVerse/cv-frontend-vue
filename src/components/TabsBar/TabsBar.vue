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
                @click="closeCircuit($event, item.id)"
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
import circuitList from '#/main'
import { deleteCurrentCircuit, switchCircuit } from '#/simulator/src/circuit'
import { truncateString } from '#/simulator/src/utils'
import { ref } from '@vue/reactivity'
import { onMounted } from '@vue/runtime-core'

const tabList = ref([])
onMounted(() => {
    tabList.value = circuitList().circuit_list
})

function closeCircuit(e, circuitId) {
    e.stopPropagation()
    deleteCurrentCircuit(circuitId)
}
</script>
