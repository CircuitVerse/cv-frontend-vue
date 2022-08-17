<template>
    <v-dialog
        v-model="SimulatorState.dialogBox.theme_dialog"
        :persistent="false"
    >
        <v-card class="messageBoxContent">
            <v-card-text>
                <template v-if="iscustomTheme == false">
                    <p class="dialogHeader">Select Theme</p>
                    <v-btn
                        size="x-small"
                        icon
                        class="dialogClose"
                        @click="closeThemeDialog()"
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
                            :class="
                                theme == selectedTheme ? 'selected set' : ''
                            "
                        >
                            <div
                                class="themeSel"
                                @click="changeTheme($event)"
                            ></div>
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
                </template>
                <template v-else>
                    <form @change="changeCustomTheme($event)">
                        <div
                            v-for="customTheme in customThemes"
                            :key="customTheme"
                        >
                            <label :for="customTheme">
                                {{ customTheme }}
                                ({{
                                    customThemesList[customTheme].description
                                }})
                            </label>
                            <input
                                type="color"
                                :name="customTheme"
                                :value="customThemesList[customTheme].color"
                                class="customColorInput"
                            />
                        </div>
                        <a id="downloadThemeFile" style="display: none"></a>
                    </form>
                </template>
            </v-card-text>
            <v-card-actions>
                <v-btn class="messageBtn" block @click="applyTheme()">
                    Apply Theme
                </v-btn>
                <template v-if="iscustomTheme == false">
                    <v-btn class="messageBtn" block @click="applyCustomTheme()">
                        Custom Theme
                    </v-btn>
                </template>
                <template v-else>
                    <v-btn
                        class="messageBtn"
                        block
                        @click="importCustomTheme()"
                    >
                        Import Theme
                    </v-btn>
                    <v-btn
                        class="messageBtn"
                        block
                        @click="exportCustomTheme()"
                    >
                        Export Theme
                    </v-btn>
                </template>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
import { useState } from '#/store/SimulatorStore/state'
import { onMounted, onUpdated, ref } from '@vue/runtime-core'
import themeOptions from '#/simulator/src/themer/themes'
import {
    getThemeCardSvg,
    updateBG,
    updateThemeForStyle,
} from '#/simulator/src/themer/themer'
const SimulatorState = useState()
import DefaultTheme from '#/assets/themes/DefaultTheme.svg'
import NightSky from '#/assets/themes/NightSky.svg'
import LitebornSpring from '#/assets/themes/LitebornSpring.svg'
import GnW from '#/assets/themes/GnW.svg'
import HighContrast from '#/assets/themes/HighContrast.svg'
import ColorBlind from '#/assets/themes/ColorBlind.svg'
import { CustomColorThemes } from '#/simulator/src/themer/customThemer'
import { CreateAbstraction } from '#/simulator/src/themer/customThemeAbstraction'
const themes = ref([''])
const customThemes = ref([''])
const customThemesList = ref([''])
const selectedTheme = ref('default-theme')
const iscustomTheme = ref(false)

onMounted(() => {
    SimulatorState.dialogBox.theme_dialog = false
    selectedTheme.value = localStorage.getItem('theme')
    themes.value = Object.keys(themeOptions)
    themes.value.splice(-1, 1)
    console.log(themes.value)
    customThemesList.value = CreateAbstraction(themeOptions['Custom Theme'])
    customThemes.value = Object.keys(customThemesList.value)
    console.log(customThemesList.value)
    console.log(customThemes.value)
})

function changeTheme(e) {
    console.log(e)
    e.preventDefault()
    $('.selected').removeClass('selected')
    let themeCard = $(e.target.parentElement)
    themeCard.addClass('selected')
    // Extract radio button
    var radioButton = themeCard.find('input[type=radio]')
    radioButton.trigger('click') // Mark as selected
    updateThemeForStyle(themeCard.find('label').text()) // Extract theme name and set
    updateBG()
}

function changeCustomTheme(e) {
    console.log('update custom theme')
    console.log(e)
    customThemesList.value[e.target.name].color = e.target.value
    customThemesList.value[e.target.name].ref.forEach((property) => {
        themeOptions['Custom Theme'][property] = e.target.value
    })
    updateThemeForStyle('Custom Theme')
    updateBG()
}

function applyTheme() {
    SimulatorState.dialogBox.theme_dialog = false
    console.log('Apply Theme')
    if ($('.selected label').text()) {
        localStorage.removeItem('Custom Theme')
        localStorage.setItem('theme', $('.selected label').text())
    }
    $('.set').removeClass('set')
    $('.selected').addClass('set')
}
function applyCustomTheme() {
    iscustomTheme.value = true
    console.log('Apply Custom Theme')
    CustomColorThemes()
}
function importCustomTheme() {
    iscustomTheme.value = true
    console.log('Import Custom Theme')
}
function exportCustomTheme() {
    iscustomTheme.value = true
    console.log('Export Custom Theme')
}

function closeThemeDialog() {
    SimulatorState.dialogBox.theme_dialog = false
    updateThemeForStyle(localStorage.getItem('theme'))
    updateBG()
}
</script>
