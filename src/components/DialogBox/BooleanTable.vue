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
const props = defineProps({
    tableHeader: { type: Array, default: () => [] },
    tableBody: { type: Array, default: () => [] },
})
</script>

<style scoped>
#booleanTable {
    width: 200px;
}

.content-table {
    border-collapse: collapse;
    font-size: 0.9em;
    min-width: 400px;
}

.content-table tr th {
    font-weight: bold;
}

.content-table th,
.content-table td {
    padding: 5px 15px;
    margin: 0 3px;
    width: 20%;
    border-radius: 2px;
}

.content-table tbody tr {
    text-align: center;
    display: flex;
    margin-bottom: 4px;
}

.content-table tbody {
    display: table-row-group;
    overflow: auto !important;
    margin-left: 52px;
}
</style>
