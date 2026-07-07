<template>
    <v-dialog
        v-model="SimulatorState.dialogBox.export_project_dialog"
        :persistent="true"
    >
        <v-card class="messageBoxContent">
            <v-card-text>
                <p class="dialogHeader">{{ $t('simulator.nav.project.export_as_file') }}</p>
                <v-btn
                    size="x-small"
                    icon
                    class="dialogClose"
                    @click="SimulatorState.dialogBox.export_project_dialog = false"
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
                <p v-if="exportError" class="export-error">{{ exportError }}</p>
                <div id="export-code-window-div" title="Export Project">
                    <Codemirror
                        id="export-code-window"
                        :value="previewCode"
                        :options="cmOptions"
                        border
                        :height="300"
                        :width="700"
                    />
                </div>
            </v-card-text>
            <v-card-actions>
                <v-btn class="messageBtn exportBtn" block @click="onDownload()">
                    {{ $t('simulator.export.download_btn') }}
                </v-btn>
                <v-btn class="messageBtn exportBtn" block @click="onCopy()">
                    {{ $t('simulator.export.copy_btn') }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import { useState } from '#/store/SimulatorStore/state'

export function ExportProject() {
    const SimulatorState = useState()
    SimulatorState.dialogBox.export_project_dialog = true
}
</script>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useState } from '#/store/SimulatorStore/state'
import { useProjectStore } from '#/store/projectStore'
import { canonicaliseProject } from '#/simulator/src/data/canonical'
import { copyToClipboard, downloadFile, showMessage } from '#/simulator/src/utils'
import { scopeList } from '#/simulator/src/circuit'
import Codemirror from 'codemirror-editor-vue3'
import 'codemirror/mode/javascript/javascript.js'
import 'codemirror/theme/dracula.css'

const SimulatorState = useState()
const projectStore = useProjectStore()
const { t } = useI18n()

const previewCode = ref('')
const exportError = ref('')
const cmOptions = ref({})

async function generateExport(): Promise<string> {
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
        previewCode.value = await generateExport()
        exportError.value = ''
    } catch (err) {
        previewCode.value = ''
        exportError.value = err instanceof Error
            ? `${t('simulator.export.generate_error_prefix')}: ${err.message}`
            : t('simulator.export.generate_error')
    }
})

function onDownload() {
    if (exportError.value) return
    const name = projectStore.getProjectName || 'Untitled'
    downloadFile(name + '.cv', previewCode.value)
    SimulatorState.dialogBox.export_project_dialog = false
}

function onCopy() {
    if (exportError.value) return
    copyToClipboard(previewCode.value)
    showMessage(t('simulator.export.copy_success'))
    SimulatorState.dialogBox.export_project_dialog = false
}
</script>

<style scoped>
.dialogHeader {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    text-align: center;
}
:deep(#export-code-window .CodeMirror) {
    width: 100% !important;
}
.exportBtn {
    border: 1px solid #ffffff !important;
}
.exportBtn:focus,
.exportBtn:focus-visible,
.exportBtn:active {
    border: 1px solid #ffffff !important;
    outline: none !important;
    box-shadow: none !important;
}
.export-error {
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
