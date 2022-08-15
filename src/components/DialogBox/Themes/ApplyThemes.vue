<template>
    <v-dialog
        v-model="SimulatorState.dialogBox.theme_dialog"
        :persistent="false"
    >
        <v-card class="messageBoxContent">
            <v-card-text>
                <p class="dialogHeader">Select Theme</p>
                <v-btn
                    size="x-small"
                    icon
                    class="dialogClose"
                    @click="SimulatorState.dialogBox.theme_dialog = false"
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
                <div
                    id="colorThemesDialog"
                    class="customScroll colorThemesDialog"
                    tabindex="0"
                    title="Select Theme"
                >
                    Apply Themes
                </div>
            </v-card-text>
            <v-card-actions>
                <v-btn class="messageBtn" block @click="applyTheme()">
                    Apply Theme
                </v-btn>
                <v-btn class="messageBtn" block @click="customTheme()">
                    Custom Theme
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
import { useState } from '#/store/SimulatorStore/state'
import { onMounted, ref } from '@vue/runtime-core'
import themeOptions from '#/simulator/src/themer/themes'
const SimulatorState = useState()

const themes = ref(['']);

onMounted(() => {
    SimulatorState.dialogBox.theme_dialog = false
    const selectedTheme = localStorage.getItem('theme')
    themes.value = Object.keys(themeOptions)
    console.log(selectedTheme)
    console.log(themes)
})

function applyTheme() {
    console.log('Apply Theme')
}
function customTheme() {
    console.log('Apply Custom Theme')
}
</script>

<!-- 
export const getThemeCard = (themeName, selected) => {
    if (themeName === 'Custom Theme') return '<div></div>'
    let themeId = themeName.replace(' ', '')
    let selectedClass = selected ? 'selected set' : ''
    // themeSel is the hit area
    return `
            <div id="theme" class="theme ${selectedClass}">
              <div class='themeSel'></div>
              <span>${getThemeCardSvg(themeName)}</span>
              <span id='themeNameBox' class='themeNameBox'>
                <input type='radio' id='${themeId}' value='${themeName}' name='theme'>
                <label for='${themeId}'>${themeName}</label>
              </span>
            </div>
            `
} 
-->
