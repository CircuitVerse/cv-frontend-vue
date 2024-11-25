<template>
    <div id="simulatorContainer">
        <Navbar />
        <ContextMenu />
        <Extra />
        <Helper />
        <canvas 
            id="simulationArea"
            ref="simulationCanvas"
            class="simulation-canvas"
        ></canvas>
    </div>
</template>

<script setup lang="ts">
import Navbar from '@/Navbar/Navbar.vue'
import ContextMenu from '@/ContextMenu/ContextMenu.vue'
import Extra from '@/Extra.vue'
import { defineComponent, onMounted, nextTick, ref } from 'vue'
import { setup as setupSimulator } from '../simulator/src/setup'
import Helper from '#/components/helpers/Helper.vue'

const simulationCanvas = ref<HTMLCanvasElement | null>(null)

onMounted(async () => {
    await nextTick()
    if (simulationCanvas.value) {
        const ctx = simulationCanvas.value.getContext('2d')
        if (ctx) {
            setupSimulator()
        }
    }
})
</script>

<style scoped>
.simulation-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}
</style>
