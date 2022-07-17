<template>
    <li class="dropdown nav-dropdown">
        <a
            href="#"
            class=""
            data-toggle="dropdown"
            role="button"
            aria-haspopup="true"
            aria-expanded="false"
            >{{ navbarItem.text }}<span></span>
        </a>

        <DropDown
            :list-items="navbarItem.dropdownItems"
            drop-down-type="navLink"
        />
    </li>
</template>

<script lang="ts" setup>
import DropDown from '../../../Dropdown/DropDown.vue'

const props = defineProps({
    navbarItem: { type: Object, default: {} },
})
</script>

<style scoped>
/* @import url("./NavbarLink.css"); */
</style>
