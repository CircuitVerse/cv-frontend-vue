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
         async menuItemClicked(index) {
            this.hideContextMenu()
            try {  
            switch (index) {
            case 0: // Copy
                if (navigator.clipboard) {
                    const text = window.getSelection().toString();
                    if (text) {
                        await navigator.clipboard.writeText(text);
                        console.log("Copied:", text);
                    } else {
                        console.warn("No text selected for copying.");
                    }
                } else {
                    console.error("Clipboard API not available.");
                }
                break;

            case 1: // Cut
                if (navigator.clipboard) {
                    const text = window.getSelection().toString();
                    if (text) {
                        await navigator.clipboard.writeText(text);
                        document.execCommand('delete'); 
                        console.log("Cut:", text);
                    } else {
                        console.warn("No text selected for cutting.");
                    }
                } else {
                    console.error("Clipboard API not available.");
                }
                break;

            case 2: // Paste
                const clipboardData = await navigator.clipboard.readText();
                if (clipboardData) {
                    paste(clipboardData);
                    console.log("Pasted:", clipboardData);
                } else {
                    console.warn("No clipboard data available.");
                }
                break;

            default:
                console.warn("No action defined for this menu option.");
        }
    } catch (error) {
        console.error("Error executing menu action:", error);
    }
}
        },
    },
}
</script>
