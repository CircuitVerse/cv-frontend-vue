<template>
    <div
        v-if="verilogStore.isTerminalVisible"
        class="verilog-terminal"
        :style="{ height: terminalHeight + 'px' }"
    >
        <div class="terminal-header" @mousedown="startDragging">
            <div class="terminal-title">
                <i class="fas fa-terminal"></i>
                <span>Verilog Output</span>
            </div>
        </div>

        <div class="terminal-content" ref="terminalContent">
            <div class="terminal-output">
                <div v-if="!messages.length" class="default-message">
                    {{ $t('simulator.panel_body.verilog_module.module_in_experiment_notice') }}
                </div>
                <div
                    v-for="(message, index) in messages"
                    :key="index"
                    :class="['message', message.type]"
                >
                    <span class="timestamp">{{ formatTime(message.timestamp) }}</span>
                    <span class="message-text">{{ message.text }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, nextTick, readonly, watch } from 'vue'
import { useVerilogStore } from '../../../store/verilogStore'

interface Message {
    text: string
    type: 'info' | 'error' | 'success'
    timestamp: Date
}

const verilogStore = useVerilogStore()
const terminalHeight = ref(200)
const messages = ref<Message[]>([])
const terminalContent = ref<HTMLElement>()

let isDragging = false
let startY = 0

// Watch store visibility to trigger side effects
watch(
    () => verilogStore.isTerminalVisible,
    () => {
        adjustCodeWindowHeight()
    }
)

const adjustCodeWindowHeight = () => {
    const codeWindow = document.getElementById('code-window')
    const codeMirror = codeWindow?.querySelector('.CodeMirror')
    
    if (codeWindow && codeMirror) {
        if (verilogStore.isTerminalVisible) {
            const currentTerminalHeight = terminalHeight.value
            ;(codeMirror as HTMLElement).style.height = `calc(100vh - 78px - ${currentTerminalHeight}px)`
            ;(codeMirror as HTMLElement).style.width = '100%'
            ;(codeMirror as HTMLElement).style.maxWidth = '100%'
            codeWindow.style.paddingBottom = '0'
            codeWindow.style.marginBottom = '0'
            codeWindow.style.width = '100%'
            codeWindow.style.maxWidth = '100%'
            codeWindow.style.overflow = 'hidden'
        } else {
            ;(codeMirror as HTMLElement).style.height = 'calc(100vh - 78px)'
            ;(codeMirror as HTMLElement).style.width = '100%'
            ;(codeMirror as HTMLElement).style.maxWidth = '100%'
            codeWindow.style.paddingBottom = '0'
            codeWindow.style.marginBottom = '0'
            codeWindow.style.width = '100%'
            codeWindow.style.maxWidth = '100%'
            codeWindow.style.overflow = 'hidden'
        }
        
        if ((window as any).editor && (window as any).editor.refresh) {
            (window as any).editor.refresh()
        }
    }
}

const addMessage = (text: string, type: 'info' | 'error' | 'success' = 'info') => {
    messages.value.push({
        text,
        type,
        timestamp: new Date()
    })
    
    nextTick(() => {
        if (terminalContent.value && verilogStore.isTerminalVisible) {
            terminalContent.value.scrollTop = terminalContent.value.scrollHeight
        }
    })
}

const clearOutput = () => {
    messages.value = []
}

const startDragging = (e: MouseEvent) => {
    if (isDragging) return
    isDragging = true
    startY = e.clientY
    document.addEventListener('mousemove', handleDragging)
    document.addEventListener('mouseup', stopDragging)
    e.preventDefault()
}

const handleDragging = (e: MouseEvent) => {
    if (!isDragging) return
    
    const deltaY = startY - e.clientY
    const newHeight = Math.max(100, Math.min(600, terminalHeight.value + deltaY))
    terminalHeight.value = newHeight
    startY = e.clientY
    adjustCodeWindowHeight()
}

const stopDragging = () => {
    isDragging = false
    document.removeEventListener('mousemove', handleDragging)
    document.removeEventListener('mouseup', stopDragging)
}

const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    })
}

defineExpose({
    addMessage,
    clearOutput,
    showTerminal: verilogStore.showTerminal,
    closeTerminal: verilogStore.hideTerminal,
    toggleTerminal: verilogStore.toggleTerminal,
    isVisible: readonly(() => verilogStore.isTerminalVisible)
})

onUnmounted(() => {
    document.removeEventListener('mousemove', handleDragging)
    document.removeEventListener('mouseup', stopDragging)
})
</script>

<style scoped>
.verilog-terminal {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--bg-primary, #1e1e1e);
    border-top: 1px solid var(--br-primary, #333);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    font-family: 'JetBrains Mono', 'Consolas', monospace;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
    margin: 0;
    padding: 0;
    transform: translateZ(0);
    will-change: height;
}

.terminal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: var(--bg-navbar, #2d2d2d);
    border-bottom: 1px solid var(--br-primary, #333);
    cursor: grab;
    user-select: none;
}

.terminal-header:active {
    cursor: grabbing;
}

.terminal-title {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-lite, #ffffff);
    font-size: 13px;
    font-weight: 500;
}

.terminal-title i {
    font-size: 12px;
    opacity: 0.8;
}

.terminal-content {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    background: var(--bg-primary, #1e1e1e);
}

.terminal-output {
    color: var(--text-lite, #ffffff);
    font-size: 13px;
    line-height: 1.4;
}

.default-message {
    color: var(--text-panel, #cccccc);
    font-style: italic;
    opacity: 0.8;
}

.message {
    margin-bottom: 4px;
    display: flex;
    gap: 8px;
}

.timestamp {
    color: var(--text-panel, #888888);
    font-size: 11px;
    min-width: 70px;
    opacity: 0.7;
}

.message-text {
    flex: 1;
    word-wrap: break-word;
}

.message.error {
    color: #ff6b6b;
}

.message.error .message-text {
    color: #ff6b6b;
}

.message.success {
    color: #51cf66;
}

.message.success .message-text {
    color: #51cf66;
}

.message.info {
    color: var(--text-lite, #ffffff);
}

/* Scrollbar styling */
.terminal-content::-webkit-scrollbar {
    width: 8px;
}

.terminal-content::-webkit-scrollbar-track {
    background: var(--bg-primary, #1e1e1e);
}

.terminal-content::-webkit-scrollbar-thumb {
    background: var(--bg-secondary, #555);
    border-radius: 4px;
}

.terminal-content::-webkit-scrollbar-thumb:hover {
    background: var(--bg-text, #777);
}

.verilog-terminal {
    animation: slideUp 0.3s ease;
}

@keyframes slideUp {
    from {
        transform: translateY(100%);
    }
    to {
        transform: translateY(0);
    }
}

:global(.code-window) {
    transition: all 0.2s ease;
}

:global(.code-window .CodeMirror) {
    transition: height 0.2s ease;
    overflow: hidden !important;
    width: 100% !important;
    box-sizing: border-box !important;
}

:global(.code-window .CodeMirror-scroll) {
    overflow: hidden !important;
    max-width: 100% !important;
    word-wrap: break-word !important;
}

:global(.code-window .CodeMirror-lines) {
    padding: 4px 8px !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
}

:global(.code-window .CodeMirror pre) {
    white-space: pre-wrap !important;
    word-wrap: break-word !important;
    word-break: break-all !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
}

:global(.code-window .CodeMirror-gutters) {
    min-width: auto !important;
}
</style>
