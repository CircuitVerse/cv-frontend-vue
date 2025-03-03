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
    const value = Number(target.value);
    if (isNaN(value)) {
        // Reset to previous valid value or min value
        emit("update:propertyValue", props.propertyValue || Number(props.valueMin));
        return;
    }
    const min = Number(props.valueMin);
    const max = Number(props.valueMax);
    if (value < min) {
        emit("update:propertyValue", min);
    } else if (value > max) {
        emit("update:propertyValue", max);
    } else {
        emit("update:propertyValue", value);
    }
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
