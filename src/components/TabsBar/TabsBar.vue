<template>
  <div id="tabsBar" class="noSelect pointerCursor" :class="embedClass()">
    <draggable :key="updateCount" v-model="SimulatorState.circuitList" class="list-group" :component-data="{
      tag: 'div',
      type: 'transition-group',
      name: !drag ? 'flip-list' : null,
    }" item-key="name" v-bind="dragOptions" @start="drag = true" @end="drag = false">
      <template #item="{ element }">
        <div :id="element.id" :key="element.id" style="" class="circuits toolbarButton" :class="tabsbarClasses(element)"
          draggable="true" @click="switchCircuit(element.id)">
          <span class="circuitName noSelect">
            {{ truncateString(element.name, 18) }}
          </span>
          <span v-if="!isEmbed()" :id="element.id" class="tabsCloseButton" @click.stop="closeCircuit(element)">
            <v-icon class="tabsbar-close">mdi-close</v-icon>
          </span>
        </div>
      </template>
    </draggable>
    <button v-if="!isEmbed()" @click="createNewCircuitScope()">
      &#43;
    </button>
  </div>
</template>

<script lang="ts" setup>
import draggable from 'vuedraggable';
import { ref, Ref } from 'vue';
import { useState } from '#/store/SimulatorStore/state';
import { closeCircuit } from '../helpers/deleteCircuit/DeleteCircuit.vue';
import { truncateString } from '#/simulator/src/utils';
import { switchCircuit, createNewCircuitScope } from '#/simulator/src/circuit';
const SimulatorState = <SimulatorStateType>useState()
const drag: Ref<boolean> = ref(false)
const updateCount: Ref<number> = ref(0)

type SimulatorStateType = {
  circuitList: Array<Object>
  dialogBox: {
    create_circuit: boolean
  }
}

function dragOptions(): Object {
  return {
    animation: 200,
    group: 'description',
    disabled: false,
    ghostClass: 'ghost',
  }
}

function tabsbarClasses(e: any): string {
  let class_list = ''
  if ((window as any).embed) {
    class_list = 'embed-tabs'
  }
  if (e.focussed) {
    class_list += ' current'
  }
  return class_list
}

function embedClass(): string {
  if ((window as any).embed) {
    return 'embed-tabbar'
  }
  return ''
}

function isEmbed(): boolean {
  return (window as any).embed
}
</script>

<style scoped>
#tabsBar.embed-tabbar {
  background-color: transparent;
}

#tabsBar.embed-tabbar .circuits {
  border: 1px solid var(--br-circuit);
  color: var(--text-circuit);
  background-color: var(--bg-tabs) !important;
}

#tabsBar.embed-tabbar .circuits:hover {
  background-color: var(--bg-circuit) !important;
}

#tabsBar.embed-tabbar .current {
  color: var(--text-circuit);
  background-color: var(--bg-circuit) !important;
}

#tabsBar.embed-tabbar button {
  color: var(--text-panel);
  background-color: var(--primary);
  border: 1px solid var(--br-circuit-cur);
}

#tabsBar.embed-tabbar button:hover {
  color: var(--text-panel);
  border: 1px solid var(--br-circuit-cur);
}

.list-group {
  display: inline;
}
</style>