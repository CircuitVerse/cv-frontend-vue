<template>
    <messageBox
        v-model="promptStore.confirm.activate"
        :messageText="promptStore.confirm.messageText"
        :isPersistent="promptStore.confirm.isPersistent"
        :buttonList="promptStore.confirm.buttonList"
        @buttonClick="(selectedOption) => confirmation(selectedOption)"
    />
</template>

<script lang="ts" setup>
import messageBox from '#/components/MessageBox/messageBox.vue'
import { usePromptStore } from '#/store/promptStore'

const promptStore = usePromptStore()

function confirmation(selectedOption: string | boolean): void {
    promptStore.confirm.activate = false
    for (const button of promptStore.confirm.buttonList) {
        if (button.emitOption === selectedOption) {
            promptStore.resolvePromise(button.emitOption)
        }
    }
}
</script>
