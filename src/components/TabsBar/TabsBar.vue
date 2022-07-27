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
    <MessageBox
        v-model="showMessage"
        :button-list="buttonArr"
        :is-persistent="persistentShow"
        :message-text="messageVal"
        @hide-message="showMessage = false"
    />
</template>

<script lang="ts" setup>
import draggable from 'vuedraggable'
import { truncateString } from '#/simulator/src/utils'
import { ref } from '@vue/reactivity'
import { computed, onMounted } from '@vue/runtime-core'
import {
    deleteCurrentCircuit,
    getDependenciesList,
    switchCircuit,
} from '#/simulator/src/circuit'
import { SimulatorStore } from '#/store/SimulatorStore/SimulatorStore'
import MessageBox from '#/components/MessageBox/messageBox.vue'

const drag = ref(false)
const updateCount = ref(0)
const showMessage = ref(false)
const persistentShow = ref(false)
const messageVal = ref('')
const buttonArr = ref([''])

function closeCircuit(e, circuitItem) {
    e.stopPropagation()

    // check circuit count
    if (SimulatorStore().circuit_list.length <= 1) {
        showMessage.value = true
        persistentShow.value = false
        messageVal.value =
            'At least 2 circuits need to be there in order to delete a circuit.'
        buttonArr.value = ['close']
        return
    }
    showMessage.value = false
    persistentShow.value = false
    buttonArr.value = []

    let dependencies = getDependenciesList(circuitItem.id)
    if (dependencies) {
        dependencies = `\nThe following circuits are depending on '${circuitItem.name}': ${dependencies}\nDelete subcircuits of ${circuitItem.name} before trying to delete ${circuitItem.name}`
        showMessage.value = true
        persistentShow.value = true
        messageVal.value = dependencies
        buttonArr.value = ['OK']
        return
    }

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
