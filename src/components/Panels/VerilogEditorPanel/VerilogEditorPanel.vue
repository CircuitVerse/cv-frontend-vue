<template>
    <div class="verilog-editor-container">
        <div id="code-window" class="code-window">
            <textarea id="codeTextArea"></textarea>
        </div>
        <div
            id="verilogEditorPanel"
            class="noSelect defaultCursor draggable-panel draggable-panel-css"
        >
            <PanelHeader
                :header-title="$t('simulator.panel_header.verilog_module')"
            />

            <div class="panel-body">
                <div class="layout-body">
                    <button
                        class="largeButton btn btn-xs custom-btn--tertiary"
                        @click="resetVerilogCode"
                    >
                        {{ $t('simulator.panel_body.verilog_module.reset_code') }}
                    </button>
                    <button
                        class="largeButton btn btn-xs custom-btn--primary"
                        @click="saveVerilogCode"
                    >
                        {{ $t('simulator.panel_body.verilog_module.save_code') }}
                    </button>
                    <button
                        class="largeButton btn btn-xs custom-btn--secondary"
                        @click="toggleTerminal"
                    >
                        <i class="fas fa-terminal"></i>
                        {{ verilogStore.isTerminalVisible ? 'Hide' : 'Show' }} Terminal
                    </button>
                    <div id="verilogOutput">
                        {{
                            $t(
                                'simulator.panel_body.verilog_module.module_in_experiment_notice'
                            )
                        }}
                    </div>
                </div>
            </div>

            <div class="panel-header text-center">
                {{ $t('simulator.panel_body.verilog_module.apply_themes') }}
            </div>
            <div class="panel-body">
                <div class="layout-body">
                    <div>
                        <p class="text-center mb-2">
                            {{
                                $t(
                                    'simulator.panel_body.verilog_module.select_theme'
                                )
                            }}
                        </p>
                        <select 
                            v-model="verilogStore.selectedTheme" 
                            class="applyTheme"
                            @change="(e) => verilogStore.setTheme((e.target as HTMLSelectElement).value)"
                        >
                            <optgroup
                                v-for="optgroup in Themes"
                                :key="optgroup.label"
                                :label="optgroup.label"
                            >
                                <option
                                    v-for="option in optgroup.options"
                                    :key="option.value"
                                >
                                    {{ option.value }}
                                </option>
                            </optgroup>
                        </select>
                    </div>
                </div>
            </div>
        </div>
        <VerilogTerminal ref="verilogTerminal" />
    </div>
</template>

<script lang="ts" setup>
import Themes from '../../../assets/constants/Panels/VerilogEditorPanel/THEMES.json'
import {
    saveVerilogCode,
    resetVerilogCode,
    applyVerilogTheme,
} from '../../../simulator/src/Verilog2CV'
import PanelHeader from '../Shared/PanelHeader.vue'
import VerilogTerminal from './VerilogTerminal.vue'
import { ref, watch, onMounted, nextTick } from 'vue'
import { useVerilogStore } from '../../../store/verilogStore'

const verilogStore = useVerilogStore()
const verilogTerminal = ref<InstanceType<typeof VerilogTerminal>>()

const toggleTerminal = () => {
    verilogStore.toggleTerminal()
}

onMounted(() => {
    nextTick(() => {
        if (typeof window !== 'undefined' && verilogTerminal.value) {
            (window as any).verilogTerminal = verilogTerminal.value
        }
    })
})

watch(() => verilogStore.selectedTheme, (newTheme: string) => {
    applyVerilogTheme(newTheme)
})

defineExpose({
    addTerminalMessage: (text: string, type: 'info' | 'error' | 'success' = 'info') => {
        verilogTerminal.value?.addMessage(text, type)
    },
    clearTerminal: () => {
        verilogTerminal.value?.clearOutput()
    },
    showTerminal: () => {
        verilogStore.showTerminal()
    }
})
</script>

<style>
.applyTheme {
    width: 90%;
    border: 1px solid #fff;
    padding: 8px;
}

.custom-btn--secondary {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
}

.custom-btn--secondary i {
    font-size: 12px;
}

.code-window .CodeMirror {
    overflow: visible !important;
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
}

.code-window .CodeMirror-scroll {
    overflow: auto !important;
    max-width: 100% !important;
}

.code-window .CodeMirror pre {
    white-space: pre-wrap !important;
    word-wrap: break-word !important;
    word-break: break-all !important;
    max-width: 100% !important;
    overflow: visible !important;
}

.code-window .CodeMirror-line {
    white-space: pre-wrap !important;
    word-wrap: break-word !important;
    word-break: break-all !important;
}

.code-window {
    overflow: visible !important;
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
}
</style>
