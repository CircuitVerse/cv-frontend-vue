<template>
    <table class="content-table">
        <tbody style="display: block; max-height: 70vh;">
            <tr>
                <th v-for="(tableHeading, headIndex) in tableHeader" :key="headIndex">
                    {{ tableHeading }}
                </th>
            </tr>
            <tr v-for="(tableRow, rowIndex) in tableBody" :key="rowIndex">
                <th
                    v-for="(tableElement, colIndex) in tableRow"
                    :key="colIndex"
                    :class="{ 'boolean-output-cell': isEditableCell(colIndex) }"
                    @click="isEditableCell(colIndex) && cycleValue(rowIndex, colIndex)"
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
    editable: { type: Boolean, default: false },
    outputStartCol: { type: Number, default: -1 },
})

function isEditableCell(colIndex: number) {
    return props.editable && props.outputStartCol >= 0 && colIndex >= props.outputStartCol
}

function cycleValue(rowIndex: number, colIndex: number) {
    const current = String((props.tableBody[rowIndex] as any[])[colIndex])
    const next = current === '0' ? '1' : current === '1' ? 'x' : '0'
    ;(props.tableBody[rowIndex] as any[])[colIndex] = next
}
</script>

<style scoped>
.boolean-output-cell {
    cursor: pointer;
    user-select: none;
}
</style>
