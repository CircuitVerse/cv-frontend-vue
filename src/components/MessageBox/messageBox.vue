<template>
    <v-dialog :persistent="isPersistent">
        <v-card class="messageBoxContent">
            <v-card-text>
                {{ messageText }}
                <div
                    v-for="inputItem in inputList"
                    :key="inputItem"
                    class="inputContent"
                >
                    <p>{{ inputItem }}</p>
                    <input class="inputField" v-model="inputVal" type="text" />
                </div>
            </v-card-text>
            <v-card-actions>
                <v-btn
                    v-for="buttonItem in buttonList"
                    :key="buttonItem.text"
                    class="messageBtn"
                    block
                    @click="
                        $emit(
                            'buttonClick',
                            buttonItem.emitOption,
                            circuitItem,
                            inputVal
                        )
                    "
                >
                    {{ buttonItem.text }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
import { ref } from '@vue/reactivity'
const inputVal = ref('')
inputVal.value = 'Untitled-Circuit'

const props = defineProps({
    messageText: { type: String, default: '' },
    isPersistent: { type: Boolean, default: false },
    buttonList: { type: Array, default: undefined },
    inputList: { type: Array, default: undefined },
    circuitItem: { type: Object, default: undefined },
})
const emit = defineEmits(['buttonClick'])
console.log(props.inputList)
</script>

<style scoped>
.messageBoxContent {
    height: auto;
    min-width: 500px;
    justify-content: center;
    margin: auto;
    backdrop-filter: blur(5px);
    border-radius: 5px;
    border: 0.5px solid var(--br-primary) !important;
    background: var(--bg-primary-moz) !important;
    background-color: var(--bg-primary-chr) !important;
    color: white;
}

.inputContent {
    align-items: center;
}

.inputField {
    width: 100%;
    padding: 10px 10px;
    margin: 8px 0;
    box-sizing: border-box;
    border: 2px solid #c5c5c5;
    color: #c5c5c5;
    outline: none;
}

.messageBtn {
    width: fit-content;
    border: 1px solid #c5c5c5;
    padding: 5px 5px;
}
.messageBtn:hover {
    background: #c5c5c5;
    color: black;
}

.v-card-actions {
    width: fit-content;
    display: flex;
    flex-direction: row;
    justify-content: center;
    margin: auto;
}

.v-field__field {
    padding: 5px 0 !important;
}
.v-input__details {
    display: none;
}
</style>
