<template>
    <Navbar />
    <ContextMenu />
    <Extra />
</template>

<script setup lang="ts">
import Navbar from '@/Navbar/Navbar.vue'
import ContextMenu from '@/ContextMenu/ContextMenu.vue'
import Extra from '@/Extra.vue'
import { defineComponent, onMounted } from 'vue'
import { setup as setupSimulator } from '../simulator/src/setup'

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
</script>
