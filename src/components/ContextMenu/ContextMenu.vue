<template>
    <div id="contextMenu" @contextmenu.prevent>
        <ul>
            <li
                v-for="(menuOption, index) in contextMenuOptions"
                :key="index"
                @click="menuItemClicked(index)"
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
            },
        }
    },

    // Lifecycle hook on mounted - dont initially display the context menu
    mounted() {
        this.hideContextMenu()
    },
    methods: {
        hideContextMenu() {
            const el = document.querySelector('#contextMenu')
            el.style.opacity = '0'
            setTimeout(() => {
                el.style.visibility = 'hidden'
                this.ctxPos.visible = false
            }, 200) // Hide after 2 sec
        },
        menuItemClicked(id) {
            this.hideContextMenu()
            switch (id) {
                case 0:
                    document.execCommand('copy')
                    break
                case 1:
                    document.execCommand('cut')
                    break
                case 2:
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
                    globalScope.centerFocus(false)
                    break
            }
        },
    },
}
</script>
