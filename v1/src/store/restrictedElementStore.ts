import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useRestrictedElementStore = defineStore('restrictedElement', () => {
  const isHoverVisible = ref(false)
  const usedElements = ref<string[]>([])

  return { isHoverVisible, usedElements }
})
