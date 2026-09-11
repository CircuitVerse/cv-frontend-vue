<template>
  <div v-if="store.isHoverVisible" class="alert alert-danger">
    The element has been restricted by mentor. Usage might lead to deduction in marks.
  </div>
  <div v-if="usedElements.length > 0" id="restrictedElementsDiv" class="alert alert-danger">
    <span style="font-style: italic">Restricted elements used: </span>
    <span>{{ store.usedElements.join(', ') || 'None' }}</span>
  </div>
</template>

<script lang="ts" setup>
import { useRestrictedElementStore } from '#/store/restrictedElementStore'
import { computed } from 'vue'

const store = useRestrictedElementStore()
const usedElements = computed(() => store.usedElements)
</script>
