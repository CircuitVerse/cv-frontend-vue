<template>
    <div>
        <span>{{ propertyName }}</span>
        <div class="input-group">
            <div class="input-group-prepend">
                <button
                    style="border: none; min-width: 2.5rem"
                    class="btnDecrement"
                    type="button"
                    @click="decreaseValue"
                >
                    <strong>-</strong>
                </button>
            </div>
            <input
                ref="inputRef"
                style="text-align: center"
                class="objectPropertyAttribute form-control"
                :type="propertyValueType"
                :name="propertyInputName"
                :min="Number(valueMin)"
                :max="Number(valueMax)"
                :value="propertyValue"
                @input="updateValue"
            />
            <div class="input-group-append">
                <button
                    style="border: none; min-width: 2.5rem"
                    class="btnIncrement"
                    type="button"
                    @click="increaseValue"
                >
                    <strong>+</strong>
                </button>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, defineProps, defineEmits } from "vue";

const props = defineProps({
    propertyName: { type: String, default: "Property Name" },
    propertyValue: { type: Number, default: 0 },
    propertyValueType: { type: String, default: "number" },
    valueMin: { type: [String, Number], default: "0" },
    valueMax: { type: [String, Number], default: "100000000000000" },
    stepSize: { type: [String, Number], default: "1" },
    propertyInputName: { type: String, default: "Property_Input_Name" },
    propertyInputId: { type: String, default: "Property_Input_Id" },
});

const emit = defineEmits(["update:propertyValue"]);
const inputRef = ref<HTMLInputElement | null>(null);

function updateValue(event) {
    const target = event.target as unknown as HTMLInputElement;
    emit("update:propertyValue", Number(target.value));
}

function increaseValue() {
    if (!inputRef.value) return;
    let value = Number(inputRef.value.value) || 0;
    const step = Number(props.stepSize) || 1;
    const max = Number(props.valueMax);

    if (value + step <= max) {
        value += step;
        emit("update:propertyValue", value);
    }
}

function decreaseValue() {
    if (!inputRef.value) return;
    let value = Number(inputRef.value.value) || 0;
    const step = Number(props.stepSize) || 1;
    const min = Number(props.valueMin);

    if (value - step >= min) {
        value -= step;
        emit("update:propertyValue", value);
    }
}
</script>
