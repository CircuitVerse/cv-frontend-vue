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
        @button-click="handleButtonClick"
    />
    <v-alert v-if="showAlert" :type="alertType" class="alertStyle">
        {{ alertMessage }}
    </v-alert>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { stripTags } from '#/simulator/src/utils';
import { useState } from '#/store/SimulatorStore/state';
import messageBox from '@/MessageBox/messageBox.vue';
import { GenerateCircuit, solveBooleanFunction } from '#/simulator/src/combinationalAnalysis';

const SimulatorState = useState();
const inputArr = ref(createInitialInputArr());
const buttonArr = ref(createInitialButtonArr());
const showAlert = ref(false);
const alertType = ref('error');
const alertMessage = ref('');
const outputListNamesInteger = ref<number[]>([]);
const inputListNames = ref<string[]>([]);
const outputListNames = ref<string[]>([]);
const tableHeader = ref<string[]>([]);
const tableBody = ref<Array<Array<string | number>>>([]);
const output = ref<number[]>([]);

onMounted(() => {
    SimulatorState.dialogBox.combinationalanalysis_dialog = false;
});

function createInitialInputArr() {
    return [
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
            val: '',
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
    ];
}

function createInitialButtonArr() {
    return [
        {
            text: 'Next',
            emitOption: 'showLogicTable',
        },
        {
            text: 'Close',
            emitOption: 'closeMessageBox',
        },
    ];
}

function clearData() {
    inputArr.value.forEach((input) => {
        if (input.type === 'text') input.val = '';
        if (input.type === 'checkbox') input.val = '';
    });
    buttonArr.value = createInitialButtonArr();
    outputListNamesInteger.value = [];
    inputListNames.value = [];
    outputListNames.value = [];
    tableHeader.value = [];
    tableBody.value = [];
    output.value = [];
}

function handleButtonClick(selectedOption: string, circuitItem: any) {
    switch (selectedOption) {
        case 'showLogicTable':
            createLogicTable();
            break;
        case 'closeMessageBox':
            clearData();
            SimulatorState.dialogBox.combinationalanalysis_dialog = false;
            break;
        case 'generateCircuit':
            GenerateCircuit();
            clearData();
            SimulatorState.dialogBox.combinationalanalysis_dialog = false;
            break;
        case 'printTruthTable':
            printBooleanTable();
            clearData();
            SimulatorState.dialogBox.combinationalanalysis_dialog = false;
            break;
        default:
            console.warn('Unknown button option:', selectedOption);
    }
}

function createLogicTable() {
    // Validate input format
    const inputValue = stripTags(inputArr.value[0].val);
    const outputValue = stripTags(inputArr.value[1].val);
    if (!/^[A-Za-z]+(,[A-Za-z]+)*$/.test(inputValue) && inputValue !== '') {
        showAlertMessage('error', 'Invalid input format. Use comma-separated letters.');
        return;
    }
    if (!/^[A-Za-z]+(,[A-Za-z]+)*$/.test(outputValue) && outputValue !== '') {
        showAlertMessage('error', 'Invalid output format. Use comma-separated letters.');
        return;
    }
    const inputList = inputValue.split(',').map((x) => x.trim()).filter(Boolean);
    const outputList = outputValue.split(',').map((x) => x.trim()).filter(Boolean);
    let booleanExpression = inputArr.value[3].val.replace(/ /g, '').toUpperCase();

    const booleanInputVariables = extractBooleanInputVariables(booleanExpression);

    if (inputList.length > 0 && outputList.length > 0 && booleanInputVariables.length === 0) {
        SimulatorState.dialogBox.combinationalanalysis_dialog = false;
        createBooleanPrompt(inputList, outputList);
    } else if (booleanInputVariables.length > 0 && inputList.length === 0 && outputList.length === 0) {
        SimulatorState.dialogBox.combinationalanalysis_dialog = false;
        solveBooleanFunction(booleanInputVariables, booleanExpression);
        output.value = output.value || [];
        if (output.value.length > 0) {
            createBooleanPrompt(booleanInputVariables, booleanInputVariables);
        }
    } else if ((inputList.length === 0 || outputList.length === 0) && booleanInputVariables.length === 0) {
        showAlertMessage('info', 'Enter Input / Output Variable(s) OR Boolean Function!');
    } else {
        showAlertMessage('warning', 'Use Either Combinational Analysis Or Boolean Function To Generate Circuit!');
    }
}

function extractBooleanInputVariables(expression: string): string[] {
    const validOperators = ['(', ')', '+', '*', '!'];
    for (const char of expression) {
        if (!/[A-Z]/.test(char) && !validOperators.includes(char)) {
            showAlertMessage('error', `Invalid character in expression: ${char}`);
            return [];
        }
    }
    const variables = new Set<string>();
    for (const char of expression) {
        if (/[A-Z]/.test(char)) {
            variables.add(char);
        }
    }
    return Array.from(variables).sort();
}

function showAlertMessage(type: string, message: string) {
    showAlert.value = true;
    alertType.value = type;
    alertMessage.value = message;
    setTimeout(() => {
        showAlert.value = false;
    }, 2000);
}

function createBooleanPrompt(inputList: string[], outputList: string[]) {
    inputListNames.value = inputList;
    outputListNames.value = outputList;
    outputListNamesInteger.value = outputList.map((_, i) => 7 * i + 13); // Assigning random integers

    tableBody.value = [];
    tableHeader.value = [];

    const includeDecimalColumn = inputArr.value[4].val === 'true';
    if (includeDecimalColumn) {
        tableHeader.value.push('dec');
    }

    tableHeader.value.push(...inputListNames.value);
    tableHeader.value.push(...outputListNames.value);

    const rowCount = 1 << inputListNames.value.length;
    for (let i = 0; i < rowCount; i++) {
        tableBody.value[i] = new Array(tableHeader.value.length);
    }

    for (let i = 0; i < inputListNames.value.length; i++) {
        for (let j = 0; j < rowCount; j++) {
            tableBody.value[j][i + (includeDecimalColumn ? 1 : 0)] = +((j & (1 << (inputListNames.value.length - i - 1))) !== 0);
        }
    }

    if (includeDecimalColumn) {
        for (let j = 0; j < rowCount; j++) {
            tableBody.value[j][0] = j;
        }
    }

    for (let j = 0; j < rowCount; j++) {
        for (let i = 0; i < outputListNamesInteger.value.length; i++) {
            tableBody.value[j][inputListNames.value.length + (includeDecimalColumn ? 1 : 0) + i] = output.value?.[j] ?? 'x';
        }
    }

    SimulatorState.dialogBox.combinationalanalysis_dialog = true;
    buttonArr.value = [
        {
            text: 'Generate Circuit',
            emitOption: 'generateCircuit',
        },
        {
            text: 'Print Truth Table',
            emitOption: 'printTruthTable',
        },
    ];
}

function printBooleanTable() {
    const messageBoxElement = document.querySelector('.messageBox .v-card-text');
    if (!messageBoxElement) return;

    const sTable = messageBoxElement.innerHTML;
    const style = `
        <style>
            table { font: 40px Calibri; }
            table, th, td { border: solid 1px #DDD; border-collapse: 0; }
            tbody { padding: 2px 3px; text-align: center; }
        </style>
    `.replace(/\n/g, '');

    const win = window.open('', '', 'height=700,width=700');
    if (!win) {
        showAlertMessage('error', 'Popup was blocked. Please allow popups for this site.');
        return;
    }
    try {
        win.document.write(`
            <html>
                <head>
                    <title>Boolean Logic Table</title>
                    ${style}
                </head>
                <body>
                    <center>${sTable}</center>
                </body>
            </html>
        `);
        win.document.close();
        win.print();
    } catch (error) {
        showAlertMessage('error', 'Failed to print table. Please try again.');
        win.close();
    }
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