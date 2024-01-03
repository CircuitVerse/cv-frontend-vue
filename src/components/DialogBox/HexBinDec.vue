<template>
    <v-dialog
        v-model="SimulatorState.dialogBox.hex_bin_dec_converter_dialog"
        :persistent="false"
    >
        <v-card class="messageBoxContent">
            <v-card-text>
                <p class="dialogHeader">Hex-Bin-Dec Converter</p>
                <v-btn
                    size="x-small"
                    icon
                    class="dialogClose"
                    @click="
                        SimulatorState.dialogBox.hex_bin_dec_converter_dialog = false
                    "
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
                <div
                    v-for="(value, index) in Object.entries(inputArr)"
                    id="bitconverterprompt"
                    :key="value[0]"
                    title="Dec-Bin-Hex-Converter"
                >
                    <label>{{ value[1].label }}</label>
                    <br />
                    <input
                        :id="value[0]"
                        type="text"
                        :value="value[1].val"
                        :label="value[1].label"
                        name="text1"
                        @keyup="(payload) => converter(payload)"
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
import { onMounted, ref } from '@vue/runtime-core'

const inputArr = ref({
    decimalInput: {
        val: '16',
        label: 'Decimal value',
    },
    binaryInput: {
        val: '0b10000',
        label: 'Binary value',
    },
    bcdInput: {
        val: '10110',
        label: 'Binary-coded decimal value',
    },
    octalInput: {
        val: '020',
        label: 'Octal value',
    },
    hexInput: {
        val: '0x10',
        label: 'Hexadecimal value',
    },
})

onMounted(() => {
    SimulatorState.dialogBox.hex_bin_dec_converter_dialog = false
})

function converter(e: KeyboardEvent) {
    const target = <HTMLInputElement>e.target!
    switch (target.id) {
        case 'decimalInput':
            decimalConverter(target.value)
            break
        case 'binaryInput':
            binaryConverter(target.value)
            break
        case 'bcdInput':
            bcdConverter(target.value)
            break
        case 'octalInput':
            octalConverter(target.value)
            break
        case 'hexInput':
            hexConverter(target.value)
            break
    }
}

function convertToBCD(value: number) {
    let digits = value.toString().split('')
    let bcdOfDigits = digits.map(function (digit) {
        return parseInt(digit).toString(2).padStart(4, '0')
    })
    return bcdOfDigits.join('')
}

function setBaseValues(x: number) {
    if (isNaN(x)) {
        return
    }
    inputArr.value.binaryInput.val = '0b' + x.toString(2)
    inputArr.value.bcdInput.val = convertToBCD(x)
    inputArr.value.octalInput.val = '0' + x.toString(8)
    inputArr.value.hexInput.val = '0x' + x.toString(16)
    inputArr.value.decimalInput.val = x.toString(10)
}

function decimalConverter(input: string) {
    const x = parseInt(input, 10)
    setBaseValues(x)
}

function binaryConverter(input: string) {
    let x
    if (input.slice(0, 2) == '0b') {
        x = parseInt(input.slice(2), 2)
    } else {
        x = parseInt(input, 2)
    }
    setBaseValues(x)
}

function bcdConverter(input: string) {
    var num = 0
    while (input.length % 4 !== 0) {
        input = '0' + input
    }
    var i = 0
    while (i < input.length / 4) {
        if (parseInt(input.slice(4 * i, 4 * (i + 1)), 2) < 10) {
            num = num * 10 + parseInt(input.slice(4 * i, 4 * (i + 1)), 2)
        } else {
            return setBaseValues(NaN)
        }
        i++
    }
    return setBaseValues(num)
}

function octalConverter(input: string) {
    var x = parseInt(input, 8)
    setBaseValues(x)
}

function hexConverter(input: string) {
    var x = parseInt(input, 16)
    setBaseValues(x)
}
</script>
