<template>
    <div id="contextMenu" oncontextmenu="return false;" :class="{ hidden: !isVisible }">
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

<script lang="ts" setup>
import { ref } from 'vue'
import undo from '../../simulator/src/data/undo'
import { paste } from '../../simulator/src/events'
import { deleteSelected } from '../../simulator/src/ux'
import { createNewCircuitScope } from '../../simulator/src/circuit'
import logixFunction from '../../simulator/src/data'

const isVisible = ref(false)

const contextMenuOptions = [
    'Copy',
    'Cut',
    'Paste',
    'Delete',
    'Undo',
    'New Circuit',
    'Insert Subcircuit',
    'Center Focus',
]

const ctxPos = ref({
    x: 0,
    y: 0,
    visible: false,
})

function hideContextMenu() {
    isVisible.value = false
    ctxPos.value.visible = false
}

function menuItemClicked(event: Event) {
    hideContextMenu()
    const target = event.target as HTMLElement
    const id = parseInt(target.dataset.index || '0')
    
    switch (id) {
        case 0:
            document.execCommand('copy')
            break
        case 1:
            document.execCommand('cut')
            break
        case 2:
            // document.execCommand('paste') is restricted, using clipboardData instead
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
}
</script>

<style scoped>
.hidden {
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s, visibility 0.2s;
}

#contextMenu {
    transition: opacity 0.2s, visibility 0.2s;
}
</style>
