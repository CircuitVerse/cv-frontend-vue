<template>
  <div>
    <span>{{ propertyName }}</span>
    <div class="input-group">
      <div class="input-group-prepend">
        <button
          style="border: none; min-width: 2.5rem"
          class="btnDecrement"
          type="button"
          @click="decreaseValue()"
        >
          <strong>-</strong>
        </button>
      </div>
      <input
        :id="propertyInputId"
        ref="inputRef"
        style="text-align: center"
        class="objectPropertyAttribute form-control"
        :type="propertyValueType"
        :name="propertyInputName"
        :min="valueMin"
        :max="valueMax"
        :value="localValue"
        @change="onNativeChange"
      />
      <div class="input-group-append">
        <button
          style="border: none; min-width: 2.5rem"
          class="btnIncrement"
          type="button"
          @click="increaseValue()"
        >
          <strong>+</strong>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'

const props = defineProps({
  propertyName: { type: String, default: 'Property Name' },
  propertyValue: { type: Number, default: 0 },
  propertyValueType: { type: String, default: 'number' },
  valueMin: { type: String, default: '0' },
  valueMax: { type: String, default: '100000000000000' },
  stepSize: { type: String, default: '1' },
  propertyInputName: { type: String, default: 'Property_Input_Name' },
  propertyInputId: { type: String, default: 'Property_Input_Id' },
})

const emit = defineEmits<{
  (e: 'update:propertyValue', value: number): void
  (e: 'change', value: number): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const localValue = ref(props.propertyValue)

// Keep local value in sync when the prop changes externally
watch(() => props.propertyValue, (val) => {
  localValue.value = val
})

function clamp(value: number): number {
  const min = parseInt(props.valueMin, 10)
  const max = parseInt(props.valueMax, 10)
  return Math.min(Math.max(value, isNaN(min) ? -Infinity : min), isNaN(max) ? Infinity : max)
}

function commitValue(value: number) {
  localValue.value = value
  emit('update:propertyValue', value)
  emit('change', value)
  // Dispatch a native change event so the legacy simulator listeners still fire
  if (inputRef.value) {
    inputRef.value.value = String(value)
    inputRef.value.dispatchEvent(new Event('change'))
  }
}

function increaseValue() {
  const step = parseInt(props.stepSize, 10) || 1
  commitValue(clamp(localValue.value + step))
}

function decreaseValue() {
  const step = parseInt(props.stepSize, 10) || 1
  commitValue(clamp(localValue.value - step))
}

function onNativeChange(event: Event) {
  const raw = parseInt((event.target as HTMLInputElement).value, 10)
  if (!isNaN(raw)) commitValue(clamp(raw))
}
</script>

<style scoped>
/* Hide spinners for numeric input' */

input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}
</style>
