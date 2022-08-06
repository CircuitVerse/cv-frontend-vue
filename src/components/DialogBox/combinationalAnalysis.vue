<template>
    <messageBox
        v-model="SimulatorState.dialogBox.combinationalanalysis_dialog"
        :button-list="buttonArr"
        :input-list="inputArr"
        input-class="combinationalAnalysisInput"
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
        val: '',
        placeholder: 'eg. In A, In B',
        id: 'inputNameList',
        style: '',
        class: 'cAinput',
        type: 'text',
    },
    {
        text: 'Enter Output names separated by commas: ',
        val: '',
        placeholder: 'eg. Out X, Out Y',
        id: 'outputNameList',
        style: '',
        class: 'cAinput',
        type: 'text',
    },
    {
        text: 'OR',
        placeholder: '',
        id: '',
        style: 'text-align:center;',
        class: 'cAinput',
        type: 'nil',
    },
    {
        text: 'Enter Boolean Function:',
        val: '',
        placeholder: 'Example: (AB)',
        id: 'booleanExpression',
        style: '',
        class: 'cAinput',
        type: 'text',
    },
    {
        text: 'I need a decimal column.',
        val: '',
        placeholder: '',
        id: 'decimalColumnBox',
        style: '',
        class: 'cAinput',
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

function dialogBoxConformation(selectedOption, circuitItem) {
    SimulatorState.dialogBox.combinationalanalysis_dialog = false
    console.log(inputArr.value)
    // use the above value to show tables
    if (selectedOption == 'showLogicTable') {
        console.log('Show Table')
    }
    if (selectedOption == 'closeMessageBox') {
        console.log('Circuit was not closed')
    }
}
</script>
