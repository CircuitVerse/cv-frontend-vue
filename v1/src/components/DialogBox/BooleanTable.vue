<template>
    <div v-if="editable" class="table-toolbar">
        <v-btn
            size="small"
            class="toolbar-btn"
            variant="outlined"
            :disabled="undoStack.length === 0"
            @click="undo"
        >
            <i class="fas fa-undo mr-1"></i>Undo
        </v-btn>
        <v-btn
            size="small"
            class="toolbar-btn"
            variant="outlined"
            :disabled="redoStack.length === 0"
            @click="redo"
        >
            Redo<i class="fas fa-redo ml-1"></i>
        </v-btn>
    </div>
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
                    :class="{ output: isEditableCell(colIndex) }"
                    :tabindex="isEditableCell(colIndex) ? 0 : undefined"
                    :role="isEditableCell(colIndex) ? 'button' : undefined"
                    @click="isEditableCell(colIndex) && cycleValue(rowIndex, colIndex)"
                    @keydown.enter.space.prevent="isEditableCell(colIndex) && cycleValue(rowIndex, colIndex)"
                >
                    {{ tableElement }}
                </th>
            </tr>
        </tbody>
    </table>
</template>

<script lang="ts" setup>
import { inject, ref } from 'vue'

const props = defineProps({
    tableHeader: { type: Array, default: () => [] },
    tableBody: { type: Array, default: () => [] },
    editable: { type: Boolean, default: false },
    outputStartCol: { type: Number, default: -1 },
})

const {
    undoStack = ref([]),
    redoStack = ref([]),
    recordEdit = () => {},
    undo = () => {},
    redo = () => {},
} = inject('tableHistory', {}) as any

function isEditableCell(colIndex: number) {
    return props.editable && props.outputStartCol >= 0 && colIndex >= props.outputStartCol
}

function cycleValue(rowIndex: number, colIndex: number) {
    const current = String((props.tableBody[rowIndex] as any[])[colIndex])
    const next = current === '0' ? '1' : current === '1' ? 'x' : '0'

    recordEdit({
        rowIndex,
        colIndex,
        prevValue: current,
        nextValue: next,
    })

    ;(props.tableBody[rowIndex] as any[])[colIndex] = next
}
</script>

<style scoped>
.table-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding: 0 4px;
}

.toolbar-btn {
    text-transform: none;
    font-size: 12px;
    min-width: 75px;
}
</style>
