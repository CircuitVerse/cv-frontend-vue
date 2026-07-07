<template>
    <v-dialog
        v-model="SimulatorState.dialogBox.export_canonical_dialog"
        :persistent="false"
    >
        <v-card class="messageBoxContent">
            <v-card-text>
                <p class="dialogHeader">Export Canonical</p>
                <v-btn
                    size="x-small"
                    icon
                    class="dialogClose"
                    @click="SimulatorState.dialogBox.export_canonical_dialog = false"
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
                <p v-if="canonicalError" class="canonical-error">{{ canonicalError }}</p>
                <div id="export-canonical-code-window-div" title="Export Canonical">
                    <Codemirror
                        id="export-canonical-code-window"
                        :value="previewCode"
                        :options="cmOptions"
                        border
                        :height="300"
                        :width="700"
                    />
                </div>
            </v-card-text>
            <v-card-actions>
                <v-btn class="messageBtn cvBtn" block @click="downloadCanonical()">
                    Download .cv
                </v-btn>
                <v-btn class="messageBtn cvBtn" block @click="copyToClipboardAction()">
                    Copy to Clipboard
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import { useState } from '#/store/SimulatorStore/state'

export function ExportCanonical() {
    const SimulatorState = useState()
    SimulatorState.dialogBox.export_canonical_dialog = true
}
</script>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useState } from '#/store/SimulatorStore/state'
import { canonicaliseProject } from '#/simulator/src/data/canonical'
import { copyToClipboard, downloadFile, showMessage } from '#/simulator/src/utils'
import { scopeList } from '#/simulator/src/circuit'
import { getProjectName } from '#/simulator/src/data/save'
import Codemirror from 'codemirror-editor-vue3'
import 'codemirror/mode/javascript/javascript.js'
import 'codemirror/theme/dracula.css'

const SimulatorState = useState()

const previewCode = ref('')
const canonicalError = ref('')
const cmOptions = ref({})

async function generateCanonical(): Promise<string> {
    const data = await canonicaliseProject(Object.values(scopeList ?? {}))
    return JSON.stringify(data, null, 2)
}

onMounted(async () => {
    cmOptions.value = {
        mode: 'application/json',
        theme: 'dracula',
        lineNumbers: true,
        readOnly: true,
        autoRefresh: true,
    }
    try {
        previewCode.value = await generateCanonical()
        canonicalError.value = ''
    } catch (err) {
        previewCode.value = ''
        canonicalError.value = err instanceof Error
            ? `Failed to generate JSON: ${err.message}`
            : 'Failed to generate JSON. Please check your circuit and try again.'
    }
})

function downloadCanonical() {
    if (canonicalError.value) return
    const name = getProjectName() || 'Untitled'
    downloadFile(name + '.cv', previewCode.value)
    SimulatorState.dialogBox.export_canonical_dialog = false
}

function copyToClipboardAction() {
    if (canonicalError.value) return
    copyToClipboard(previewCode.value)
    showMessage('Canonical data copied to clipboard')
    SimulatorState.dialogBox.export_canonical_dialog = false
}
</script>

<style scoped>
.dialogHeader {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    text-align: center;
}
:deep(#export-canonical-code-window .CodeMirror) {
    width: 100% !important;
}
.cvBtn {
    border: 1px solid #ffffff !important;
}
.cvBtn:focus,
.cvBtn:focus-visible,
.cvBtn:active {
    border: 1px solid #ffffff !important;
    outline: none !important;
    box-shadow: none !important;
}
.canonical-error {
    color: #f87171;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
    text-align: center;
}
.dialogClose {
    position: absolute;
    top: 5px;
    right: 5px;
}
</style>
