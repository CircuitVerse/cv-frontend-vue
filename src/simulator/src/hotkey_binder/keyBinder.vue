<template>
  <div v-if="showDialog" class="custom-shortcut-dialog">
    <div class="dialog-content">
      <h2>Custom Shortcuts</h2>

      <div class="key-bindings">
        <div v-for="(binding, key) in keyBindings" :key="key" class="binding-row">
          <label>{{ key }}</label>
          <div class="preference" @click="startEditing(key.toString())">
            {{ binding.custom || binding.default }}
          </div>
        </div>
      </div>

      <div v-if="editingKey" class="edit-panel">
        <p>Press your desired key combination</p>
        <div class="key-display">
          {{ pressedKeys.join(' + ') }}
          <span v-if="warning" class="warning">{{ warning }}</span>
        </div>
        <div class="dialog-actions">
          <button @click="cancelEdit">Cancel</button>
          <button @click="saveBinding">Save</button>
        </div>
      </div>

      <div class="dialog-footer">
        <button @click="resetToDefault">Reset to Default</button>
        <button @click="closeDialog">Close</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, watch, Ref, onUnmounted } from 'vue'
import { checkRestricted } from './model/utils'
import { KeyCode } from './model/normalize/normalizer.plugin.js'
import { KeyBindings } from './keyBinding.types';

export default defineComponent({
  name: 'KeyBinder',
  setup() {
    const showDialog = ref<boolean>(false)
    const editingKey = ref<string | null>(null)
    const pressedKeys = ref<string[]>([])
    const warning = ref<string>('')

    const keyBindings = reactive<KeyBindings>(
      +  (() => {
        try {
          const stored = localStorage.getItem('userKeys');
          return stored ? JSON.parse(stored) : {
            togglePanel: { default: 'Ctrl+P', custom: '' },
            saveFile: { default: 'Ctrl+S', custom: '' }
          };
        } catch (e) {
          console.error('Failed to parse stored key bindings:', e);
          return {
            togglePanel: { default: 'Ctrl+P', custom: '' },
            saveFile: { default: 'Ctrl+S', custom: '' }
          };
        }
      })()
    )

    watch(keyBindings, (newVal: KeyBindings) => {
      localStorage.setItem('userKeys', JSON.stringify(newVal))
    })

    const startEditing = (key: string): void => {
      editingKey.value = key
      pressedKeys.value = []
      warning.value = ''
      window.addEventListener('keydown', handleKeyDown)
    }

    const handleKeyDown = (e: KeyboardEvent): void => {
      e.preventDefault()
      const key = KeyCode.hot_key(KeyCode.translate_event(e))

      if (key === 'Escape') {
        cancelEdit()
        return
      }

      if (key === 'Enter') {
        saveBinding()
        return
      }

      if (checkRestricted(key)) {
        warning.value = 'Restricted system shortcut'
        return
      }

      const keys = [...new Set([...pressedKeys.value, key])]
        .sort((a, b) => a.localeCompare(b))

      pressedKeys.value = keys
    }

    const saveBinding = (): void => {
      if (pressedKeys.value.length === 0) {
        warning.value = 'Please enter some keys'
        return
      }

      if (editingKey.value) {
        keyBindings[editingKey.value].custom = pressedKeys.value.join(' + ')
      }
      cancelEdit()
    }

    const cancelEdit = (): void => {
      editingKey.value = null
      pressedKeys.value = []
      window.removeEventListener('keydown', handleKeyDown)
    }

    onUnmounted(() => {
        window.removeEventListener('keydown', handleKeyDown);
      })

    const resetToDefault = (): void => {
      if (confirm('Reset all to default?')) {
        Object.keys(keyBindings).forEach(key => {
          keyBindings[key].custom = ''
        })
      }
    }

    const closeDialog = (): void => {
      showDialog.value = false
    }

    return {
      showDialog,
      editingKey,
      pressedKeys,
      warning,
      keyBindings,
      startEditing,
      saveBinding,
      cancelEdit,
      resetToDefault,
      closeDialog
    }
  }
})
</script>

<style scoped>
.custom-shortcut-dialog {
  position: fixed;
  /* Add more dialog styling */
}

.key-display {
  border: 1px solid #ccc;
  padding: 8px;
  margin: 10px 0;
}

.warning {
  color: red;
  margin-left: 10px;
}
</style>
