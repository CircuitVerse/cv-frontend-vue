<template>
    <messageBox
        v-model="projectStore.CreateProjectHelper.changeProjectName"
        :messageText="projectStore.CreateProjectHelper.messageText"
        :isPersistent="projectStore.CreateProjectHelper.isPersistent"
        :buttonList="projectStore.CreateProjectHelper.buttonList"
        :inputList="projectStore.CreateProjectHelper.inputList"
        input-class="saveInput"
        @buttonClick="(selectedOption) => confirmName(selectedOption)"
    />
</template>

<script lang="ts" setup>
import messageBox from '../MessageBox/messageBox.vue'
import { useProjectStore } from '#/store/projectStore'
import { confirmName } from './ProjectNameSetHelper'

const projectStore = useProjectStore()
</script>

<style scoped></style>
