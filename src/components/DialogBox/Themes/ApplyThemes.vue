<template>
    <v-dialog
        v-model="SimulatorState.dialogBox.theme_dialog"
        :persistent="true"
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
                            :class="getThemeClasses(theme)"
                        >
                            <div
                                class="themeSel"
                                @click="changeTheme(theme)"
                            ></div>
                            <span>
                                <img
                                    v-if="theme == 'Default Theme'"
                                    src="../../../assets/themes/DefaultTheme.svg"
                                    style="display: block"
                                />
                                <img
                                    v-if="theme == 'Night Sky'"
                                    src="../../../assets/themes/NightSky.svg"
                                    style="display: block"
                                />
                                <img
                                    v-if="theme == 'Lite-born Spring'"
                                    src="../../../assets/themes/LitebornSpring.svg"
                                    style="display: block"
                                />
                                <img
                                    v-if="theme == 'G&W'"
                                    src="../../../assets/themes/GnW.svg"
                                    style="display: block"
                                />
                                <img
                                    v-if="theme == 'High Contrast'"
                                    src="../../../assets/themes/HighContrast.svg"
                                    style="display: block"
                                />
                                <img
                                    v-if="theme == 'Color Blind'"
                                    src="../../../assets/themes/ColorBlind.svg"
                                    style="display: block"
                                />
                            </span>
                            <span id="themeNameBox" class="themeNameBox">
                                <input
                                    :id="theme.replace(' ', '')"
                                    type="radio"
                                    value="theme"
                                    name="theme"
                                    :checked="theme == selectedTheme || theme == 'Default Theme'"
                                />
                                <label :for="theme.replace(' ', '')">{{
                                    theme
                                }}</label>
                            </span>
                        </div>
                    </div>
                </template>
                <template v-else>
                    <p class="dialogHeader">Custom Theme</p>
                    <v-btn
                        size="x-small"
                        icon
                        class="dialogClose"
                        @click="closeCustomThemeDialog()"
                    >
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                    <form @input="changeCustomTheme($event)">
                        <div
                            v-for="customTheme in customThemes"
                            :key="customTheme"
                        >
                            <label :for="customTheme" class="customColorLabel">
                                {{ customTheme }}
                                ({{
                                    customThemesList[customTheme]?.description
                                }})
                            </label>
                            <input
                                type="color"
                                :name="customTheme"
                                :value="customThemesList[customTheme]?.color"
                                class="customColorInput"
                                @input="changeCustomTheme($event)"
                            />
                        </div>
                        <a 
                            ref="downloadThemeFile" 
                            id="downloadThemeFile" 
                            style="display: none"
                        ></a>
                        <input
                            ref="fileInput"
                            type="file"
                            accept=".json"
                            style="display: none"
                            @change="handleFileChange"
                        />
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
import { onMounted, ref, reactive, computed } from '@vue/runtime-core'
import themeOptions from '#/simulator/src/themer/themes'
import {
    getThemeCardSvg,
    updateBG,
    updateThemeForStyle,
} from '#/simulator/src/themer/themer'
const SimulatorState = useState()
import { CreateAbstraction, Themes } from '#/simulator/src/themer/customThemeAbstraction'
import { confirmSingleOption } from '#/components/helpers/confirmComponent/ConfirmComponent.vue'

const themes = ref([''])
const customThemes = ref<((keyof typeof customThemesList)[]) | undefined>(undefined)
const customThemesList: Themes = reactive({})
const selectedTheme = ref('default-theme')
const iscustomTheme = ref(false)
const isThemeApplied = ref(false)
const downloadThemeFile = ref<HTMLAnchorElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

// Computed property to determine theme classes
const getThemeClasses = computed(() => {
    return (theme: string) => {
        const classes = []
        if (theme === selectedTheme.value) {
            classes.push('selected')
        }
        if (isThemeApplied.value && theme === selectedTheme.value) {
            classes.push('set')
        }
        return classes.join(' ')
    }
})

// Computed property to get selected theme text
const selectedThemeText = computed(() => {
    return selectedTheme.value
})

onMounted(() => {
    SimulatorState.dialogBox.theme_dialog = false
    selectedTheme.value = localStorage.getItem('theme') ?? 'default-theme'
    themes.value = Object.keys(themeOptions)
    themes.value.splice(-1, 1)
    const customTheme = CreateAbstraction(themeOptions['Custom Theme'])
    Object.keys(customTheme).forEach((key) => {
        customThemesList[key as keyof typeof customThemesList] = customTheme[key as keyof typeof customThemesList]
    })
    customThemes.value = Object.keys(customThemesList) as (keyof typeof customThemesList)[]
    
    // Set initial applied state
    const currentTheme = localStorage.getItem('theme')
    if (currentTheme === selectedTheme.value) {
        isThemeApplied.value = true
    }
})

function changeTheme(theme: string) {
    selectedTheme.value = theme
    updateThemeForStyle(theme)
    updateBG()
}

function changeCustomTheme(e: InputEvent) {
    const customTheme = customThemesList[(e.target as HTMLInputElement).name as keyof typeof customThemesList]
    if (customTheme) {
        customTheme.color = (e.target as HTMLInputElement).value
        customTheme.ref.forEach((property: string) => {
            themeOptions['Custom Theme'][property] = (e.target as HTMLInputElement).value
        })
    }
    customThemesList[(e.target as HTMLInputElement).name as keyof typeof customThemesList] = customTheme
    updateThemeForStyle('Custom Theme')
    updateBG()
}

function applyTheme() {
    if (iscustomTheme.value == false) {
        if (selectedThemeText.value) {
            localStorage.removeItem('Custom Theme')
            localStorage.setItem('theme', selectedThemeText.value)
        }
    } else {
        // update theme to Custom Theme
        localStorage.setItem('theme', 'Custom Theme')
        // add Custom theme to custom theme object
        localStorage.setItem(
            'Custom Theme',
            JSON.stringify(themeOptions['Custom Theme'])
        )
    }
    
    // Update reactive state instead of jQuery DOM manipulation
    isThemeApplied.value = true
    SimulatorState.dialogBox.theme_dialog = false
    setTimeout(() => (iscustomTheme.value = false), 1000)
}

function applyCustomTheme() {
    iscustomTheme.value = true
    updateThemeForStyle(localStorage.getItem('theme'))
    updateBG()
    localStorage.setItem('theme', 'Custom Theme')
    // add Custom theme to custom theme object
    localStorage.setItem(
        'Custom Theme',
        JSON.stringify(themeOptions['Custom Theme'])
    )
    
    // Update reactive state instead of jQuery DOM manipulation
    selectedTheme.value = 'Custom Theme'
    isThemeApplied.value = true
}

function receivedText(e: ProgressEvent<FileReader>) {
    let lines = []
    if(typeof e.target?.result === 'string') {
        lines = JSON.parse(e.target.result)
    }
    let customTheme = CreateAbstraction(lines)
    themeOptions['Custom Theme'] = lines
    // preview theme
    updateThemeForStyle('Custom Theme')
    updateBG()
    // update colors in dialog box
    SimulatorState.dialogBox.theme_dialog = false
    SimulatorState.dialogBox.theme_dialog = true
    const customThemeValues = CreateAbstraction(themeOptions['Custom Theme'])
    Object.keys(customThemeValues).forEach((key) => {
        customThemesList[key as keyof typeof customThemesList] = customThemeValues[key as keyof typeof customThemesList]
    })
    customThemes.value = Object.keys(customThemesList) as (keyof typeof customThemesList)[]
}

function handleFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file && file.name.split('.')[1] === 'json') {
        const fr = new FileReader()
        fr.onload = receivedText
        fr.readAsText(file)
    } else {
        confirmSingleOption('File Not Supported !')
    }
}

function importCustomTheme() {
    if (fileInput.value) {
        fileInput.value.click()
    }
}

function exportCustomTheme() {
    if (downloadThemeFile.value) {
        downloadThemeFile.value.setAttribute(
            'href',
            `data:text/json;charset=utf-8,${encodeURIComponent(
                JSON.stringify(themeOptions['Custom Theme'])
            )}`
        )
        downloadThemeFile.value.setAttribute('download', 'CV_CustomTheme.json')
        downloadThemeFile.value.click()
    }
}

function closeThemeDialog() {
    SimulatorState.dialogBox.theme_dialog = false
    setTimeout(() => (iscustomTheme.value = false), 1000)
    updateThemeForStyle(localStorage.getItem('theme'))
    updateBG()
    
    // Reset to original state
    selectedTheme.value = localStorage.getItem('theme') ?? 'default-theme'
    isThemeApplied.value = true
}

function closeCustomThemeDialog() {
    SimulatorState.dialogBox.theme_dialog = false
    setTimeout(() => (iscustomTheme.value = false), 1000)
    const customTheme = localStorage.getItem('Custom Theme')
    if (customTheme) {
        themeOptions['Custom Theme'] = JSON.parse(customTheme) || themeOptions['Default Theme'] // hack for closing dialog box without saving
    }
    // Rollback to previous theme
    updateThemeForStyle(localStorage.getItem('theme'))
    updateBG()
    
    // Reset to original state
    selectedTheme.value = localStorage.getItem('theme') ?? 'default-theme'
    isThemeApplied.value = true
}
</script>