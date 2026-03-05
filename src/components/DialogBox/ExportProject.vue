<template>
    <v-dialog
        v-model="SimulatorState.dialogBox.export_project_dialog"
        :persistent="true"
    >
        <v-card class="exportProjectCard">
            <v-card-text>
                <p>Export as file</p>
                <v-btn
                    size="x-small"
                    icon
                    class="dialogClose"
                    @click="closeDialog"
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
                <div class="fileNameInput">
                    <p>File name:</p>
                    <input
                        v-model="fileNameInput"
                        id="fileNameInputField"
                        class="inputField"
                        type="text"
                        placeholder="untitled"
                        required
                    />
                    <p>.cv</p>
                </div>

                <!-- Preview Section -->
                <div
                    v-if="showPreview"
                    id="export-project-preview-div"
                    title="Export Preview"
                >
                    <div v-if="isLoading" class="previewLoading">
                        <v-progress-circular
                            indeterminate
                            size="24"
                            width="2"
                            color="white"
                        />
                        <span>Generating preview...</span>
                    </div>
                    <div v-else-if="previewError" class="previewError">
                        <v-icon color="red" size="small"
                            >mdi-alert-circle</v-icon
                        >
                        <span>{{ previewError }}</span>
                    </div>
                    <Codemirror
                        v-else-if="previewData"
                        id="export-project-code-window"
                        :value="previewData"
                        :options="cmOptions"
                        border
                        :height="300"
                        :width="700"
                    />
                    <div v-else class="previewError">
                        <v-icon color="orange" size="small"
                            >mdi-information</v-icon
                        >
                        <span>No preview data available.</span>
                    </div>
                </div>
            </v-card-text>
            <v-card-actions>
                <v-btn
                    class="messageBtn"
                    block
                    :disabled="isLoading"
                    @click="previewProject"
                >
                    {{ showPreview ? 'Refresh Preview' : 'Preview' }}
                </v-btn>
                <v-btn
                    class="messageBtn"
                    block
                    :disabled="isLoading"
                    @click="exportAsFile"
                >
                    Save
                </v-btn>
                <v-btn
                    class="messageBtn"
                    block
                    :disabled="isLoading"
                    @click="copyClipboard()"
                >
                    Copy to Clipboard
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import { ref } from 'vue'
import { useState } from '#/store/SimulatorStore/state'
import { useProjectStore } from '#/store/projectStore'
import { generateSaveData } from '#/simulator/src/data/save'
import { downloadFile, copyToClipboard, showMessage } from '#/simulator/src/utils'
import { escapeHtml } from '#/simulator/src/utils'

export function ExportProject() {
    const SimulatorState = useState()
    SimulatorState.dialogBox.export_project_dialog = true
    setTimeout(() => {
        const fileNameInputField = document.getElementById(
            'fileNameInputField'
        ) as HTMLInputElement
        fileNameInputField?.select()
    }, 100)
}
</script>

<script lang="ts" setup>
import Codemirror from 'codemirror-editor-vue3'

import 'codemirror/mode/javascript/javascript.js'

import 'codemirror/theme/dracula.css'

const SimulatorState = useState()
const projectStore = useProjectStore()

const fileNameInput = ref(projectStore.getProjectName || 'untitled')


const showPreview = ref(false)
const previewData = ref('')
const previewError = ref('')
const isLoading = ref(false)

const cmOptions = ref({
    mode: 'application/json',
    autoRefresh: true,
    styleActiveLine: true,
    lineNumbers: true,
    readOnly: true,
    autoCloseBrackets: true,
    smartIndent: true,
    indentWithTabs: true,
})

function closeDialog() {
    showPreview.value = false
    previewData.value = ''
    previewError.value = ''
    isLoading.value = false
    SimulatorState.dialogBox.export_project_dialog = false
}

async function generateCircuitDataString(): Promise<string | null> {
    try {
        const data = await generateSaveData(
            projectStore.getProjectName,
            false
        )
        if (data instanceof Error) {
            return null
        }
        if (
            !data ||
            (typeof data === 'object' && Object.keys(data).length === 0)
        ) {
            return null
        }
        return JSON.stringify(data, null, 2)
    } catch (err) {
        console.error('Failed to generate circuit data:', err)
        return null
    }
}

async function previewProject() {
    isLoading.value = true
    previewError.value = ''
    showPreview.value = true

    const dataStr = await generateCircuitDataString()

    if (dataStr === null) {
        previewError.value =
            'Failed to generate preview. The circuit may be empty or the operation was cancelled.'
        isLoading.value = false
        return
    }

    previewData.value = dataStr
    isLoading.value = false
}

async function exportAsFile() {
    isLoading.value = true
    let fileName = escapeHtml(fileNameInput.value) || 'untitled'

    const dataStr = previewData.value || (await generateCircuitDataString())

    if (!dataStr) {
        showMessage('Export failed – could not generate circuit data.')
        isLoading.value = false
        return
    }

    fileName = `${fileName.replace(/[^a-z0-9]/gi, '_')}.cv`
    try {
        await downloadFile(fileName, dataStr)
    } catch (err) {
        console.error('Export failed:', err)
        showMessage('Export failed – could not save the file.')
        isLoading.value = false
        return
    }
    closeDialog()
}


async function copyClipboard() {
    isLoading.value = true

    const dataStr = previewData.value || (await generateCircuitDataString())

    if (!dataStr) {
        showMessage('Copy failed – could not generate circuit data.')
        isLoading.value = false
        return
    }

    const success = await copyToClipboard(dataStr)
    if (success) {
        showMessage('Circuit data copied to clipboard')
    } else {
        showMessage('Failed to copy circuit data to clipboard.')
    }
    closeDialog()
}
</script>

<style scoped>
.exportProjectCard {
    height: auto;
    width: auto;
    max-width: 48rem;
    justify-content: center;
    margin: auto;
    backdrop-filter: blur(5px);
    border-radius: 5px;
    border: 0.5px solid var(--br-primary) !important;
    background: var(--bg-primary-moz) !important;
    background-color: var(--bg-primary-chr) !important;
    color: white;
}

/* media query for .messageBoxContent */
@media screen and (max-width: 991px) {
    .exportProjectCard {
        width: 100%;
    }
}
.fileNameInput {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 1rem;
}

.fileNameInput p {
    white-space: nowrap;
}

.fileNameInput input {
    text-align: center;
}

/* ── Preview Section ── */
#export-project-preview-div {
    margin-top: 1rem;
}

.previewLoading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1.5rem;
    font-size: 0.85rem;
    color: #aaa;
}

.previewError {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.75rem;
    font-size: 0.82rem;
    color: #ff6b6b;
}
</style>

<!-- For any bugs refer to SaveAs.js file in main repo -->
