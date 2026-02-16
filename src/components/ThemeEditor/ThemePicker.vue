<template>
  <div class="theme-picker">
    <h4 id="themes-label">Default Themes</h4>
    <select v-model="selected" aria-labelledby="themes-label">
      <option disabled value="">Select theme</option>
      <option v-for="(t, name) in themes" :key="name" :value="name">{{ name }}</option>
    </select>
    <div style="margin-top:8px; display:flex; gap:8px">
      <button @click="applySelected" :disabled="!selected">Apply</button>
      <button @click="importSelected" :disabled="!selected">Import to Saved</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import themeEditor from "#/plugins/themeEditor"

const themes = themeEditor.getDefaultThemes()
const selected = ref("")

function applySelected() {
  if (!selected.value) return
  themeEditor.applyDefaultTheme(selected.value)
}

function importSelected() {
  if (!selected.value) return
  const t = themes[selected.value]
  if (!t) return
  // Save under the same name (overwrite if exists)
  themeEditor.saveTheme(selected.value, t)
}
</script>

<style scoped>
.theme-picker { margin-bottom: 8px }
select { width: 100% }
</style>
