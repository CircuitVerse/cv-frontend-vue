<template>
    <messageBox
        v-model="SimulatorState.dialogBox.combinationalanalysis_dialog"
        class="messageBox"
        :button-list="buttonArr"
        :input-list="inputArr"
        input-class="combinationalAnalysisInput"
        :is-persistent="true"
        :table-header="tableHeader"
        :table-body="tableBody"
        message-text="Boolean Logic Table"
        @button-click="dialogBoxConformation"
        @cell-click="handleCellClick"
    />
    <v-alert v-if="showAlert" :type="alertType" class="alertStyle">{{
        alertMessage
    }}</v-alert>
</template>

<script lang="ts" setup>
import { stripTags } from '#/simulator/src/utils'
import { useState } from '#/store/SimulatorStore/state'
import messageBox from '@/MessageBox/messageBox.vue'
import { ref, nextTick, onMounted } from 'vue'
import {
    GenerateCircuit,
    solveBooleanFunction,
} from '#/simulator/src/combinationalAnalysis'

const SimulatorState = useState()
const showAlert = ref(false)
const alertType = ref('error')
const alertMessage = ref('')
const outputListNamesInteger = ref([])
const inputListNames = ref([])
const outputListNames = ref([])
const tableHeader = ref([])
const tableBody = ref([])
const output = ref([])

const inputArr = ref([
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
])

const buttonArr = ref([
    { text: 'Next', emitOption: 'showLogicTable' },
    { text: 'Close', emitOption: 'closeMessageBox' },
])

onMounted(() => {
    SimulatorState.dialogBox.combinationalanalysis_dialog = false
})

function showAlertMsg(type, message, duration = 2000) {
    showAlert.value = true
    alertType.value = type
    alertMessage.value = message
    setTimeout(() => (showAlert.value = false), duration)
}

function clearData() {
    inputArr.value.forEach((item) => {
        if (item.type === 'text') item.val = ''
        if (item.type === 'checkbox') item.val = false
    })
    buttonArr.value = [
        { text: 'Next', emitOption: 'showLogicTable' },
        { text: 'Close', emitOption: 'closeMessageBox' },
    ]
    outputListNamesInteger.value = []
    inputListNames.value = []
    outputListNames.value = []
    tableHeader.value = []
    tableBody.value = []
    output.value = []
    if (typeof window !== 'undefined') delete window.generateBooleanTableData
}

function handleCellClick(rowIndex, colIndex) {
    const inputLength = inputListNames.value.length
    const decimalOffset = inputArr.value[4].val ? 1 : 0
    const isOutputColumn = colIndex >= inputLength + decimalOffset

    if (isOutputColumn && (!output.value || output.value.length === 0)) {
        const current = tableBody.value[rowIndex][colIndex]
        const newValue =
            current === 'x' || !current ? '0' : current === '0' ? '1' : 'x'
        tableBody.value[rowIndex][colIndex] = newValue
        tableBody.value = [...tableBody.value]
        updateGlobalBooleanTableData()
    }
}

function updateGlobalBooleanTableData() {
    if (typeof window !== 'undefined') {
        window.generateBooleanTableData = generateBooleanTableData
    }
}

function generateBooleanTableData() {
    const data = {}
    const decimalOffset = inputArr.value[4].val ? 1 : 0
    const inputLength = inputListNames.value.length

    outputListNames.value.forEach((name, i) => {
        const index = outputListNamesInteger.value[i]
        data[name] = data[index] = { x: [], 1: [], 0: [] }

        tableBody.value.forEach((row, rowIndex) => {
            const value = row[inputLength + decimalOffset + i]
            if (['1', '0', 'x'].includes(value)) {
                data[name][value].push(rowIndex.toString())
                data[index][value].push(rowIndex.toString())
            }
        })
    })
    return data
}

function dialogBoxConformation(selectedOption) {
    const actions = {
        showLogicTable: createLogicTable,
        closeMessageBox: () => {
            clearData()
            SimulatorState.dialogBox.combinationalanalysis_dialog = false
        },
        generateCircuit: () => {
            try {
                if (!inputListNames.value.length)
                    throw new Error('No input variables defined')
                if (!outputListNames.value.length)
                    throw new Error('No output variables defined')
                if (!tableBody.value.length)
                    throw new Error('No truth table data available')

                updateGlobalBooleanTableData()
                nextTick(() => {
                    try {
                        GenerateCircuit(
                            outputListNamesInteger.value,
                            inputListNames.value,
                            output.value.length > 0 ? output.value : null,
                            outputListNames.value
                        )
                        clearData()
                        SimulatorState.dialogBox.combinationalanalysis_dialog =
                            false
                    } catch (error) {
                        showAlertMsg(
                            'error',
                            'Error generating circuit: ' + error.message,
                            3000
                        )
                    }
                })
            } catch (error) {
                showAlertMsg(
                    'error',
                    'Error generating circuit: ' + error.message,
                    3000
                )
            }
        },
        printTruthTable: () => {
            const sTable = $('.messageBox .v-card-text')[0].innerHTML
            const style = `<style>table {font: 40px Calibri;}table, th, td {border: solid 1px #DDD;border-collapse: 0;}tbody {padding: 2px 3px;text-align: center;}</style>`
            const win = window.open('', '', 'height=700,width=700')
            win.document.write(
                `<html><head><title>Boolean Logic Table</title>${style}</head><body><center>${sTable}</center></body></html>`
            )
            win.document.close()
            win.print()
            clearData()
            SimulatorState.dialogBox.combinationalanalysis_dialog = false
        },
    }
    actions[selectedOption]?.()
}

function createLogicTable() {
    const inputList = stripTags(inputArr.value[0].val)
        .split(',')
        .map((x) => x.trim())
        .filter((e) => e)
    const outputList = stripTags(inputArr.value[1].val)
        .split(',')
        .map((x) => x.trim())
        .filter((e) => e)
    const booleanExpression = inputArr.value[3].val
        .replace(/ /g, '')
        .toUpperCase()

    const booleanInputVariables = [
        ...new Set(booleanExpression.match(/[A-Z]/g) || []),
    ].sort()

    if (
        inputList.length > 0 &&
        outputList.length > 0 &&
        booleanInputVariables.length === 0
    ) {
        SimulatorState.dialogBox.combinationalanalysis_dialog = false
        createBooleanPrompt(inputList, outputList)
    } else if (
        booleanInputVariables.length > 0 &&
        inputList.length === 0 &&
        outputList.length === 0
    ) {
        const solvedOutput = solveBooleanFunction(
            booleanInputVariables,
            booleanExpression
        )
        if (solvedOutput) {
            output.value = solvedOutput
            SimulatorState.dialogBox.combinationalanalysis_dialog = false
            createBooleanPrompt(booleanInputVariables, booleanExpression)
        }
    } else if (
        (inputList.length === 0 || outputList.length === 0) &&
        booleanInputVariables.length === 0
    ) {
        showAlertMsg(
            'info',
            'Enter Input / Output Variable(s) OR Boolean Function!'
        )
    } else {
        showAlertMsg(
            'warning',
            'Use Either Combinational Analysis Or Boolean Function To Generate Circuit!'
        )
    }
}

function createBooleanPrompt(inputList, outputList) {
    inputListNames.value = inputList
    outputListNames.value = outputList
    tableBody.value = []
    tableHeader.value = []

    if (!output.value || output.value.length === 0) {
        outputListNamesInteger.value = outputListNames.value.map(
            (_, i) => 7 * i + 13
        )
    } else {
        outputListNamesInteger.value = [13]
        outputListNames.value = [outputListNames.value]
    }

    const fw = inputArr.value[4].val ? 1 : 0
    if (fw) tableHeader.value.push('dec')
    tableHeader.value.push(...inputListNames.value)
    tableHeader.value.push(
        ...(output.value?.length > 0
            ? [outputListNames.value[0]]
            : outputListNames.value)
    )

    const numRows = 1 << inputListNames.value.length
    const numCols = tableHeader.value.length

    tableBody.value = Array(numRows)
        .fill()
        .map(() => Array(numCols).fill(''))

   
    for (let i = 0; i < inputListNames.value.length; i++) {
        for (let j = 0; j < numRows; j++) {
            tableBody.value[j][i + fw] = String(
                +((j & (1 << (inputListNames.value.length - i - 1))) !== 0)
            )
        }
    }

    
    if (fw) {
        for (let j = 0; j < numRows; j++) {
            tableBody.value[j][0] = String(j)
        }
    }

    
    for (let j = 0; j < numRows; j++) {
        for (let i = 0; i < outputListNamesInteger.value.length; i++) {
            tableBody.value[j][inputListNames.value.length + fw + i] =
                !output.value || output.value.length === 0
                    ? 'x'
                    : String(output.value[j])
        }
    }

    updateGlobalBooleanTableData()
    SimulatorState.dialogBox.combinationalanalysis_dialog = true
    buttonArr.value = [
        { text: 'Generate Circuit', emitOption: 'generateCircuit' },
        { text: 'Print Truth Table', emitOption: 'printTruthTable' },
    ]
}
</script>

<style scoped>
.alertStyle {
    position: absolute;
    top: 100px;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10000;
}
</style>
