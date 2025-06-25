<template>
  <v-menu
    v-model="isMenuOpen"
    :close-on-content-click="false"
    location="bottom"
    offset="5"
  >
    <template v-slot:activator="{ props }">
      <v-btn
        :id="`navbarMenuButton_${sanitizedText}`"
        :class="isMenuOpen ? 'activeMenuButton' : ''"
        class="navbarMenuButton"
        color="transparent"
        size="small"
        flat
        @click="handleMenuClick"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
        v-bind="props"
        :append-icon="isMenuOpen ? 'mdi-menu-up' : 'mdi-menu-down'"
      >
        {{ $t('simulator.nav.' + navbarItem.text + '.heading') }}
      </v-btn>
    </template>
    
    <div 
      class="menuListContainer"
      @mouseenter="handleMenuMouseEnter"
      @mouseleave="handleMenuMouseLeave"
    >
      <v-list class="menuList">
        <v-list-item
          class="menuListItem"
          v-for="(listItem, index) in navbarItem.dropdownItems"
          :key="index"
          density="compact"
          :id="listItem.itemid"
          @click="handleItemClick(listItem.itemid)"
          v-bind="Object.fromEntries(
            listItem.attributes.map((attr: AttrType) => [attr.name, attr.value])
          )"
        >
          <v-list-item-title>{{
            $t(
              'simulator.nav.' +
                navbarItem.text +
                '.' +
                listItem.item
            )
          }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </div>
  </v-menu>
</template>

<script lang="ts" setup>
import logixFunction from '#/simulator/src/data'
import { ref, computed } from 'vue'

interface AttrType {
  name: string
  value: string
}

const props = defineProps({
  navbarItem: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['menu-toggle', 'menu-click'])

const isMenuOpen = ref(false)
const hoverTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const isHovering = ref(false)

const sanitizedText = computed(() =>
  props.navbarItem.text?.toString().replace(/\W+/g, '_')
)

const handleMenuClick = () => {
  if (hoverTimer.value) clearTimeout(hoverTimer.value)
  hoverTimer.value = null

  const newState = !isMenuOpen.value
  isMenuOpen.value = newState

  emit('menu-click', {
    itemText: props.navbarItem.text,
    isOpen: newState,
  })

  emit('menu-toggle', {
    itemText: props.navbarItem.text,
    isOpen: newState,
  })
}

const handleMouseEnter = () => {
  isHovering.value = true
  if (hoverTimer.value) clearTimeout(hoverTimer.value)

  hoverTimer.value = setTimeout(() => {
    if (isHovering.value) {
      isMenuOpen.value = true
      emit('menu-toggle', {
        itemText: props.navbarItem.text,
        isOpen: true,
      })
    }
  }, 150)
}

const handleMouseLeave = () => {
  isHovering.value = false
  if (hoverTimer.value) clearTimeout(hoverTimer.value)

  hoverTimer.value = setTimeout(() => {
    if (!isHovering.value) {
      isMenuOpen.value = false
      emit('menu-toggle', {
        itemText: props.navbarItem.text,
        isOpen: false,
      })
    }
  }, 200)
}

const handleMenuMouseEnter = () => {
  isHovering.value = true
  if (hoverTimer.value) {
    clearTimeout(hoverTimer.value)
    hoverTimer.value = null
  }
}

const handleMenuMouseLeave = () => {
  isHovering.value = false
  hoverTimer.value = setTimeout(() => {
    if (!isHovering.value) {
      isMenuOpen.value = false
      emit('menu-toggle', {
        itemText: props.navbarItem.text,
        isOpen: false,
      })
    }
  }, 200)
}

const handleItemClick = (itemId: string) => {
  logixFunction[itemId]()
  isMenuOpen.value = false
  isHovering.value = false

  if (hoverTimer.value) {
    clearTimeout(hoverTimer.value)
    hoverTimer.value = null
  }

  emit('menu-toggle', {
    itemText: props.navbarItem.text,
    isOpen: false,
  })
}
</script>

<style scoped>
.navbarMenuButton {
  color: white !important;
  font-size: 1rem !important;
  font-weight: 400 !important;
  text-transform: capitalize !important;
  padding: 0 0 0 0.3rem !important;
  letter-spacing: 0 !important;
  transition: all 0.2s ease-in-out;
}

.navbarMenuButton:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.menuList {
  backdrop-filter: blur(5px) !important;
  border-radius: 5px !important;
  border: 0.5px solid var(--br-primary) !important;
  background: var(--bg-primary-moz) !important;
  background-color: var(--bg-primary-chr) !important;
  color: white !important;
  min-width: 200px;
}

.activeMenuButton {
  border-bottom: 2px solid white;
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.menuListContainer {
  margin-top: 5px;
  overflow-y: auto;
  max-height: 400px;
}

.menuListItem {
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
}

.menuListItem:hover,
.menuListItem:active {
  background-color: var(--cus-btn-hov--bg) !important;
  color: var(--cus-btn-hov-text) !important;
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
  z-index: 1;
}
</style>

<style>
.navbarMenuButton i {
  margin: 0 !important;
}
</style>