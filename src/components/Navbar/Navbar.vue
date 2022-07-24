<template>
    <nav class="navbar navbar-expand-lg navbar-dark header">
        <Logo :cvlogo="navbarLogo" />
        <Hamburger v-if="showSidebar" />

        <div id="bs-example-navbar-collapse-1" class="collapse navbar-collapse">
            <NavbarLinks :navbar-data="navbarData" />

            <span
                id="projectName"
                class="projectName noSelect defaultCursor font-weight-bold"
            >
                Untitled
            </span>
            <User
                :is-user-signed-in="isUserSignedIn"
                :user-data="userDropdownItems"
            />
        </div>
    </nav>
    <QuickButton />
</template>

<script lang="ts" setup>
import QuickButton from './QuickButton/QuickButton.vue'
import User from './User/User.vue'
import NavbarLinks from './NavbarLinks/NavbarLinks.vue'

import navbarData from './NavbarData.json'
import userDropdownItems from './UserData.json'

import Logo from '../Logo/Logo.vue'
import Hamburger from './Hamburger/Hamburger.vue'
import { ref } from '@vue/reactivity'
import { onMounted } from '@vue/runtime-core'

const navbarLogo = ref('logo')
const minWidthToShowSidebar = ref(992)
const isUserSignedIn = ref(false)
const showSidebar = ref(false)
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
/* @import './Navbar.css'; */
</style>
