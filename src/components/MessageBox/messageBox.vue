<template>
    <v-dialog>
        <v-card class="messageBoxContent">
            <v-card-text>
                <!-- NOTE: Add v-ifs -->
                <p v-if="messageText" style="font-weight: bold">
                    {{ messageText }}
                </p>
                <template v-if="tableHeader.length == 0">
                    <div
                        v-for="inputItem in inputList"
                        :id="inputItem.id"
                        :key="inputItem.id"
                        :style="inputItem.style"
                        :class="inputClass"
                    >
                        <p>{{ inputItem.text }}</p>
                        <input
                            v-if="inputItem.type != 'nil'"
                            v-model="inputItem.val"
                            :class="inputItem.class"
                            :placeholder="inputItem.placeholder"
                            :type="inputItem.type"
                        />
                    </div>
                </template>
                <BooleanTable
                    v-if="tableHeader.length > 0"
                    :table-header="tableHeader"
                    :table-body="tableBody"
                />
            </v-card-text>
            <v-card-actions>
                <v-btn
                    v-for="buttonItem in buttonList"
                    :key="buttonItem.text"
                    class="messageBtn"
                    block
                    @click="
                        $emit('buttonClick', buttonItem.emitOption, circuitItem)
                    "
                >
                    {{ buttonItem.text }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
import BooleanTable from '@/DialogBox/BooleanTable.vue'
import { ref } from '@vue/reactivity'
import { onUpdated } from '@vue/runtime-core'

const props = defineProps({
    messageText: { type: String, default: '' },
    isPersistent: { type: Boolean, default: false },
    buttonList: { type: Array, default: () => [] },
    inputList: { type: Array, default: () => [] },
    inputClass: { type: String, default: '' },
    circuitItem: { type: Object, default: () => ({}) },
    tableHeader: { type: Array, default: () => [] },
    tableBody: { type: Array, default: () => [] },
})
const emit = defineEmits(['buttonClick'])
</script>

<style scoped>
.inputField {
    width: 100%;
    padding: 10px 10px;
    margin: 8px 0;
    box-sizing: border-box;
    border-radius: 5px;
    border: 1px solid #c5c5c5;
    color: white;
    outline: none;
}

.cAinput {
    width: 30%;
    padding: 0 5px;
    margin: 8px 0;
    box-sizing: border-box;
    border-radius: 5px;
    border: 1px solid #c5c5c5;
    color: white;
    outline: none;
}

.combinationalAnalysisInput:first-child {
    padding-top: 20px;
}

.combinationalAnalysisInput {
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    align-items: baseline;
}

.inputField:focus {
    border: 2px solid #c5c5c5;
}

.v-card-actions {
    width: fit-content;
    display: flex;
    flex-direction: row;
    justify-content: center;
    margin: auto;
}

.messageBoxContent {
    height: auto;
    min-width: 600px;
    justify-content: center;
    margin: auto;
    backdrop-filter: blur(5px);
    border-radius: 5px;
    border: 0.5px solid var(--br-primary) !important;
    background: var(--bg-primary-moz) !important;
    background-color: var(--bg-primary-chr) !important;
    color: white;
}

.tabsbarInput {
    align-items: center;
}

.messageBtn {
    width: fit-content;
    max-width: 100px;
    border: 1px solid #c5c5c5;
    padding: 5px 5px;
}

.messageBtn:hover {
    background: #c5c5c5;
    color: black;
}
</style>
