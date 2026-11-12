<template>
    <Navbar />
    <ContextMenu />
    <Extra />
    <Helper />
</template>

<script setup lang="ts">
import Navbar from '@/Navbar/Navbar.vue'
import ContextMenu from '@/ContextMenu/ContextMenu.vue'
import Extra from '@/Extra.vue'
import { defineComponent, onMounted } from 'vue'
import { setup as setupSimulator } from '../simulator/src/setup'
import Helper from '#/components/helpers/Helper.vue'
import { useSimulatorShortcuts } from '#/composables/useSimulatorShortcuts'
import { useSimulatorClipboard } from '#/composables/useSimulatorClipboard'
import { useTauriSimulatorCommands } from '#/composables/useTauriSimulatorCommands'

defineComponent({
    components: {
        Navbar,
        ContextMenu,
        Extra,
    },
})

// Global keyboard, clipboard and desktop-menu bindings live for the
// lifetime of the simulator page.
useSimulatorShortcuts()
useSimulatorClipboard()
useTauriSimulatorCommands()

onMounted(() => {
    setupSimulator()
})
</script>
