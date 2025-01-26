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
        @button-click="
            (selectedOption: string, circuitItem: any, circuitNameVal: any) =>
                dialogBoxConformation(selectedOption)
        "
    />
    <v-alert v-if="showAlert" :type="alertType" class="alertStyle">{{ alertMessage }}</v-alert>
</template>

<script lang="ts" setup>
import { stripTags } from '#/simulator/src/utils';
import { useState } from '#/store/SimulatorStore/state';
import messageBox from '@/MessageBox/messageBox.vue';
import { ref, onMounted } from 'vue';

/* imports from combinationalAnalysis.js */
import { GenerateCircuit, solveBooleanFunction } from '#/simulator/src/combinationalAnalysis';

// Define types for better type safety
type InputItem = {
    text: string;
    val: string | boolean;
    placeholder: string;
    id: string;
    style: string;
    class: string;
    type: string;
};

type ButtonItem = {
    text: string;
    emitOption: string;
};

type TableRow = (string | number | boolean)[];

const SimulatorState = useState();
onMounted(() => {
    SimulatorState.dialogBox.combinationalanalysis_dialog = false;
});

const inputArr = ref<InputItem[]>([]);
const buttonArr = ref<ButtonItem[]>([]);
const showAlert = ref<boolean>(false);
const alertType = ref<string>('error');
const alertMessage = ref<string>('');
const outputListNamesInteger = ref<number[]>([]);
const inputListNames = ref<string[]>([]);
const outputListNames = ref<string[]>([]);
const tableHeader = ref<string[]>([]);
const tableBody = ref<TableRow[]>([]);
const output = ref<(string | number | boolean)[] | null>(null);

// Initialize inputArr
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
        val: false,
        placeholder: '',
        id: 'decimalColumnBox',
        style: '',
        class: 'cAinput',
        type: 'checkbox',
    },
];

// Initialize buttonArr
const buttonArray: ButtonItem[] = [
    {
        text: 'Next',
        emitOption: 'showLogicTable',
    },
    {
        text: 'Close',
        emitOption: 'closeMessageBox',
    },
];
buttonArr.value = buttonArray;

function clearData(): void {
    inputArr.value[0].val = '';
    inputArr.value[1].val = '';
    inputArr.value[3].val = '';
    inputArr.value[4].val = false;
    buttonArr.value = buttonArray;
    outputListNamesInteger.value = [];
    inputListNames.value = [];
    outputListNames.value = [];
    tableHeader.value = [];
    tableBody.value = [];
    output.value = [];
}

function dialogBoxConformation(selectedOption: string, circuitItem?: any): void {
    if (selectedOption === 'showLogicTable') {
        createLogicTable();
    }
    if (selectedOption === 'closeMessageBox') {
        inputArr.value.forEach((item) => {
            if (item.type === 'text') {
                item.val = '';
            }
            if (item.type === 'checkbox') {
                item.val = false;
            }
        });
        clearData();
        SimulatorState.dialogBox.combinationalanalysis_dialog = false;
    }
    if (selectedOption === 'generateCircuit') {
        SimulatorState.dialogBox.combinationalanalysis_dialog = false;
        GenerateCircuit();
        clearData();
        SimulatorState.dialogBox.combinationalanalysis_dialog = false;
    }
    if (selectedOption === 'printTruthTable') {
        printBooleanTable();
        clearData();
        SimulatorState.dialogBox.combinationalanalysis_dialog = false;
    }
}

function createLogicTable(): void {
    let inputList = stripTags(inputArr.value[0].val as string).split(',');
    let outputList = stripTags(inputArr.value[1].val as string).split(',');
    let booleanExpression = inputArr.value[3].val as string;

    inputList = inputList.map((x) => x.trim()).filter((e) => e);
    outputList = outputList.map((x) => x.trim()).filter((e) => e);
    booleanExpression = booleanExpression.replace(/ /g, '').toUpperCase();

    const booleanInputVariables: string[] = [];
    for (let i = 0; i < booleanExpression.length; i++) {
        if (booleanExpression[i] >= 'A' && booleanExpression[i] <= 'Z') {
            if (booleanExpression.indexOf(booleanExpression[i]) === i) {
                booleanInputVariables.push(booleanExpression[i]);
            }
        }
    }
    booleanInputVariables.sort();

    if (inputList.length > 0 && outputList.length > 0 && booleanInputVariables.length === 0) {
        SimulatorState.dialogBox.combinationalanalysis_dialog = false;
        createBooleanPrompt(inputList, outputList, null);
    } else if (booleanInputVariables.length > 0 && inputList.length === 0 && outputList.length === 0) {
        SimulatorState.dialogBox.combinationalanalysis_dialog = false;
        output.value = [];
        solveBooleanFunction(booleanInputVariables, booleanExpression);
        if (output.value !== null) {
            createBooleanPrompt(booleanInputVariables, booleanExpression);
        }
    } else if ((inputList.length === 0 || outputList.length === 0) && booleanInputVariables.length === 0) {
        showAlert.value = true;
        alertType.value = 'info';
        alertMessage.value = 'Enter Input / Output Variable(s) OR Boolean Function!';
        setTimeout(() => {
            showAlert.value = false;
        }, 2000);
    } else {
        showAlert.value = true;
        alertType.value = 'warning';
        alertMessage.value = 'Use Either Combinational Analysis Or Boolean Function To Generate Circuit!';
        setTimeout(() => {
            showAlert.value = false;
        }, 2000);
    }
}

function createBooleanPrompt(inputList: string[], outputList: string[], scope: any = globalScope): void {
    inputListNames.value = inputList || prompt('Enter inputs separated by commas')?.split(',') || [];
    outputListNames.value = outputList || prompt('Enter outputs separated by commas')?.split(',') || [];

    if (output.value === null) {
        outputListNamesInteger.value = outputListNames.value.map((_, i) => 7 * i + 13);
    } else {
        outputListNamesInteger.value = [13];
    }

    tableBody.value = [];
    tableHeader.value = [];
    let fw = 0;
    if (inputArr.value[4].val === true) {
        fw = 1;
        tableHeader.value.push('dec');
    }

    tableHeader.value.push(...inputListNames.value);
    if (output.value === null) {
        tableHeader.value.push(...outputListNames.value);
    } else {
        tableHeader.value.push(outputListNames.value.join(', '));
    }

    for (let i = 0; i < 1 << inputListNames.value.length; i++) {
        tableBody.value[i] = new Array(tableHeader.value.length);
    }

    for (let i = 0; i < inputListNames.value.length; i++) {
        for (let j = 0; j < 1 << inputListNames.value.length; j++) {
            tableBody.value[j][i + fw] = +((j & (1 << (inputListNames.value.length - i - 1))) !== 0);
        }
    }

    if (inputArr.value[4].val === true) {
        for (let j = 0; j < 1 << inputListNames.value.length; j++) {
            tableBody.value[j][0] = j;
        }
    }

    for (let j = 0; j < 1 << inputListNames.value.length; j++) {
        for (let i = 0; i < outputListNamesInteger.value.length; i++) {
            if (output.value === null) {
                tableBody.value[j][inputListNames.value.length + fw + i] = 'x';
            }
        }
        if (output.value !== null) {
            tableBody.value[j][inputListNames.value.length + fw] = output.value[j];
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

function printBooleanTable(): void {
    const messageBoxElement = document.querySelector('.messageBox .v-card-text');
    if (!messageBoxElement) return;

    const sTable = messageBoxElement.innerHTML;

    const style = `<style>
        table {font: 40px Calibri;}
        table, th, td {border: solid 1px #DDD;border-collapse: 0;}
        tbody {padding: 2px 3px;text-align: center;}
    </style>`.replace(/\n/g, '');

    const win = window.open('', '', 'height=700,width=700');
    if (!win) return;

    const htmlBody = `
        <html>
            <head>
                <title>Boolean Logic Table</title>
                ${style}
            </head>
            <body>
                <center>${sTable}</center>
            </body>
        </html>
    `;

    win.document.write(htmlBody);
    win.document.close();
    win.print();
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