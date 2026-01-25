<template>
    <Embed v-if="isEmbed" />
    <router-view v-else />
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import Embed from './pages/embed.vue'

const isEmbed = computed(() => (window as any).embed === true)
</script>
