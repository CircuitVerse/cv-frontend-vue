<template>
    <li class="dropdown nav-dropdown">
        <a
            href="#"
            class=""
            data-toggle="dropdown"
            role="button"
            aria-haspopup="true"
            aria-expanded="false"
            @click="toggleDropdown"
        >
            {{ $t('simulator.nav.' + navbarItem.text + '.heading') }}
            <span></span>
        </a>

        <DropDown
            :list-items="navbarItem.dropdownItems"
            :drop-down-header="navbarItem.text"
            drop-down-type="navLink"
        />
    </li>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import DropDown from '@/Dropdown/DropDown.vue';

const props = defineProps({
  navbarItem: { type: Object, default: () => {} },
});

const isDropdownOpen = ref(false);

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;

  const navbar = document.querySelector('.navbar');
  const tabsBar = document.getElementById('tabsBar');
  let isTabsBarExpaned = !tabsBar.classList.contains('maxHeightStyle')

  if (!isDropdownOpen.value && !isTabsBarExpaned) {
      navbar.style.zIndex = '';
      tabsBar.style.zIndex = '';
  } else {
      navbar.style.zIndex = '103';
      tabsBar.style.zIndex = '102';
  }
};

const handleDocumentClick = (event) => {
  const dropdownElements = Array.from(document.querySelectorAll('.nav-dropdown a'));

  const tabsBarToggleButton = document.querySelector('.tabsbar-toggle');
  let istabsBarToggleClicked = tabsBarToggleButton?.contains(event.target);

  const isClickInsideDropdown = dropdownElements.some((dropdownElement) => {
    return dropdownElement.contains(event.target);
  });

  if (!isClickInsideDropdown) {
    isDropdownOpen.value = false;

    if(istabsBarToggleClicked) return;

    const navbar = document.querySelector('.navbar');
    const tabsBar = document.getElementById('tabsBar');
    let isTabsBarExpaned = !tabsBar.classList.contains('maxHeightStyle')

    if (!isDropdownOpen.value && !isTabsBarExpaned) {
        navbar.style.zIndex = '';
        tabsBar.style.zIndex = '';
    } 
  }
}

onMounted(() => {
  window.addEventListener('click', handleDocumentClick);
});

onBeforeUnmount(() => {
  window.removeEventListener('click', handleDocumentClick);
});

</script>

<style scoped>
/* @import url("./NavbarLink.css"); */
</style>
