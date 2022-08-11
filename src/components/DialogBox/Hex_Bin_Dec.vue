<template>
    <v-dialog
        v-model="SimulatorState.dialogBox.hex_bin_dec_converter_dialog"
        :persistent="false"
    >
        <v-card class="messageBoxContent">
            <v-card-text>
                <div id="bitconverterprompt" title="Dec-Bin-Hex-Converter">
                    <label>Decimal value</label>
                    <br />
                    <input
                        id="decimalInput"
                        type="text"
                        value="16"
                        label="Decimal"
                        name="text1"
                        @keyup="decimalConvertor"
                    />
                    <br /><br />
                    <label>Binary value</label>
                    <br />
                    <input
                        id="binaryInput"
                        type="text"
                        value="0b10000"
                        label="Binary"
                        name="text1"
                        @keyup="binaryConvertor"
                    />
                    <br /><br />
                    <label>Binary-coded decimal value</label>
                    <br />
                    <input
                        id="bcdInput"
                        type="text"
                        value="10110"
                        label="BCD"
                        name="text1"
                        @keyup="bcdConvertor"
                    />
                    <br /><br />
                    <label>Octal value</label>
                    <br />
                    <input
                        id="octalInput"
                        type="text"
                        value="020"
                        label="Octal"
                        name="text1"
                        @keyup="octalConvertor"
                    />
                    <br /><br />
                    <label>Hexadecimal value</label>
                    <br />
                    <input
                        id="hexInput"
                        type="text"
                        value="0x10"
                        label="Hex"
                        name="text1"
                        @keyup="hexConvertor"
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
import {
    convertors,
    setupBitConvertor,
    setBaseValues,
} from '#/simulator/src/utils'
import { onMounted, onUpdated } from '@vue/runtime-core'

onMounted(() => {
    SimulatorState.dialogBox.hex_bin_dec_converter_dialog = false
})

function decimalConvertor() {
    console.log('decimal-input change')
    var x = parseInt($('#decimalInput').val(), 10)
    setBaseValues(x)
}

function binaryConvertor() {
    console.log('binary-input change')
    var inp = $('#binaryInput').val()
    var x
    if (inp.slice(0, 2) == '0b') x = parseInt(inp.slice(2), 2)
    else x = parseInt(inp, 2)
    setBaseValues(x)
}

function bcdConvertor() {
    console.log('bcd change')
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
    console.log('octal change')
    var x = parseInt($('#octalInput').val(), 8)
    setBaseValues(x)
}

function hexConvertor() {
    console.log('hex change')
    var x = parseInt($('#hexInput').val(), 16)
    setBaseValues(x)
}
</script>

<style scoped></style>
