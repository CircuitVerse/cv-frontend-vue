<template>
    <nav v-if="!simulatorMobileStore.showMobileView" class="navbar navbar-expand-lg navbar-dark header">
        <Logo :cvlogo="navbarLogo" />

        <div
            v-if="!simulatorMobileStore.showMobileView"
            id="bs-example-navbar-collapse-1"
            class="collapse navbar-collapse"
        >
            <NavbarLinks :navbar-data="navbarData" />

            <span
                id="projectName"
                class="projectName noSelect font-weight-bold"
                :class="{ 'defaultCursor': !isEditing }"
                @click="startEditing"
            >
                <input
                    v-if="isEditing"
                    v-model="editedProjectName"
                    @blur="finishEditing"
                    @keyup.enter="finishEditing"
                    ref="projectNameInput"
                    class="project-name-input"
                />
                <span v-else>{{ projectStore.getProjectName }}</span>
            </span>
            <UserMenu class="useMenuBtn" />
        </div>
    </nav>
    <QuickButton v-if="!simulatorMobileStore.showMobileView" />
</template>

<script lang="ts" setup>
import { ref, onMounted, nextTick } from 'vue'
import QuickButton from '@/Navbar/QuickButton/QuickButton.vue'
import NavbarLinks from '@/Navbar/NavbarLinks/NavbarLinks.vue'
import { useSimulatorMobileStore } from '#/store/simulatorMobileStore'
import navbarData from '#/assets/constants/Navbar/NAVBAR_DATA.json'
import Logo from '@/Logo/Logo.vue'
import UserMenu from './User/UserMenu.vue'
import { useProjectStore } from '#/store/projectStore'

const navbarLogo = ref('logo')
const projectStore = useProjectStore()
const simulatorMobileStore = useSimulatorMobileStore()

const isEditing = ref(false)
const editedProjectName = ref('')
const projectNameInput = ref<HTMLInputElement | null>(null)

const startEditing = () => {
    isEditing.value = true
    editedProjectName.value = projectStore.getProjectName
    nextTick(() => {
        projectNameInput.value?.focus()
    })
}

const finishEditing = () => {
    isEditing.value = false
    if (editedProjectName.value.trim() !== '') {
        projectStore.setProjectName(editedProjectName.value.trim())
    }
}
</script>

<style scoped>
@import './Navbar.css';

.useMenuBtn {
    margin: 0 2rem 0 auto;
}

.project-name-input {
    background: transparent;
    border: none;
    border-bottom: 1px solid white;
    color: white;
    font-weight: bold;
    outline: none;
    width: 200px;
}
</style>