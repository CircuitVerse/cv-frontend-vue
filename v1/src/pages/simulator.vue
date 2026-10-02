<template>
    <div class="simulator-layout">
        <Navbar />
        <div class="simulator-extra">
            <Extra />
        </div>
    </div>
    <ContextMenu />
    <Helper />
</template>

<script setup lang="ts">
import Navbar from '@/Navbar/Navbar.vue'
import ContextMenu from '@/ContextMenu/ContextMenu.vue'
import Extra from '@/Extra.vue'
import { defineComponent, onMounted } from 'vue'
import { setup as setupSimulator } from '../simulator/src/setup'
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
</script>

<style scoped>
.simulator-layout {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
}

.simulator-extra {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    position: relative;
}
</style>
