<template>
    <table class="content-table">
      <tbody style="display: block; max-height: 70vh; overflow-y: scroll">
        <tr>
          <th v-for="(tableHeading, index) in tableHeader" :key="String(index)">
            {{ tableHeading }}
          </th>
        </tr>
        <tr v-for="(tableRow, rowIndex) in tableBody" :key="String(rowIndex)">
          <td v-for="(tableElement, columnIndex) in tableRow" :key="String(columnIndex)">
            {{ tableElement }}
          </td>
        </tr>
      </tbody>
    </table>
  </template>
  
  <script lang="ts" setup>
  import { defineProps } from 'vue';
  
  const props = defineProps({
    tableHeader: {
      type: Array as () => string[],
      default: () => []
    },
    tableBody: {
      type: Array as () => string[][],
      default: () => []
    }
  });
  
  
  console.log(props.tableHeader);
  console.log(props.tableBody);
  </script>
  