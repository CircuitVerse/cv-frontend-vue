<template>
    <v-dialog v-model="SimulatorState.dialogBox.theme_dialog" :persistent="true">
        <v-card class="messageBoxContent">
            <v-card-text>
                <template v-if="!iscustomTheme">
                    <p class="dialogHeader">Select Theme</p>
                    <v-btn size="x-small" icon class="dialogClose" @click="closeThemeDialog()">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                    <div id="colorThemesDialog" class="customScroll colorThemesDialog" tabindex="0"
                        title="Select Theme">
                        <div v-for="theme in themes" :id="theme" :key="theme" class="theme"
                            :class="{ selected: theme === selectedTheme, set: theme === selectedTheme }">
                            <div class="themeSel" @click="changeTheme(theme)"></div>
                            <span>
                                <img v-if="theme === 'Default Theme'" src="../../../assets/themes/DefaultTheme.svg"
                                    style="display: block" />
                                <img v-if="theme === 'Night Sky'" src="../../../assets/themes/NightSky.svg"
                                    style="display: block" />
                                <img v-if="theme === 'Lite-born Spring'" src="../../../assets/themes/LitebornSpring.svg"
                                    style="display: block" />
                                <img v-if="theme === 'G&W'" src="../../../assets/themes/GnW.svg"
                                    style="display: block" />
                                <img v-if="theme === 'High Contrast'" src="../../../assets/themes/HighContrast.svg"
                                    style="display: block" />
                                <img v-if="theme === 'Color Blind'" src="../../../assets/themes/ColorBlind.svg"
                                    style="display: block" />
                            </span>
                            <span id="themeNameBox" class="themeNameBox">
                                <input :id="theme.replace(' ', '')" type="radio" value="theme" name="theme"
                                    :checked="theme === selectedTheme || theme === 'Default Theme'" />
                                <label :for="theme.replace(' ', '')">{{ theme }}</label>
                            </span>
                        </div>
                    </div>
                </template>
                <template v-else>
                    <p class="dialogHeader">Custom Theme</p>
                    <v-btn size="x-small" icon class="dialogClose" @click="closeCustomThemeDialog()">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                    <form @input="changeCustomTheme($event)">
                        <div v-for="customTheme in customThemes" :key="customTheme">
                            <label :for="customTheme" class="customColorLabel">
                                {{ customTheme }} ({{ customThemesList[customTheme]?.description }})
                            </label>
                            <input type="color" :name="customTheme" :value="customThemesList[customTheme]?.color"
                                class="customColorInput" @input="changeCustomTheme($event)" />
                        </div>
                        <a id="downloadThemeFile" style="display: none"></a>
                    </form>
                </template>
            </v-card-text>
            <v-card-actions>
                <v-btn class="messageBtn" block @click="applyTheme()">Apply Theme</v-btn>
                <template v-if="!iscustomTheme">
                    <v-btn class="messageBtn" block @click="applyCustomTheme()">Custom Theme</v-btn>
                </template>
                <template v-else>
                    <v-btn class="messageBtn" block @click="importCustomTheme()">Import Theme</v-btn>
                    <v-btn class="messageBtn" block @click="exportCustomTheme()">Export Theme</v-btn>
                </template>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
import { useState } from '#/store/SimulatorStore/state';
import { onMounted, ref, reactive } from 'vue';
import themeOptions from '#/simulator/src/themer/themes';
import { getThemeCardSvg, updateBG, updateThemeForStyle } from '#/simulator/src/themer/themer';
import { CreateAbstraction, Themes } from '#/simulator/src/themer/customThemeAbstraction';
import { confirmSingleOption } from '#/components/helpers/confirmComponent/ConfirmComponent.vue';

const SimulatorState = useState();
const themes = ref<string[]>([]);
const customThemes = ref<(keyof typeof customThemesList)[]>([]);
const customThemesList: Themes = reactive({});
const selectedTheme = ref<string>(localStorage.getItem('theme') || 'default-theme');
const iscustomTheme = ref<boolean>(false);

onMounted(() => {
    SimulatorState.dialogBox.theme_dialog = false;
    themes.value = Object.keys(themeOptions).filter((theme) => theme !== 'Custom Theme');
    const customTheme = CreateAbstraction(themeOptions['Custom Theme']);
    Object.keys(customTheme).forEach((key) => {
        customThemesList[key as keyof typeof customThemesList] = customTheme[key as keyof typeof customThemesList];
    });
    customThemes.value = Object.keys(customThemesList) as (keyof typeof customThemesList)[];
});

function changeTheme(theme: string): void {
    selectedTheme.value = theme;
    updateThemeForStyle(theme);
    updateBG();
}

function changeCustomTheme(e: Event): void {
    const target = e.target as HTMLInputElement;
    const customTheme = customThemesList[target.name as keyof typeof customThemesList];
    if (customTheme) {
        customTheme.color = target.value;
        customTheme.ref.forEach((property: string) => {
            themeOptions['Custom Theme'][property] = target.value;
        });
    }
    updateThemeForStyle('Custom Theme');
    updateBG();
}

function applyTheme(): void {
    try {
        if (!iscustomTheme.value) {
            const selectedThemeLabel = document.querySelector('.selected label')?.textContent;
            if (selectedThemeLabel) {
                localStorage.removeItem('Custom Theme');
                localStorage.setItem('theme', selectedThemeLabel);
            }
        } else {
            localStorage.setItem('theme', 'Custom Theme');
            localStorage.setItem('Custom Theme', JSON.stringify(themeOptions['Custom Theme']));
        }
        SimulatorState.dialogBox.theme_dialog = false;
        setTimeout(() => (iscustomTheme.value = false), 1000);
    } catch (error) {
        console.error('Failed to save theme settings:', error);
    }
}

function applyCustomTheme(): void {
    iscustomTheme.value = true;
    updateThemeForStyle(localStorage.getItem('theme') || 'default-theme');
    updateBG();
    localStorage.setItem('theme', 'Custom Theme');
    localStorage.setItem('Custom Theme', JSON.stringify(themeOptions['Custom Theme']));
}

function receivedText(e: ProgressEvent<FileReader>): void {
    const lines = typeof e.target?.result === 'string' ? JSON.parse(e.target.result) : [];
    const customTheme = CreateAbstraction(lines);
    themeOptions['Custom Theme'] = lines;
    updateThemeForStyle('Custom Theme');
    updateBG();
    SimulatorState.dialogBox.theme_dialog = false;
    SimulatorState.dialogBox.theme_dialog = true;
    const customThemeValues = CreateAbstraction(themeOptions['Custom Theme']);
    Object.keys(customThemeValues).forEach((key) => {
        customThemesList[key as keyof typeof customThemesList] = customThemeValues[key as keyof typeof customThemesList];
    });
    customThemes.value = Object.keys(customThemesList) as (keyof typeof customThemesList)[];
}

function importCustomTheme(): void {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file && file.name.split('.')[1] === 'json') {
            const fr = new FileReader();
            fr.onload = receivedText;
            fr.readAsText(file);
        } else {
            confirmSingleOption('File Not Supported !');
        }
    });
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
}

function exportCustomTheme(): void {
    const dlAnchorElem = document.getElementById('downloadThemeFile');
    if (dlAnchorElem) {
        dlAnchorElem.setAttribute(
            'href',
            `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(themeOptions['Custom Theme']))}`
        );
        dlAnchorElem.setAttribute('download', 'CV_CustomTheme.json');
        dlAnchorElem.click();
    }
}

function closeThemeDialog(): void {
    SimulatorState.dialogBox.theme_dialog = false;
    setTimeout(() => (iscustomTheme.value = false), 1000);
    updateThemeForStyle(localStorage.getItem('theme') || 'default-theme');
    updateBG();
}

function closeCustomThemeDialog(): void {
    SimulatorState.dialogBox.theme_dialog = false;
    setTimeout(() => (iscustomTheme.value = false), 1000);
    const customTheme = localStorage.getItem('Custom Theme');
    if (customTheme) {
        themeOptions['Custom Theme'] = JSON.parse(customTheme);
    }
    updateThemeForStyle(localStorage.getItem('theme') || 'default-theme');
    updateBG();
}
</script>

<style scoped>
.dialogHeader {
    font-size: 1.2rem;
    font-weight: bold;
    margin-bottom: 1rem;
}

.dialogClose {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
}

.colorThemesDialog {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
}

.theme {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
}

.theme.selected {
    border: 2px solid #1976d2;
}

.themeNameBox {
    margin-top: 0.5rem;
}

.customColorLabel {
    display: block;
    margin-bottom: 0.5rem;
}

.customColorInput {
    margin-bottom: 1rem;
}

.messageBtn {
    margin-top: 1rem;
}
</style>