<template>
  <a href="/">
    <span :class="cvlogo"></span>
  </a>
</template>

<script setup lang="ts">
interface Props {
  cvlogo?: string;
}

withDefaults(defineProps<Props>(), {
  cvlogo: "logo",
});
</script>

<style scoped>
/* @import url('./Logo.css'); */
</style>
