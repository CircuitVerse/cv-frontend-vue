<template>
    <div id="contextMenu" oncontextmenu="return false;" v-show="ctxPos.visible" :style="contextMenuStyle">
        <ul>
            <li
                v-for="(menuOption, index) in contextMenuOptions"
                :key="index"
                :data-index="index"
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
                visible: false,
            },
        }
    },
    computed: {
        contextMenuStyle() {
            return {
                opacity: this.ctxPos.visible ? '1' : '0',
                visibility: this.ctxPos.visible ? 'visible' : 'hidden',
                transition: 'opacity 0.2s ease-in-out',
            };
        },
    },

    // Lifecycle hook on mounted - dont initially display the context menu
    mounted() {
        this.hideContextMenu()
    },
    methods: {
        hideContextMenu() {
             this.ctxPos.visible = false;
        },
        showContextMenu() {
            this.ctxPos.visible = true;
        },
        menuItemClicked(index) {
            this.hideContextMenu()
           const actions = [
                () => document.execCommand('copy'),
                () => document.execCommand('cut'),
                () => paste(localStorage.getItem('clipboardData')),
                deleteSelected,
                undo,
                createNewCircuitScope,
                logixFunction.createSubCircuitPrompt,
                () => globalScope.centerFocus(false),
            ];
            if (actions[index]) actions[index]();
            
        },
    },
}
</script>
