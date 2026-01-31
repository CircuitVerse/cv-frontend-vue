<template>
    <table class="content-table">
        <tbody style="display: block; max-height: 70vh;">
            <tr>
                <th v-for="tableHeading in tableHeader" :key="tableHeading">
                    {{ tableHeading }}
                </th>
            </tr>
            <tr v-for="tableRow in tableBody" :key="tableRow">
                <th v-for="tableElement in tableRow" :key="tableElement">
                    {{ tableElement }}
                </th>
            </tr>
        </tbody>
    </table>
</template>

<script lang="ts" setup>
/**
 * BooleanTable component for displaying tabular data.
 * @param tableHeader - Array of strings for table headers
 * @param tableBody - 2D array of strings for table rows
 */
import { withDefaults, toRefs } from 'vue'

const props = withDefaults(defineProps<{
    tableHeader: string[]
    tableBody: string[][]
}>(), {
    tableHeader: () => [],
    tableBody: () => [],
})

const { tableHeader, tableBody } = toRefs(props)
</script>
