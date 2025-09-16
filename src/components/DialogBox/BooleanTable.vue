<template>
    <table class="content-table">
        <tbody style="display: block; max-height: 70vh;">
            <tr>
                <th v-for="tableHeading in tableHeader" :key="tableHeading">
                    {{ tableHeading }}
                </th>
            </tr>
            <tr v-for="(tableRow, rowIndex) in tableBody" :key="rowIndex">
                <th 
                    v-for="(tableElement, colIndex) in tableRow" 
                    :key="colIndex"
                    @click="handleCellClick(rowIndex, colIndex)"
                >
                    {{ tableElement }}
                </th>
            </tr>
        </tbody>
    </table>
</template>

<script lang="ts" setup>
const props = defineProps({
    tableHeader: { type: Array, default: () => [] },
    tableBody: { type: Array, default: () => [] },
    inputLength: { type: Number, default: 0 },
    hasDecimalColumn: { type: Boolean, default: false },
    isOutputEmpty: { type: Boolean, default: true }
})

const emit = defineEmits(['cell-click'])

function handleCellClick(rowIndex: number, colIndex: number) {
    const decimalOffset = props.hasDecimalColumn ? 1 : 0
    const isOutputColumn = colIndex >= props.inputLength + decimalOffset
    
    if (isOutputColumn && props.isOutputEmpty) {
        const currentValue = props.tableBody[rowIndex][colIndex]
        
        let newValue
        if (currentValue === 'x' || currentValue === undefined || currentValue === '') {
            newValue = '0'
        } else if (currentValue === '0') {
            newValue = '1'
        } else if (currentValue === '1') {
            newValue = 'x'
        } else {
            newValue = 'x'
        }
        
        props.tableBody[rowIndex][colIndex] = newValue
        
        emit('cell-click', rowIndex, colIndex, newValue)
    }
}
</script>