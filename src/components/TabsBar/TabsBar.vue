<template>
    <div class="tabs-container">
      <div
        id="tabsBar"
        class="noSelect pointerCursor"
        :class="[embedClass(), { collapsed: !showMaxHeight }]"
      >
        <div class="tabs-content">
          <draggable
            :key="updateCount"
            :item-key="updateCount.toString()"
            v-model="SimulatorState.circuit_list"
            class="list-group"
            tag="transition-group"
            :component-data="{
              tag: 'div',
              type: 'transition-group',
              name: !drag ? 'flip-list' : null,
            }"
            v-bind="dragOptions"
            @start="drag = true"
            @end="drag = false"
          >
            <template #item="{ element }">
              <div
                :id="element.id"
                :key="element.id"
                class="circuits toolbarButton"
                :class="tabsbarClasses(element)"
                draggable="true"
                @click="switchCircuit(element.id)"
              >
                <span class="circuitName noSelect" @mousedown="circuitNameClicked">
                  {{ truncateString(element.name, 18) }}
                </span>
                <span
                  v-if="!isEmbed()"
                  :id="element.id"
                  class="tabsCloseButton"
                  @click.stop="closeCircuit(element)"
                >
                  <v-icon class="tabsbar-close">mdi-close</v-icon>
                </span>
              </div>
            </template>
          </draggable>
          <button v-if="!isEmbed()" @click="createNewCircuitScope()">&#43;</button>
        </div>
      </div>
  
      <button class="tabsbar-toggle" @click="toggleHeight">
        <i :class="showMaxHeight ? 'fa fa-chevron-up' : 'fa fa-chevron-down'"></i>
      </button>
    </div>
  </template>
  
  <script lang="ts" setup>
  import draggable from 'vuedraggable'
  import { showMessage, truncateString } from '#/simulator/src/utils'
  import { ref, Ref } from 'vue'
  import {
    createNewCircuitScope,
    switchCircuit,
  } from '#/simulator/src/circuit'
  import { useState } from '#/store/SimulatorStore/state'
  import { closeCircuit } from '../helpers/deleteCircuit/DeleteCircuit.vue'
  import { circuitNameClicked } from '#/simulator/src/circuit'
  
  const SimulatorState = useState()
  const drag: Ref<boolean> = ref(false)
  const updateCount: Ref<number> = ref(0)
  
  const showMaxHeight = ref(true)
  
  function toggleHeight() {
    showMaxHeight.value = !showMaxHeight.value
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
  .tabs-container {
    position: relative;
    padding-right: 30px;
    background-color: var(--bg-tabs, #f0f0f0);
    max-height: 30px;
  }
  
  #tabsBar {
    z-index: 1;
    transition: all 0.4s ease;
    max-height: 100px;
    overflow: hidden;
  }
  
  #tabsBar.collapsed {
    max-height: 0px;
    padding: 0;
    margin: 0;
    opacity: 0;
  }
  
  .tabs-content {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 6px;
    padding: 4px 6px;
    overflow-x: auto;
    white-space: nowrap;
    background-color: var(--bg-tabs, #f0f0f0);
  }
  
  .list-group {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 6px;
    flex-wrap: nowrap;
  }
  
  .circuits.toolbarButton {
    display: flex;
    align-items: center;
    padding: 4px 10px;
    background-color: #fdfdfd;
    border: 1px solid #ccc;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
  }
  
  .current {
    background-color: #fff;
    border: 2px solid #444;
  }
  
  .circuitName {
    margin-right: 6px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .tabs-content {
    padding: 1px 6px;
    min-height: 15px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .tabs-content button:hover {
    background-color: #ddd;
  }
  
  .tabsbar-close {
    font-size: 1rem;
    opacity: 0.7;
  }
  
  .tabsbar-close:hover {
    opacity: 1;
  }
  
  .tabsCloseButton {
    margin-left: 4px;
    opacity: 0.6;
  }
  
  .tabsCloseButton:hover {
    opacity: 1;
  }
  
  #tabsBar button {
    font-size: 1rem;
    height: 20px;
    width: 20px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .tabsbar-toggle {
    position: absolute;
    right: 5px;
    top: 6px;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999;
    height: 18px;
    width: 18px;
    border-radius: 3px;
    background-color: #ddd;
    border: none;
  }
  
  .tabsbar-toggle:hover {
    background-color: #bbb;
  }
  
  .tabsbar-toggle i {
    font-size: 10px;
    transition: transform 0.3s ease;
  }
  
  .flip-list-move {
    transition: transform 0.3s ease;
  }
  
  .flip-list-enter-active,
  .flip-list-leave-active {
    transition: all 0.3s ease;
  }
  
  .flip-list-enter-from {
    opacity: 0;
    transform: translateX(-20px);
  }
  
  .flip-list-leave-to {
    opacity: 0;
    transform: translateX(20px);
  }
  
  .ghost {
    opacity: 0.5;
    transform: rotate(5deg);
  }
  </style>