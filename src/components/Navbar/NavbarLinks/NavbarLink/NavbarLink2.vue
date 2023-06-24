<template>
    <v-menu open-on-hover location="bottom" v-model="menuButtonIsActive">
        <template v-slot:activator="{ props }">
            <v-btn
                id="navbarMenuButton"
                :class="menuButtonIsActive ? 'activeMenuButton' : ''"
                color="transparent"
                size="small"
                flat
                v-bind="props"
                :append-icon="
                    menuButtonIsActive ? 'mdi-menu-up' : 'mdi-menu-down'
                "
            >
                {{ $t('simulator.nav.' + navbarItem.text + '.heading') }}
            </v-btn>
        </template>
        <div class="menuListContainer">
            <v-list class="menuList">
                <v-list-item
                    v-for="(listItem, index) in navbarItem.dropdownItems"
                    :key="index"
                    density="compact"
                    :id="listItem.itemid"
                    @click.stop="logixFunction[listItem.itemid]"
                    v-bind="
                    Object.fromEntries(
                        listItem.attributes.map((attr:AttrType) => [
                            attr.name,
                            attr.value,
                        ])
                    )
                "
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
// import DropDown from '@/Dropdown/DropDown.vue'
import logixFunction from '#/simulator/src/data'
import { ref } from 'vue'

interface AttrType {
    name: string
    value: string
}
defineProps({
    navbarItem: { type: Object, default: () => {} },
})

const menuButtonIsActive = ref(false)
</script>

<style scoped>
.menuList {
    /* height: auto; */
    backdrop-filter: blur(5px) !important;
    border-radius: 5px !important;
    border: 0.5px solid var(--br-primary) !important;
    background: var(--bg-primary-moz) !important;
    background-color: var(--bg-primary-chr) !important;
    color: white !important;
}

.v-btn {
    color: white !important;
}

.activeMenuButton {
    /* outline: 1px solid white; */
    border-bottom: solid;
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
