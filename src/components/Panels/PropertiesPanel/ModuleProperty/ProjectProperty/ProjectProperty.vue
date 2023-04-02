<template>
    <p>
        <span>Project:</span>
        <input
            id="projname"
            class="objectPropertyAttribute"
            type="text"
            autocomplete="off"
            name="setProjectName"
            :value="getProjectName() || 'Untitled'"
        />
    </p>

    <p>
        <span>Circuit:</span>
        <input
            id="circname"
            :key="circuitId"
            class="objectPropertyAttribute"
            type="text"
            autocomplete="off"
            name="changeCircuitName"
            :value="circuitName"
        />
    </p>

    <InputGroups
        property-name="Clock Time (ms):"
        :property-value="simulationArea.timePeriod"
        property-value-type="number"
        value-min="50"
        step-size="10"
        property-input-name="changeClockTime"
        property-input-id="clockTime"
    />

    <p>
        <span>Clock Enabled:</span>
        <label class="switch">
            <input
                type="checkbox"
                class="objectPropertyAttributeChecked"
                name="changeClockEnable" />
            <span class="slider"></span
        ></label>
    </p>

    <p>
        <span>Lite Mode:</span>
        <label class="switch">
            <input
                type="checkbox"
                class="objectPropertyAttributeChecked"
                name="changeLightMode"
            />
            <span class="slider"></span>
        </label>
    </p>

    <p>


        <button class="panelButton button-green" type="button"  @click="toggleLayoutMode">Edit Layout</button>
        <button class="panelButton button-red" type="button"  @click="deleteCurrentCircuit">Delete Circuit</button>
           
    </p>
</template>

<script lang="ts" setup>
import { deleteCurrentCircuit } from '#/simulator/src/circuit'
import { getProjectName } from '#/simulator/src/data/save'
import { toggleLayoutMode } from '#/simulator/src/layoutMode'
import simulationArea from '#/simulator/src/simulationArea'
import InputGroups from '#/components/Panels/Shared/InputGroups.vue'
import { ref } from '@vue/reactivity'
import { onMounted } from '@vue/runtime-core'
const circuitId = ref(0)
const circuitName = ref('Untitled-Cirucit')


onMounted(() => {
    // checking if circuit or tab is switched
    setInterval(() => {
        if (circuitId.value != globalScope.id) {
            circuitName.value = globalScope.name
            circuitId.value = globalScope.id
        }
    }, 100)
})
</script>

<style scoped>
  .panelButton {
    background: linear-gradient(to bottom right, #EF4765, #FF9A5A);
    border: 0;
    border-radius: 12px;
    color: #FFFFFF;
    cursor: pointer;
    display: inline-block;
    font-family: -apple-system,system-ui,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    font-size: 16px;
    font-weight: 500;
    line-height: 2.5;
    outline: transparent;
    padding: 0 1rem;
    text-align: center;
    text-decoration: none;
    transition: box-shadow .2s ease-in-out;
    user-select: none;
    -webkit-user-select: none;
    touch-action: manipulation;
    white-space: nowrap;
    width: 100%;
    margin-bottom: 5px;
  }

  .button-red {
    background: linear-gradient(to bottom right, #EF4765, #FF9A5A);
  }

  .button-green {
    background: linear-gradient(to bottom right, #06d6a0, #1B3A4B);
  }

  .panelButton:not([disabled]):focus {
    box-shadow: 0 0 .25rem rgba(0, 0, 0, 0.5), -.125rem -.125rem 1rem rgba(239, 71, 101, 0.5), .125rem .125rem 1rem rgba(255, 154, 90, 0.5);
  }

  .panelButton:not([disabled]):hover {
    box-shadow: 0 0 .25rem rgba(0, 0, 0, 0.5), -.125rem -.125rem 1rem rgba(239, 71, 101, 0.5), .125rem .125rem 1rem rgba(255, 154, 90, 0.5);
  }

  .button-green:hover {
    box-shadow: #7CFC00;
  }
</style>