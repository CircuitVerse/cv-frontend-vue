<template>
    <p>
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
                style="text-align: center"
                class="objectPropertyAttribute form-control"
                :type="propertyValueType"
                :name="propertyInputName"
                :min="valueMin"
                :max="valueMax"
                :value="propertyValue"
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
    </p>
</template>

<script lang="ts" setup>
import { defineProps, PropType } from 'vue'

const props = defineProps({
    propertyName: { type: String, default: 'Property Name' },
    propertyValue: { type: Number, default: 0 },
    propertyValueType: { type: String, default: 'number' },
    valueMin: { type: Number, default: 0 },
    valueMax: { type: Number, default: 100000000000000 },
    stepSize: { type: Number, default: 1 },
    propertyInputName: { type: String, default: 'Property_Input_Name' },
    propertyInputId: { type: String, default: 'Property_Input_Id' },
})

// can be modified if required
function increaseValue(): void {
  const ele = document.getElementById(props.propertyInputId) as HTMLInputElement | null
  if (ele) {
    let value = parseInt(ele.value, 10)
    let step = parseInt(props.stepSize.toString(), 10)
    value = isNaN(value) ? 0 : value
    step = isNaN(step) ? 1 : step
    if (value + step <= props.valueMax) value = value + step
    else return
    const updatedValue = value
    ele.value = updatedValue.toString()
    // emit event with updated value
    const event = new Event('input', { bubbles: true })
    ele.dispatchEvent(event)
  }
}

function decreaseValue(): void {
  const ele = document.getElementById(props.propertyInputId) as HTMLInputElement | null
  if (ele) {
    let value = parseInt(ele.value, 10)
    let step = parseInt(props.stepSize.toString(), 10)
    value = isNaN(value) ? 0 : value
    step = isNaN(step) ? 1 : step
    if (value - step >= props.valueMin) value = value - step
    else return
    const updatedValue = value
    ele.value = updatedValue.toString()
    // emit event with updated value
    const event = new Event('input', { bubbles: true })
    ele.dispatchEvent(event)
  }
}
</script>
