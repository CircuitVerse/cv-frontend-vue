<template>
    <div id="contextMenu" oncontextmenu="return false;">
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
import { nextTick } from 'vue'
import undo from '../../simulator/src/data/undo'
import { paste } from '../../simulator/src/events'
import { deleteSelected } from '../../simulator/src/ux'
import { createNewCircuitScope } from '../../simulator/src/circuit'
import logixFunction from '../../simulator/src/data'
import { globalScope } from '../../simulator/src/scope' 

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
            },
        }
    },

    // Lifecycle hook on mounted - dont initially display the context menu
    mounted() {
        this.hideContextMenu()
    },
    methods: {
       async hideContextMenu() {
            const el = document.getElementById('contextMenu')
            if(el){
            el.style.opacity='0'
            await nextTick()
                el.style.visibility = 'hidden'
                this.ctxPos.visible = false
                }
        },
        menuItemClicked(event) {
            this.hideContextMenu()
            const id = parseInt(event.target.dataset.index,10)
            if (isNaN(id)) {
              console.warn(`[ContextMenu] Invalid menu option: ${event.target.dataset.index}`)
            return
             }
            switch (id) {
              case 0:
                document.execCommand('copy')
                break
            case 1:
                document.execCommand('cut')
                break
              case 2:
              // document.execCommand('paste'); it is restricted to sove this problem we use dataPasted variable
                paste(localStorage.getItem('clipboardData'))
                break
          case 3:
                deleteSelected()
                break
            case 4:
                undo()
                break
           case 5:
                createNewCircuitScope()
                break
            case 6:
                logixFunction.createSubCircuitPrompt()
                break
            case 7:
                  if (globalScope && typeof globalScope.centerFocus === 'function') {
                        globalScope.centerFocus(false)
                    } else {
                        console.warn(`[ContextMenu] globalScope.centerFocus is not available.`)
                    }
                break
                default:
                console.warn(`[ContextMenu] Unknown menu option selected: ${id}`)
        }
    },
}
</script>
