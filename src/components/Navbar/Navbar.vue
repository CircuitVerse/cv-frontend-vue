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
                {{ projectStore.getProjectName }}
            </span>
            <User :user-data="userDropdownItems" />
        </div>
    </nav>
    <QuickButton />
</template>

<script lang="ts" setup>
import QuickButton from '@/Navbar/QuickButton/QuickButton.vue'
import User from '@/Navbar/User/User.vue'
import NavbarLinks from '@/Navbar/NavbarLinks/NavbarLinks.vue'

import navbarData from '#/assets/constants/Navbar/NAVBAR_DATA.json'
import userDropdownItems from '#/assets/constants/Navbar/USER_DATA.json'

import Logo from '@/Logo/Logo.vue'
import Hamburger from '@/Navbar/Hamburger/Hamburger.vue'
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

<style>
.navbar .nav.pull-right {
    float: right;
    margin-right: 10px;
    min-width: 85px;
}

@media (max-width: 991px) {
    .navbar .nav.pull-right {
        display: none;
    }
}
</style>

<style scoped>
@import './Navbar.css';

.navbar {
    transition: background 0.5s ease-out;
}

.projectName {
    position: relative;
    left: 0.5rem;
    font-size: 1em;
    text-align: center;
    display: inline-block;
    width: 35vw;
    overflow: hidden;
    text-overflow: ellipsis;
}

@media (max-width: 991px) {
    .projectName {
        visibility: hidden;
    }
}
</style>
