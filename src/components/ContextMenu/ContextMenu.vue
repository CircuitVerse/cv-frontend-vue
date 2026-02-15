<template>
    <div
      id="contextMenu"
      :style="menuStyle"
      @transitionend="onTransitionEnd"
      oncontextmenu="return false;"
    >
      <ul>
        <li
          v-for="(menuOption, index) in contextMenuOptions"
          :key="index"
          :data-index="index"
          @click="menuItemClicked($event)"
        >
          {{ menuOption }}
        </li>
      </ul>
    </div>
  </template>
  
  <script>
  import undo from '../../simulator/src/data/undo'
  import { paste } from '../../simulator/src/events'
  import { deleteSelected } from '../../simulator/src/ux'
  import { createNewCircuitScope } from '../../simulator/src/circuit'
  import logixFunction from '../../simulator/src/data'
  
  export default {
    name: 'ContextMenu',
    data() {
      return {
        contextMenuOptions: [
          'Copy',
          'Cut',
          'Paste',
          'Delete',
          'Undo',
          'New Circuit',
          'Insert Subcircuit',
          'Center Focus',
        ],
        ctxPos: {
          x: 0,
          y: 0,
          visible: false,
          hiding: false,
        },
      }
    },
    computed: {
      menuStyle() {
        return {
          opacity: this.ctxPos.visible ? '1' : '0',
          visibility: this.ctxPos.visible || this.ctxPos.hiding ? 'visible' : 'hidden',
          transition: 'opacity 0.2s ease',
        }
      },
    },
    mounted() {
      this.ctxPos.visible = false
    },
    methods: {
      hideContextMenu() {
        this.ctxPos.visible = false
        this.ctxPos.hiding = true
      },
      onTransitionEnd() {
        if (!this.ctxPos.visible && this.ctxPos.hiding) {
          this.ctxPos.hiding = false
        }
      },
      menuItemClicked(event) {
        this.hideContextMenu()
        const id = event.target.dataset.index
        if (id == 0) {
          document.execCommand('copy')
        } else if (id == 1) {
          document.execCommand('cut')
        } else if (id == 2) {
          paste(localStorage.getItem('clipboardData'))
        } else if (id == 3) {
          deleteSelected()
        } else if (id == 4) {
          undo()
        } else if (id == 5) {
          createNewCircuitScope()
        } else if (id == 6) {
          logixFunction.createSubCircuitPrompt()
        } else if (id == 7) {
          globalScope.centerFocus(false)
        }
      },
    },
  }
  </script>  