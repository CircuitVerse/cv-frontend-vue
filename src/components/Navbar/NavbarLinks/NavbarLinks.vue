<template>
    <ul
        v-for="navbarItem in navbarData"
        id="toolbar"
        :key="navbarItem.id"
        class="navbar-nav navbar-menu noSelect pointerCursor"
    >
        <NavbarLink :navbar-item="navbarItem" />
    </ul>
</template>

<script lang="ts" setup>
import NavbarLink from '@/Navbar/NavbarLinks/NavbarLink/NavbarLink.vue'

const props = defineProps({
    navbarData: { type: Array, default: () => [] },
})
</script>

<style>
.navbar-menu > li > a {
    border: 1px solid transparent;
    border-radius: 1px;
    padding: 2px 8px;
    transition: all 0.2s ease-in-out;
    margin-right: 10px;
}

.navbar-menu > li > a:hover {
    border-bottom: 1px solid white;
    text-decoration: none;
}
</style>

<style scoped>
/* @import url('./NavbarLinks.css'); */

.navbar-menu {
    position: relative;
    transition: all 0.2s ease-in-out;
}
</style>
