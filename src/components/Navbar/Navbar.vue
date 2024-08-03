<template>
    <nav class="navbar navbar-expand-lg navbar-dark header">
        <Logo :cvlogo="navbarLogo" />
        <!-- <Hamburger v-if="showSidebar" /> -->
        <Hamburger2 v-if="showSidebar" :navbar-data="navbarData" />

        <div
            v-else
            id="bs-example-navbar-collapse-1"
            class="collapse navbar-collapse"
        >
            <NavbarLinks :navbar-data="navbarData" />

            <span
                id="projectName"
                class="projectName noSelect defaultCursor font-weight-bold"
            >
                {{ projectStore.getProjectName }}
            </span>
            <!-- <User :user-data="userDropdownItems" /> -->
            <UserMenu class="useMenuBtn" />
        </div>
    </nav>
    <QuickButton />
</template>

<script lang="ts" setup>
import QuickButton from '@/Navbar/QuickButton/QuickButton.vue'
import User from '@/Navbar/User/User.vue'
import UserMenu from './User/UserMenu.vue'
import NavbarLinks from '@/Navbar/NavbarLinks/NavbarLinks.vue'

import navbarData from '#/assets/constants/Navbar/NAVBAR_DATA.json'
import userDropdownItems from '#/assets/constants/Navbar/USER_DATA.json'

import Logo from '@/Logo/Logo.vue'
import Hamburger from '@/Navbar/Hamburger/Hamburger.vue'
import Hamburger2 from './Hamburger/Hamburger2.vue'
import { ref, onMounted } from 'vue'
import { useProjectStore } from '#/store/projectStore'

const navbarLogo = ref('logo')
const minWidthToShowSidebar = ref(992)
const showSidebar = ref(false)
const projectStore = useProjectStore()
showSidebar.value =
    window.innerWidth < minWidthToShowSidebar.value ? true : false
onMounted(() => {
    window.addEventListener('resize', checkShowSidebar)
})
function checkShowSidebar() {
    showSidebar.value =
        window.innerWidth < minWidthToShowSidebar.value ? true : false
}
</script>

<style scoped>
@import './Navbar.css';

.useMenuBtn {
    margin: 0 2rem 0 auto;
}
</style>
