<template>
    <messageBox
        v-model="promptStore.prompt.changeProjectName"
        :messageText="promptStore.prompt.messageText"
        :isPersistent="promptStore.prompt.isPersistent"
        :buttonList="promptStore.prompt.buttonList"
        :inputList="promptStore.prompt.inputList"
        input-class="saveInput"
        @buttonClick="(selectedOption) => confirmName(selectedOption)"
    />
</template>

<script lang="ts" setup>
import messageBox from '#/components/MessageBox/messageBox.vue'
import { usePromptStore } from '#/store/promptStore'
import { confirmName } from '#/helpers/promptComponent/ts/confirm'

const promptStore = usePromptStore()
</script>
