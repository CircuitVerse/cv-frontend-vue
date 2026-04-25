<template>
    <v-dialog
        v-model="SimulatorState.dialogBox.exportverilog_dialog"
        :persistent="false"
    >
        <v-card class="messageBoxContent">
            <v-card-text>
                <p class="dialogHeader">{{ $t('simulator.export_verilog.heading') || $t('simulator.nav.tools.export_verilog') }}</p>
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
                <div id="verilog-export-code-window-div" :title="$t('simulator.nav.tools.export_verilog')">
                    <Codemirror
                        id="verilog-export-code-window"
                        :value="(code = verilog.exportVerilog())"
                        :options="cmOptions"
                        border
                        :height="300"
                        :width="700"
                    />
                </div>
            </v-card-text>
            <v-card-actions>
                <v-btn class="messageBtn" block @click="downloadVerilog()">
                    {{ $t('simulator.export_verilog.download') }}
                </v-btn>
                <v-btn class="messageBtn" block @click="copyClipboard()">
                    {{ $t('simulator.export_verilog.copy') }}
                </v-btn>
                <v-btn class="messageBtn" block @click="edaPlayground()">
                    {{ $t('simulator.export_verilog.eda_playground') }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useState } from '#/store/SimulatorStore/state'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
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
const code = ref('')
const cmOptions = ref({})
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

function downloadVerilog() {
    let fileName = getProjectName() || 'Untitled'
    downloadFile(fileName + '.v', code.value)
    SimulatorState.dialogBox.exportverilog_dialog = false
}
function copyClipboard() {
    copyToClipboard(code.value)
    showMessage(t('simulator.export_verilog.code_copied'))
    SimulatorState.dialogBox.exportverilog_dialog = false
}
function edaPlayground() {
    copyToClipboard(code.value)
    openInNewTab('https://www.edaplayground.com/x/XZpY')
    SimulatorState.dialogBox.exportverilog_dialog = false
}
</script>
