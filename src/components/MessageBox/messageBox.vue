<template>
    <v-dialog :persistent="isPersistent" @after-enter="focusFirstInput">
        <v-card ref="messageBoxCard" class="messageBoxContent">
            <form @submit.prevent="handlePrimaryAction">
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
                        :type="
                            buttonItem.emitOption === props.buttonList[0]?.emitOption
                                ? 'submit'
                                : 'button'
                        "
                        @click="handleButtonClick(buttonItem)"
                    >
                        {{ buttonItem.text }}
                    </v-btn>
                </v-card-actions>
            </form>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
import BooleanTable from '@/DialogBox/BooleanTable.vue'
import { ref } from 'vue'

const emit = defineEmits(['buttonClick'])

const props = defineProps({
    messageText: { type: String, default: '' },
    isPersistent: { type: Boolean, default: false },
    buttonList: {
        type: Array<{
            text: string
            emitOption: string | boolean
        }>, default: () => []
    },
    inputList: {
        type: Array<{
            text: string
            val: string
            placeholder: string
            id: string
            class: string
            style: string
            type: string
        }>, default: () => []
    },
    inputClass: { type: String, default: '' },
    circuitItem: { type: Object, default: () => ({}) },
    tableHeader: { type: Array, default: () => [] },
    tableBody: { type: Array, default: () => [] },
})

const messageBoxCard = ref(null)

function focusFirstInput(): void {
    const firstField = (messageBoxCard.value as any)?.$el?.querySelector('input')
    firstField?.focus()
}

function handlePrimaryAction(): void {
    const primaryButton = props.buttonList[0]

    if (!primaryButton) {
        return
    }

    emit('buttonClick', primaryButton.emitOption, props.circuitItem)
}

function handleButtonClick(buttonItem: { emitOption: string | boolean }): void {
    if (buttonItem.emitOption === props.buttonList[0]?.emitOption) {
        return
    }

    emit('buttonClick', buttonItem.emitOption, props.circuitItem)
}
</script>

<style scoped></style>
