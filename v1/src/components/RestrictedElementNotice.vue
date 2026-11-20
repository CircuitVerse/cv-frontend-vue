<template>
  <div v-if="store.isHoverVisible" class="alert alert-danger">
    {{ $t('simulator.restricted_element_notice') }}
  </div>
  <div v-if="usedElements.length > 0" id="restrictedElementsDiv" class="alert alert-danger">
    <span style="font-style: italic">{{ $t('simulator.restricted_elements_used') }} </span>
    <span>{{ usedElements.join(', ') }}</span>
  </div>
</template>

<script lang="ts" setup>
import { useRestrictedElementStore } from '#/store/restrictedElementStore'
import { computed } from 'vue'

const store = useRestrictedElementStore()
const usedElements = computed(() => store.usedElements)
</script>
