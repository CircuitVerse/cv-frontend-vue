<template>
    <div id="simulationArea">
        <Navbar />
        <ContextMenu />
        <Extra />
        <Helper />
    </div>
</template>

<script setup lang="ts">
import Navbar from '@/Navbar/Navbar.vue'
import ContextMenu from '@/ContextMenu/ContextMenu.vue'
import Extra from '@/Extra.vue'
import { defineComponent, onMounted, nextTick } from 'vue'
import { setup as setupSimulator } from '../simulator/src/setup'
import Helper from '#/components/helpers/Helper.vue'

defineComponent({
    components: {
        Navbar,
        ContextMenu,
        Extra,
    },
})

onMounted(async () => {
    await nextTick()
    setupSimulator()
})
</script>
