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
import { defineComponent, onMounted, onUnmounted } from 'vue'
import { setup as setupSimulator, stopSimulator } from '../simulator/src/setup'
import Helper from '#/components/helpers/Helper.vue'

defineComponent({
    components: {
        Navbar,
        ContextMenu,
        Extra,
    },
})

onMounted(() => {
    setupSimulator()
})

onUnmounted(() => {
    stopSimulator()
})
</script>
