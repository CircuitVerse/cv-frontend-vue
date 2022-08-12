<template>
    <v-dialog
        v-model="SimulatorState.dialogBox.hex_bin_dec_converter_dialog"
        :persistent="false"
    >
        <v-card class="messageBoxContent">
            <v-card-text>
                <div
                    v-for="inputEle in inputArr"
                    id="bitconverterprompt"
                    :key="inputEle.inputId"
                    title="Dec-Bin-Hex-Converter"
                >
                    <label>{{ inputEle.label }}</label>
                    <br />
                    <input
                        :id="inputEle.inputId"
                        type="text"
                        :value="inputEle.val"
                        :label="inputEle.label"
                        name="text1"
                        @keyup="() => converter(inputEle.inputId)"
                    />
                    <br /><br />
                </div>
            </v-card-text>
            <v-card-actions>
                <v-btn class="messageBtn" block @click="setBaseValues(0)">
                    Reset
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
import { useState } from '#/store/SimulatorStore/state'
const SimulatorState = useState()
import { setBaseValues } from '#/simulator/src/utils'
import { onMounted, ref } from '@vue/runtime-core'

const inputArr = ref([])
inputArr.value = [
    {
        inputId: 'decimalInput',
        val: '16',
        label: 'Decimal',
    },
    {
        inputId: 'binaryInput',
        val: '0b10000',
        label: 'Binary',
    },
    {
        inputId: 'bcdInput',
        val: '10110',
        label: 'BCD',
    },
    {
        inputId: 'octalInput',
        val: '020',
        label: 'octal',
    },
    {
        inputId: 'hexInput',
        val: '0x10',
        label: 'Hex',
    },
]

onMounted(() => {
    SimulatorState.dialogBox.hex_bin_dec_converter_dialog = false
})

function converter(feildChange) {
    if (feildChange == 'decimalInput') decimalConvertor()
    if (feildChange == 'binaryInput') binaryConvertor()
    if (feildChange == 'bcdInput') bcdConvertor()
    if (feildChange == 'octalInput') decimalConvertor()
    if (feildChange == 'hexInput') octalConvertor()
}

function decimalConvertor() {
    var x = parseInt($('#decimalInput').val(), 10)
    setBaseValues(x)
}

function binaryConvertor() {
    var inp = $('#binaryInput').val()
    var x
    if (inp.slice(0, 2) == '0b') x = parseInt(inp.slice(2), 2)
    else x = parseInt(inp, 2)
    setBaseValues(x)
}

function bcdConvertor() {
    var input = $('#bcdInput').val()
    var num = 0
    while (input.length % 4 !== 0) {
        input = '0' + input
    }
    if (input !== 0) {
        var i = 0
        while (i < input.length / 4) {
            if (parseInt(input.slice(4 * i, 4 * (i + 1)), 2) < 10)
                num = num * 10 + parseInt(input.slice(4 * i, 4 * (i + 1)), 2)
            else return setBaseValues(NaN)
            i++
        }
    }
    return setBaseValues(x)
}

function octalConvertor() {
    var x = parseInt($('#octalInput').val(), 8)
    setBaseValues(x)
}

function hexConvertor() {
    var x = parseInt($('#hexInput').val(), 16)
    setBaseValues(x)
}
</script>

<style scoped></style>
