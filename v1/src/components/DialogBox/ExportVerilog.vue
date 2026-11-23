<template>
    <v-dialog
        v-model="SimulatorState.dialogBox.exportverilog_dialog"
        :persistent="false"
    >
        <v-card class="messageBoxContent">
            <v-card-text>
                <p class="dialogHeader">Export Verilog</p>
                <v-btn
                    size="x-small"
                    icon
                    class="dialogClose"
                    @click="
                        SimulatorState.dialogBox.exportverilog_dialog = false
                    "
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
                <div id="verilog-export-code-window-div" title="Export Verilog">
                    <Codemirror
                        id="verilog-export-code-window"
                        :value="code"
                        :options="cmOptions"
                        border
                        :height="300"
                        :width="700"
                        @change="onCodeChange"
                    />
                </div>
                <v-alert
                    v-if="validationStatus"
                    :type="validationStatus.type"
                    :icon="
                        validationStatus.type === 'success'
                            ? 'mdi-check-circle'
                            : validationStatus.type === 'error'
                              ? 'mdi-alert-circle'
                              : 'mdi-progress-clock'
                    "
                    density="compact"
                    variant="tonal"
                    class="mt-3 validation-alert"
                    closable
                    @click:close="validationStatus = null"
                >
                    <span class="validation-message">{{ validationStatus.message }}</span>
                </v-alert>
            </v-card-text>
            <v-card-actions>
                <v-btn
                    class="messageBtn"
                    :loading="isValidating"
                    :disabled="isValidating"
                    block
                    @click="validateVerilogCode()"
                >
                    <v-icon start>mdi-check-decagram</v-icon>
                    Validate Verilog
                </v-btn>
                <v-btn class="messageBtn" block @click="downloadVerilog()">
                    Download Verilog File
                </v-btn>
                <v-btn class="messageBtn" block @click="copyClipboard()">
                    Copy to Clipboard
                </v-btn>
                <v-btn class="messageBtn" block @click="edaPlayground()">
                    Try in EDA Playground
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue'
import { useState } from '#/store/SimulatorStore/state'
const SimulatorState = useState()
import Codemirror from 'codemirror-editor-vue3'

// language
import 'codemirror/mode/javascript/javascript.js'
import 'codemirror/mode/verilog/verilog.js'

// theme
import 'codemirror/theme/dracula.css'
import 'codemirror/theme/eclipse.css'
import { verilog } from '#/simulator/src/verilog'
import {
    copyToClipboard,
    downloadFile,
    openInNewTab,
    showMessage,
} from '#/simulator/src/utils'
import { getProjectName } from '#/simulator/src/data/save'
import { validateVerilog } from '#/simulator/src/synthesis/clientSynthesis.js'

interface ValidationStatus {
    type: 'success' | 'error' | 'info'
    message: string
}

const code = ref('')
const cmOptions = ref({})
const isValidating = ref(false)
const validationStatus = ref<ValidationStatus | null>(null)

watch(
    () => SimulatorState.dialogBox.exportverilog_dialog,
    (isOpen) => {
        if (isOpen) {
            code.value = verilog.exportVerilog()
            validationStatus.value = null
        }
    }
)

onMounted(() => {
    SimulatorState.dialogBox.exportverilog_dialog = false
    code.value = verilog.exportVerilog()
    cmOptions.value = {
        mode: 'verilog',
        autoRefresh: true,
        styleActiveLine: true,
        lineNumbers: true,
        autoCloseBrackets: true,
        smartIndent: true,
        indentWithTabs: true,
        extraKeys: { 'Ctrl-Space': 'autocomplete' },
    }
})

function onCodeChange(newCode: string) {
    code.value = newCode
    validationStatus.value = null
}

async function validateVerilogCode() {
    if (isValidating.value) return
    isValidating.value = true
    validationStatus.value = {
        type: 'info',
        message: 'Validating Verilog syntax with Yosys WASM...',
    }

    try {
        const result = (await validateVerilog(code.value, (progress: string) => {
            validationStatus.value = {
                type: 'info',
                message: progress,
            }
        })) as { valid: boolean; message: string }

        validationStatus.value = {
            type: 'success',
            message: result?.message || 'Syntax Valid & Synthesizable',
        }
    } catch (err: any) {
        validationStatus.value = {
            type: 'error',
            message: err?.message || 'Syntax error detected in Verilog code',
        }
    } finally {
        isValidating.value = false
    }
}

function downloadVerilog() {
    let fileName = getProjectName() || 'Untitled'
    downloadFile(fileName + '.v', code.value)
    SimulatorState.dialogBox.exportverilog_dialog = false
}
function copyClipboard() {
    copyToClipboard(code.value)
    showMessage('Code has been copied')
    SimulatorState.dialogBox.exportverilog_dialog = false
}
function edaPlayground() {
    copyToClipboard(code.value)
    openInNewTab('https://www.edaplayground.com/x/XZpY')
    SimulatorState.dialogBox.exportverilog_dialog = false
}
</script>

<style scoped>
.validation-alert {
    font-size: 0.875rem;
    word-break: break-word;
    white-space: pre-line;
}
.validation-message {
    font-weight: 500;
}
</style>
