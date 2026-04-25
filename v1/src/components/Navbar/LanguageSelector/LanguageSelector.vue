<template>
  <v-menu open-on-hover location="bottom" v-model="menuButtonIsActive">
    <template v-slot:activator="{ props }">
      <v-btn
        id="languageSelector"
        :class="[menuButtonIsActive ? 'activeMenuButton' : '', 'avatar-btn']"
        variant="text"
        rounded="xl"
        color="white"
        v-bind="props"
        :append-icon="menuButtonIsActive ? 'mdi-menu-up' : 'mdi-menu-down'"
      >
        <v-icon icon="mdi-web" size="large" class="mr-1"></v-icon>
        <span class="d-none d-sm-inline ml-2 text-white" style="font-size: 1.2rem">{{ currentLanguageName }}</span>
      </v-btn>
    </template>
    <div class="menuListContainer">
      <v-list class="menuList">
        <v-list-item
          class="menuListItem"
          v-for="lang in availableLocale"
          :key="lang.value"
          density="compact"
          @click="changeLanguage(lang.value)"
        >
          <v-list-item-title>{{ lang.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </div>
  </v-menu>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { availableLocale } from '#/locales/i18n'

const { locale } = useI18n()
const menuButtonIsActive = ref(false)

const currentLanguageName = computed(() => {
  const lang = availableLocale.find((l) => l.value === locale.value)
  return lang ? lang.title : 'Language'
})

function changeLanguage(lang: string) {
  const url = new URL(window.location.href)
  url.searchParams.set('locale', lang)
  window.location.href = url.toString()
}
</script>

<style scoped>
.avatar-btn {
  text-transform: none !important;
  letter-spacing: normal !important;
}

.activeMenuButton {
  border-bottom: solid;
}

.menuList {
  /* height: auto; */
  min-width: 170px !important;
  backdrop-filter: blur(5px) !important;
  border-radius: 5px !important;
  border: 0.5px solid var(--bg-tabs) !important;
  background-color: var(--bg-primary-moz) !important;
  color: white !important;
}

@supports (backdrop-filter: blur()) {
  .menuList {
    background-color: var(--bg-primary-chr) !important;
  }
}

.menuListItem:hover,
.menuListItem:active {
  background-color: var(--cus-btn-hov--bg) !important;
  color: var(--cus-btn-hov-text) !important;
}

.menuListContainer {
  margin-top: 5px;
}

.menuListContainer::before {
  background-color: transparent;
  border-top: 1px solid var(--br-primary);
  border-right: 1px solid var(--br-primary);
  content: '';
  width: 10px;
  display: inline-block;
  height: 10px;
  position: absolute;
  transform: translate(2.5rem, -3px) rotate(-45deg);
}
</style>
