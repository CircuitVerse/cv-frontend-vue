<template>
    <div id="contextMenu" @contextmenu.prevent>
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

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import undo from '../../simulator/src/data/undo'
import { paste } from '../../simulator/src/events'
import { deleteSelected } from '../../simulator/src/ux'
import { createNewCircuitScope } from '../../simulator/src/circuit'
import logixFunction from '../../simulator/src/data'

const contextMenuOptions = [
    'Copy',
    'Cut',
    'Paste',
    'Delete',
    'Undo',
    'New Circuit',
    'Insert Subcircuit',
    'Center Focus',
] as const

const menuEl = ref<HTMLElement | null>(null)
const visible = ref(false)

function hideContextMenu() {
    if (!menuEl.value) return
    menuEl.value.style.opacity = '0'
    setTimeout(() => {
        if (!menuEl.value) return
        menuEl.value.style.visibility = 'hidden'
        visible.value = false
    }, 200)
}

function menuItemClicked(index: number) {
    hideContextMenu()
    switch (index) {
        case 0: document.execCommand('copy'); break
        case 1: document.execCommand('cut'); break
        case 2: paste(localStorage.getItem('clipboardData')); break
        case 3: deleteSelected(); break
        case 4: undo(); break
        case 5: createNewCircuitScope(); break
        case 6: logixFunction.createSubCircuitPrompt(); break
        case 7: (window as any).globalScope?.centerFocus(false); break
    }
}

onMounted(() => {
    menuEl.value = document.getElementById('contextMenu')
    hideContextMenu()
})
</script>
