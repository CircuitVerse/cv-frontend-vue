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
        <button @click="createNewCircuit()">&#43;</button>
    </div>
    <MessageBox
        v-model="dispMessage"
        :circuit-item="circuitToBeDeleted"
        :button-list="buttonArr"
        :input-list="inputArr"
        :is-persistent="persistentShow"
        :message-text="messageVal"
        @button-click="
            (selectedOption, circuitItem, circuitNameVal) =>
                dialogBoxConformation(
                    selectedOption,
                    circuitItem,
                    circuitNameVal
                )
        "
    />
</template>

<script lang="ts" setup>
import draggable from 'vuedraggable'
import { showMessage, truncateString } from '#/simulator/src/utils'
import { ref } from '@vue/reactivity'
import { computed, onMounted } from '@vue/runtime-core'
import {
    createNewCircuitScope,
    deleteCurrentCircuit,
    getDependenciesList,
    switchCircuit,
} from '#/simulator/src/circuit'
import { SimulatorStore } from '#/store/SimulatorStore/SimulatorStore'
import MessageBox from '#/components/MessageBox/messageBox.vue'

const drag = ref(false)
const updateCount = ref(0)
const dispMessage = ref(false)
const persistentShow = ref(false)
const messageVal = ref('')
const buttonArr = ref([{}])
const inputArr = ref([''])
const circuitToBeDeleted = ref({})

function clearMessageBoxFields() {
    dispMessage.value = false
    persistentShow.value = false
    messageVal.value = ''
    buttonArr.value = []
    inputArr.value = []
}

async function closeCircuit(e, circuitItem) {
    e.stopPropagation()

    clearMessageBoxFields()
    // check circuit count
    if (SimulatorStore().circuit_list.length <= 1) {
        dispMessage.value = true
        persistentShow.value = false
        messageVal.value =
            'At least 2 circuits need to be there in order to delete a circuit.'
        buttonArr.value = [
            {
                text: 'Close',
                emitOption: 'dispMessage',
            },
        ]
        return
    }
    clearMessageBoxFields()

    let dependencies = getDependenciesList(circuitItem.id)
    if (dependencies) {
        dependencies = `\nThe following circuits are depending on '${circuitItem.name}': ${dependencies}\nDelete subcircuits of ${circuitItem.name} before trying to delete ${circuitItem.name}`
        dispMessage.value = true
        persistentShow.value = true
        messageVal.value = dependencies
        buttonArr.value = [
            {
                text: 'OK',
                emitOption: 'dispMessage',
            },
        ]
        return
    }

    clearMessageBoxFields()
    dispMessage.value = true
    persistentShow.value = true
    buttonArr.value = [
        {
            text: 'Continue',
            emitOption: 'confirmDeletion',
        },
        {
            text: 'Cancel',
            emitOption: 'cancelDeletion',
        },
    ]
    circuitToBeDeleted.value = circuitItem
    messageVal.value = `Are you sure want to close: ${circuitItem.name}\nThis cannot be undone.`
    console.log(circuitItem)
}

function deleteCircuit(circuitItem) {
    var index = SimulatorStore().circuit_list.indexOf(circuitItem)
    if (index !== -1) {
        SimulatorStore().circuit_list.splice(index, 1)
    }
    deleteCurrentCircuit(circuitItem.id)
    showMessage('Circuit was successfully closed')
    updateCount.value++
}

function dialogBoxConformation(selectedOption, circuitItem, circuitNameVal) {
    dispMessage.value = false
    if (selectedOption == 'confirmDeletion') {
        deleteCircuit(circuitItem)
    }
    if (selectedOption == 'cancelDeletion') {
        showMessage('Circuit was not closed')
    }
    if (selectedOption == 'confirmCreation') {
        createNewCircuitScope(circuitNameVal)
    }
}

function createNewCircuit() {
    clearMessageBoxFields()
    dispMessage.value = true
    persistentShow.value = true
    buttonArr.value = [
        {
            text: 'Create',
            emitOption: 'confirmCreation',
        },
        {
            text: 'Cancel',
            emitOption: 'cancelCreation',
        },
    ]
    inputArr.value = ['Enter Circuit Name']
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
