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
                    v-if="selectedTheme != 'Custom Theme'"
                    id="colorThemesDialog"
                    class="customScroll colorThemesDialog"
                    tabindex="0"
                    title="Select Theme"
                >
                    <div
                        v-for="theme in themes"
                        :id="theme"
                        :key="theme"
                        class="theme"
                        :class="theme == selectedTheme ? 'selected set' : ''"
                    >
                        <div class="themeSel"></div>
                        <span>
                            <DefaultTheme v-if="theme == 'Default Theme'" />
                            <NightSky v-if="theme == 'Night Sky'" />
                            <LitebornSpring
                                v-if="theme == 'Lite-born Spring'"
                            />
                            <GnW v-if="theme == 'G&W'" />
                            <HighContrast v-if="theme == 'High Contrast'" />
                            <ColorBlind v-if="theme == 'Color Blind'" />
                        </span>
                        <span id="themeNameBox" class="themeNameBox">
                            <input
                                :id="theme.replace(' ', '')"
                                type="radio"
                                value="theme"
                                name="theme"
                            />
                            <label :for="theme.replace(' ', '')">{{
                                theme
                            }}</label>
                        </span>
                    </div>
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
import { onMounted, onUpdated, ref } from '@vue/runtime-core'
import themeOptions from '#/simulator/src/themer/themes'
import { getThemeCardSvg } from '#/simulator/src/themer/themer'
const SimulatorState = useState()
import DefaultTheme from '#/assets/themes/DefaultTheme.svg'
import NightSky from '#/assets/themes/NightSky.svg'
import LitebornSpring from '#/assets/themes/LitebornSpring.svg'
import GnW from '#/assets/themes/GnW.svg'
import HighContrast from '#/assets/themes/HighContrast.svg'
import ColorBlind from '#/assets/themes/ColorBlind.svg'
const themes = ref([''])
const selectedTheme = ref('default-theme')

onMounted(() => {
    SimulatorState.dialogBox.theme_dialog = false
    selectedTheme.value = localStorage.getItem('theme')
    themes.value = Object.keys(themeOptions)
    themes.value.splice(-1, 1)
    console.log(themes.value)
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


"Default Theme"
"Night Sky"
"Lite-born Spring"
"G&W"
"High Contrast"
"Color Blind
-->
