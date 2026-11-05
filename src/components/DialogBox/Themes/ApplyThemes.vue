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
                            :class="{
                                selected: theme === selectedTheme,
                                set: theme === selectedThemeRef
                            }"
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
                                    :value="theme"
                                    name="theme"
                                    :checked="theme === selectedTheme"
                                    @change="changeTheme(theme)"
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
                    <form>
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
import { onMounted, ref, reactive, watch } from 'vue'
import themeOptions, { defaultCustomTheme } from '#/simulator/src/themer/themes'
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
const selectedTheme = ref('Default Theme')
const iscustomTheme = ref(false)
const selectedThemeRef = ref<string | null>('Default Theme')
let inMemoryAppliedTheme: string | null = null

/**
 * Retrieves the currently active theme from localStorage or returns the in-memory fallback.
 * @returns The active theme name.
 */
function readAppliedTheme(): string {
    if (inMemoryAppliedTheme !== null) {
        return inMemoryAppliedTheme
    }
    try {
        return localStorage.getItem('theme') ?? 'Default Theme'
    } catch {
        return 'Default Theme'
    }
}

onMounted(() => {
    SimulatorState.dialogBox.theme_dialog = false
    const appliedTheme = readAppliedTheme()
    inMemoryAppliedTheme = appliedTheme
    selectedTheme.value = appliedTheme
    selectedThemeRef.value = appliedTheme
    themes.value = Object.keys(themeOptions)
    themes.value.splice(-1, 1)
    themeOptions['Custom Theme'] = loadSavedCustomTheme()
    const customTheme = CreateAbstraction(themeOptions['Custom Theme'])
    Object.keys(customTheme).forEach((key) => {
        customThemesList[key as keyof typeof customThemesList] = customTheme[key as keyof typeof customThemesList]
    })
    customThemes.value = Object.keys(customThemesList) as (keyof typeof customThemesList)[]
})

watch(
    () => SimulatorState.dialogBox.theme_dialog,
    (isOpen) => {
        if (isOpen) {
            const appliedTheme = readAppliedTheme()
            selectedTheme.value = appliedTheme
            selectedThemeRef.value = appliedTheme
            iscustomTheme.value = false
        }
    }
)

/**
 * Updates the selected theme preview and refreshes the canvas background.
 * @param theme - Name of the selected theme to preview.
 */
function changeTheme(theme: string): void {
    selectedTheme.value = theme
    updateThemeForStyle(theme)
    updateBG()
}

/**
 * Updates a custom theme color property and refreshes the canvas preview.
 * @param e - Input event triggered by a color input element.
 */
function changeCustomTheme(e: Event): void {
    const target = e.target as HTMLInputElement
    const customTheme = customThemesList[target.name as keyof typeof customThemesList]
    if (customTheme) {
        customTheme.color = target.value
        customTheme.ref.forEach((property: string) => {
            themeOptions['Custom Theme'][property] = target.value
        })
    }
    customThemesList[target.name as keyof typeof customThemesList] = customTheme
    updateThemeForStyle('Custom Theme')
    updateBG()
}

/**
 * Applies the currently selected theme or custom theme and saves to localStorage.
 */
function applyTheme(): void {
    if (!iscustomTheme.value) {
        if (selectedTheme.value) {
            inMemoryAppliedTheme = selectedTheme.value
            try {
                localStorage.setItem('theme', selectedTheme.value)
            } catch {
                // Ignore storage write errors (e.g. private browsing or quota limits)
            }
            updateThemeForStyle(selectedTheme.value)
            updateBG()
        }
    } else {
        inMemoryAppliedTheme = 'Custom Theme'
        try {
            localStorage.setItem(
                'Custom Theme',
                JSON.stringify(themeOptions['Custom Theme'])
            )
            localStorage.setItem('theme', 'Custom Theme')
        } catch {
            // Ignore storage write errors (e.g. private browsing or quota limits)
        }
        updateThemeForStyle('Custom Theme')
        updateBG()
    }
    selectedThemeRef.value = selectedTheme.value
    SimulatorState.dialogBox.theme_dialog = false
    iscustomTheme.value = false
}

/**
 * Loads custom theme settings from localStorage with fallback to default custom theme.
 * @returns An object containing custom theme CSS variables.
 */
function loadSavedCustomTheme(): Record<string, string> {
    try {
        const saved = localStorage.getItem('Custom Theme')
        if (saved) {
            const parsed = JSON.parse(saved)
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Object.keys(parsed).length > 0) {
                return parsed
            }
        }
    } catch {
        // Storage restricted or corrupt JSON
    }
    return { ...defaultCustomTheme }
}

/**
 * Opens the custom theme editor view and previews custom theme colors.
 */
function applyCustomTheme(): void {
    iscustomTheme.value = true
    themeOptions['Custom Theme'] = loadSavedCustomTheme()
    const customThemeAbstraction = CreateAbstraction(themeOptions['Custom Theme'])
    Object.keys(customThemeAbstraction).forEach((key) => {
        customThemesList[key as keyof typeof customThemesList] =
            customThemeAbstraction[key as keyof typeof customThemesList]
    })
    updateThemeForStyle('Custom Theme')
    updateBG()
}

/**
 * Parses uploaded JSON theme file and applies it to custom theme options.
 * @param e - Progress event from the file reader containing file contents.
 */
function receivedText(e: ProgressEvent<FileReader>): void {
    if (typeof e.target?.result !== 'string') return
    try {
        const lines = JSON.parse(e.target.result)
        if (
            !lines ||
            typeof lines !== 'object' ||
            Array.isArray(lines) ||
            Object.keys(lines).length === 0
        ) {
            confirmSingleOption('Invalid Theme File!')
            return
        }
        themeOptions['Custom Theme'] = lines
        updateThemeForStyle('Custom Theme')
        updateBG()
        SimulatorState.dialogBox.theme_dialog = false
        SimulatorState.dialogBox.theme_dialog = true
        const customThemeValues = CreateAbstraction(themeOptions['Custom Theme'])
        Object.keys(customThemeValues).forEach((key) => {
            customThemesList[key as keyof typeof customThemesList] =
                customThemeValues[key as keyof typeof customThemesList]
        })
        customThemes.value = Object.keys(customThemesList) as (keyof typeof customThemesList)[]
    } catch {
        confirmSingleOption('Invalid Theme File!')
    }
}

/**
 * Prompts user to select a JSON file to import a custom theme.
 */
function importCustomTheme(): void {
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = '.json'
    fileInput.style.display = 'none'
    fileInput.addEventListener('change', (event) => {
        const file = (event.target as HTMLInputElement).files?.[0]
        if (file && file.name.split('.')[1] === 'json') {
            const fr = new FileReader()
            fr.onload = receivedText
            fr.readAsText(file)
        } else {
            confirmSingleOption('File Not Supported !')
        }
    })
    document.body.appendChild(fileInput)
    fileInput.click()
    document.body.removeChild(fileInput)
}

/**
 * Exports current custom theme settings as a downloadable JSON file.
 */
function exportCustomTheme(): void {
    const dlAnchorElem = document.getElementById('downloadThemeFile')
    dlAnchorElem?.setAttribute(
        'href',
        `data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(themeOptions['Custom Theme'])
        )}`
    )
    dlAnchorElem?.setAttribute('download', 'CV_CustomTheme.json')
    dlAnchorElem?.click()
}

/**
 * Closes the theme selection dialog and reverts unapplied preview changes.
 */
function closeThemeDialog(): void {
    SimulatorState.dialogBox.theme_dialog = false
    iscustomTheme.value = false
    const appliedTheme = readAppliedTheme()
    selectedTheme.value = appliedTheme
    selectedThemeRef.value = appliedTheme
    updateThemeForStyle(appliedTheme)
    updateBG()
}

/**
 * Closes the custom theme editor and reverts unsaved color modifications.
 */
function closeCustomThemeDialog(): void {
    SimulatorState.dialogBox.theme_dialog = false
    iscustomTheme.value = false
    themeOptions['Custom Theme'] = loadSavedCustomTheme()
    const customThemeAbstraction = CreateAbstraction(themeOptions['Custom Theme'])
    Object.keys(customThemeAbstraction).forEach((key) => {
        customThemesList[key as keyof typeof customThemesList] =
            customThemeAbstraction[key as keyof typeof customThemesList]
    })
    const appliedTheme = readAppliedTheme()
    selectedTheme.value = appliedTheme
    selectedThemeRef.value = appliedTheme
    updateThemeForStyle(appliedTheme)
    updateBG()
}
</script>
