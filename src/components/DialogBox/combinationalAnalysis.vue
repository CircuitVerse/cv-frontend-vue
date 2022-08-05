<template>
    <messageBox
        v-model="SimulatorState.dialogBox.combinationalanalysis_dialog"
        :button-list="buttonArr"
        :input-list="inputArr"
        :is-persistent="true"
        message-text="BooleanLogicTable"
        @button-click="
            (selectedOption, circuitItem, circuitNameVal) =>
                dialogBoxConformation(selectedOption)
        "
    />
</template>

<script lang="ts" setup>
import { useState } from '#/store/SimulatorStore/state'
import messageBox from '@/MessageBox/messageBox.vue'
import { ref } from '@vue/reactivity'
import { onMounted } from '@vue/runtime-core'

const SimulatorState = useState()

onMounted(() => {
    SimulatorState.dialogBox.combinationalanalysis_dialog = false
})
const inputArr = ref([{}])
const buttonArr = ref([{}])

inputArr.value = [
    {
        text: 'Enter Input names separated by commas: ',
        placeholder: 'eg. In A, In B',
        id: 'inputNameList',
        style: '',
        type: 'text',
    },
    {
        text: 'Enter Output names separated by commas: ',
        placeholder: 'eg. Out X, Out Y',
        id: 'outputNameList',
        style: '',
        type: 'text',
    },
    {
        text: 'OR',
        placeholder: '',
        id: '',
        style: 'text-align:center;',
        type: 'nil',
    },
    {
        text: 'Enter Boolean Function:',
        placeholder: 'Example: (AB)',
        id: 'booleanExpression',
        style: '',
        type: 'text',
    },
    {
        text: 'I need a decimal column.',
        placeholder: '',
        id: 'decimalColumnBox',
        style: '',
        type: 'checkbox',
    },
]

buttonArr.value = [
    {
        text: 'Next',
        emitOption: 'showLogicTable',
    },
    {
        text: 'Close',
        emitOption: 'closeMessageBox',
    },
]

function dialogBoxConformation(selectedOption) {
    SimulatorState.dialogBox.combinationalanalysis_dialog = false
    if (selectedOption == 'showLogicTable') {
        console.log('Show Table')
    }
    if (selectedOption == 'closeMessageBox') {
        console.log('Circuit was not closed')
    }
}
</script>
