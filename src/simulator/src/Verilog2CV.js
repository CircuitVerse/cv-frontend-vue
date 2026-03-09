import {
    createNewCircuitScope,
    switchCircuit,
    changeCircuitName,
} from './circuit'
import SubCircuit from './subcircuit'
import { simulationArea } from './simulationArea'
import CodeMirror from 'codemirror/lib/codemirror.js'
import 'codemirror/lib/codemirror.css'

// Importing CodeMirror themes
import 'codemirror/theme/3024-day.css'
import 'codemirror/theme/solarized.css'
import 'codemirror/theme/elegant.css'
import 'codemirror/theme/neat.css'
import 'codemirror/theme/idea.css'
import 'codemirror/theme/neo.css'
import 'codemirror/theme/3024-night.css'
import 'codemirror/theme/blackboard.css'
import 'codemirror/theme/cobalt.css'
import 'codemirror/theme/the-matrix.css'
import 'codemirror/theme/night.css'
import 'codemirror/theme/monokai.css'
import 'codemirror/theme/midnight.css'

import 'codemirror/addon/hint/show-hint.css'
import 'codemirror/mode/verilog/verilog.js'
import 'codemirror/addon/edit/closebrackets.js'
import 'codemirror/addon/edit/matchbrackets.js'
import 'codemirror/addon/hint/anyword-hint.js'
import 'codemirror/addon/hint/show-hint.js'
import 'codemirror/addon/display/autorefresh.js'
import { showError, showMessage } from './utils'
import { showProperties } from './ux'
import { useSimulatorMobileStore } from '#/store/simulatorMobileStore'
import { toRefs } from 'vue'

var editor
var verilogMode = false

// WASM synthesis worker (lazy initialized)
var wasmWorker = null
var wasmReady = false

/**
 * Initialize the Yosys WASM Web Worker for client-side synthesis.
 * This is used for Tauri desktop builds where offline synthesis is needed.
 */
function initWasmWorker() {
    if (wasmWorker) return

    try {
        wasmWorker = new Worker('/yosys-worker.js', { type: 'module' })
        wasmWorker.onmessage = function(e) {
            if (e.data.type === 'ready') {
                wasmReady = true
                console.log('[Yosys WASM] Worker ready for client-side synthesis')
            }
        }
    } catch (err) {
        console.warn('[Yosys WASM] Failed to initialize worker:', err.message)
    }
}

/**
 * Check if WASM synthesis should be used.
 * Enable via: window.__yosysWasmEnabled = true (or via Tauri environment detection)
 */
function shouldUseWasm() {
    // Check for Tauri desktop environment
    if (window.__TAURI__) return true
    // Check for manual override (for testing)
    if (window.__yosysWasmEnabled) return true
    return false
}

export async function createVerilogCircuit() {
    const returned = await createNewCircuitScope(
        undefined,
        undefined,
        true,
        true
    )

    if (returned) {
        verilogModeSet(true)

        // Pre-initialize WASM worker if in desktop mode
        if (shouldUseWasm()) {
            initWasmWorker()
        }

        try {
            const simulatorMobileStore = toRefs(useSimulatorMobileStore())
            simulatorMobileStore.isVerilog.value = true
        } catch (error) {
            console.error('Failed to update simulatorMobileStore:', error)
        }
    }
}

export function saveVerilogCode() {
    var code = editor.getValue()
    globalScope.verilogMetadata.code = code
    generateVerilogCircuit(code)
}

export function applyVerilogTheme(theme) {
    localStorage.setItem('verilog-theme', theme)
    editor.setOption('theme', theme)
}

function setVerilogOutput(text, type = 'info') {
    if (typeof window !== 'undefined' && window.verilogTerminal) {
        window.verilogTerminal.addMessage(text, type)
    } else {
        const verilogOutputDiv = document.getElementById('verilogOutput')
        if (verilogOutputDiv) {
            if (type === 'error') {
                verilogOutputDiv.innerHTML = text
                verilogOutputDiv.style.color = '#ff6b6b'
            } else if (type === 'success') {
                verilogOutputDiv.innerHTML = text
                verilogOutputDiv.style.color = '#51cf66'
            } else {
                verilogOutputDiv.innerHTML = text
                verilogOutputDiv.style.color = ''
            }
        }
    }
}

function clearVerilogOutput() {
    if (typeof window !== 'undefined' && window.verilogTerminal) {
        window.verilogTerminal.clearOutput()
    } else {
        const verilogOutputDiv = document.getElementById('verilogOutput')
        if (verilogOutputDiv) {
            verilogOutputDiv.innerHTML = ''
        }
    }
}

export function resetVerilogCode() {
    editor.setValue(globalScope.verilogMetadata.code)
}

export function hasVerilogCodeChanges() {
    return editor.getValue() != globalScope.verilogMetadata.code
}

export function verilogModeGet() {
    return verilogMode
}

export function verilogModeSet(mode) {
    if (mode == verilogMode) return
    verilogMode = mode
    if (mode) {
        const code_window = document.getElementById('code-window')
        if(code_window)
        document.getElementById('code-window').style.display = 'block'

        const elementPanel = document.querySelector('.elementPanel')
        if(elementPanel)
        document.querySelector('.elementPanel').style.display = 'none'

        const timingDiagramPanel = document.querySelector('.timing-diagram-panel')
        if(timingDiagramPanel)
        document.querySelector('.timing-diagram-panel').style.display = 'none'

        const quickBtn = document.querySelector('.quick-btn')
        if(quickBtn)
        document.querySelector('.quick-btn').style.display = 'none'

        const verilogEditorPanel = document.getElementById('verilogEditorPanel')
        if(verilogEditorPanel)
        document.getElementById('verilogEditorPanel').style.display = 'block'

        if (!embed) {
            simulationArea.lastSelected = globalScope.root
            showProperties(undefined)
            showProperties(simulationArea.lastSelected)
        }
        resetVerilogCode()
    } else {
        const code_window = document.getElementById('code-window')
        if(code_window)
        document.getElementById('code-window').style.display = 'none'

        const elementPanel = document.querySelector('.elementPanel')
        if(elementPanel)
        document.querySelector('.elementPanel').style.display = ''

        const timingDiagramPanel = document.querySelector('.timing-diagram-panel')
        if(timingDiagramPanel)
        document.querySelector('.timing-diagram-panel').style.display = ''

        const quickBtn = document.querySelector('.quick-btn')
        if(quickBtn)
        document.querySelector('.quick-btn').style.display = ''

        const verilogEditorPanel = document.getElementById('verilogEditorPanel')
        if(verilogEditorPanel)
        document.getElementById('verilogEditorPanel').style.display = 'none'
    }
}

import yosysTypeMap from './VerilogClasses'

class verilogSubCircuit {
    constructor(circuit) {
        this.circuit = circuit
    }

    getPort(portName) {
        var numInputs = this.circuit.inputNodes.length
        var numOutputs = this.circuit.outputNodes.length

        for (var i = 0; i < numInputs; i++) {
            if (this.circuit.data.Input[i].label == portName) {
                return this.circuit.inputNodes[i]
            }
        }

        for (var i = 0; i < numOutputs; i++) {
            if (this.circuit.data.Output[i].label == portName) {
                return this.circuit.outputNodes[i]
            }
        }
    }
}

export function YosysJSON2CV(
    JSON,
    parentScope = globalScope,
    name = 'verilogCircuit',
    subCircuitScope = {},
    root = false
) {
    var parentID = parentScope.id
    var subScope
    if (root) {
        subScope = parentScope
    } else {
        subScope = newCircuit(name, undefined, true, false)
    }
    var circuitDevices = {}

    for (var subCircuitName in JSON.subcircuits) {
        var scope = YosysJSON2CV(
            JSON.subcircuits[subCircuitName],
            subScope,
            subCircuitName,
            subCircuitScope
        )
        subCircuitScope[subCircuitName] = scope.id
    }

    for (var device in JSON.devices) {
        var deviceType = JSON.devices[device].type
        if (deviceType == 'Subcircuit') {
            var subCircuitName = JSON.devices[device].celltype
            circuitDevices[device] = new verilogSubCircuit(
                new SubCircuit(
                    500,
                    500,
                    undefined,
                    subCircuitScope[subCircuitName]
                )
            )
        } else {
            circuitDevices[device] = new yosysTypeMap[deviceType](
                JSON.devices[device]
            )
        }
    }

    for (var connection in JSON.connectors) {
        var fromId = JSON.connectors[connection]['from']['id']
        var fromPort = JSON.connectors[connection]['from']['port']
        var toId = JSON.connectors[connection]['to']['id']
        var toPort = JSON.connectors[connection]['to']['port']

        var fromObj = circuitDevices[fromId]
        var toObj = circuitDevices[toId]

        var fromPortNode = fromObj.getPort(fromPort)
        var toPortNode = toObj.getPort(toPort)

        fromPortNode.connect(toPortNode)
    }

    if (!root) {
        switchCircuit(parentID)
        return subScope
    }
}

/**
 * Main entry point for Verilog synthesis.
 * Routes to either WASM (client-side) or server-side synthesis
 * based on the environment (Tauri desktop vs web browser).
 */
export default function generateVerilogCircuit(
    verilogCode,
    scope = globalScope
) {
    clearVerilogOutput()
    setVerilogOutput('Compiling Verilog code...', 'info')

    if (shouldUseWasm()) {
        synthesizeWithWasm(verilogCode, scope)
    } else {
        synthesizeWithServer(verilogCode, scope)
    }
}

/**
 * Server-side synthesis (original approach).
 * Used for web browser builds where the Yosys server is available.
 */
function synthesizeWithServer(verilogCode, scope) {
    var params = { code: verilogCode }
    fetch('/api/v1/simulator/verilogcv', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
    })
        .then((response) => {
            if (!response.ok) {
                throw response
            }
            return response.json()
        })
        .then((circuitData) => {
            renderVerilogCircuit(circuitData, verilogCode, scope)
        })
        .catch((error) => {
            if (error.status == 500) {
                showError('Could not connect to Yosys')
                setVerilogOutput('Could not connect to Yosys server', 'error')
            } else {
                showError('There is some issue with the code')
                error.json().then((errorMessage) => {
                    setVerilogOutput(errorMessage.message, 'error')
                })
            }
        })
}

/**
 * Client-side WASM synthesis using @yowasp/yosys.
 * Used for Tauri desktop builds where offline synthesis is needed
 * and binary size is not a concern.
 *
 * Pipeline: Verilog -> Yosys WASM -> JSON -> yosys2digitaljs -> YosysJSON2CV -> render
 */
function synthesizeWithWasm(verilogCode, scope) {
    setVerilogOutput('Synthesizing with Yosys WASM (client-side, no server)...', 'info')

    // Initialize worker if not already done
    if (!wasmWorker) {
        initWasmWorker()
    }

    // Wait for worker to be ready
    if (!wasmReady) {
        setVerilogOutput('Yosys WASM is loading (first load takes ~10-30s)...', 'info')

        var checkReady = setInterval(function() {
            if (wasmReady) {
                clearInterval(checkReady)
                doWasmSynthesis(verilogCode, scope)
            }
        }, 500)

        // Timeout after 60 seconds
        setTimeout(function() {
            if (!wasmReady) {
                clearInterval(checkReady)
                setVerilogOutput('WASM loading timed out. Falling back to server...', 'error')
                synthesizeWithServer(verilogCode, scope)
            }
        }, 60000)
    } else {
        doWasmSynthesis(verilogCode, scope)
    }
}

function doWasmSynthesis(verilogCode, scope) {
    // Extract top module name from Verilog code
    var topMatch = verilogCode.match(/module\s+(\w+)/)
    var topModule = topMatch ? topMatch[1] : 'top'

    wasmWorker.onmessage = function(e) {
        var msg = e.data
        if (msg.type === 'ready') {
            // Worker already ready, ignore
            return
        }

        if (msg.type === 'success') {
            try {
                setVerilogOutput('Synthesis complete. Rendering circuit...', 'info')

                // The server endpoint returns yosys2digitaljs-transformed data.
                // With WASM we get raw Yosys JSON, so we need to transform it ourselves.
                // yosys2digitaljs is loaded via the render-bundle or needs to be imported.
                if (window.__yosys2digitaljs) {
                    var circuitData = window.__yosys2digitaljs(msg.json, {})
                    renderVerilogCircuit(circuitData, verilogCode, scope)
                } else {
                    // If yosys2digitaljs isn't available client-side,
                    // fall back to sending the raw JSON to server for transformation
                    setVerilogOutput('Client-side transform not available. Falling back to server...', 'info')
                    synthesizeWithServer(verilogCode, scope)
                }
            } catch (err) {
                setVerilogOutput('Render failed: ' + err.message, 'error')
                showError('Circuit render failed: ' + err.message)
            }
        } else if (msg.type === 'error') {
            setVerilogOutput('Synthesis error: ' + msg.message, 'error')
            showError('Yosys WASM: ' + msg.message)
        }
    }

    wasmWorker.postMessage({
        verilog: verilogCode,
        topModule: topModule
    })
}

/**
 * Shared rendering function used by both server and WASM synthesis paths.
 * Takes yosys2digitaljs-formatted circuit data and renders it in CircuitVerse.
 */
function renderVerilogCircuit(circuitData, verilogCode, scope) {
    scope.initialize()
    for (var id in scope.verilogMetadata.subCircuitScopeIds)
        delete scopeList[id]
    scope.verilogMetadata.subCircuitScopeIds = []
    scope.verilogMetadata.code = verilogCode
    var subCircuitScope = {}
    YosysJSON2CV(
        circuitData,
        globalScope,
        'verilogCircuit',
        subCircuitScope,
        true
    )
    changeCircuitName(circuitData.name)
    showMessage('Verilog Circuit Successfully Created')
    setVerilogOutput('Verilog Circuit Successfully Created (via WASM - no server)', 'success')
}

export function setupCodeMirrorEnvironment() {
    var myTextarea = document.getElementById('codeTextArea')

    CodeMirror.commands.autocomplete = function (cm) {
        cm.showHint({ hint: CodeMirror.hint.anyword })
    }

    editor = CodeMirror.fromTextArea(myTextarea, {
        mode: 'verilog',
        autoRefresh: true,
        styleActiveLine: true,
        lineNumbers: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        smartIndent: true,
        indentWithTabs: true,
        extraKeys: { 'Ctrl-Space': 'autocomplete' },
    })

    if (!localStorage.getItem('verilog-theme')) {
        localStorage.setItem('verilog-theme', 'default')
    } else {
        const prevtheme = localStorage.getItem('verilog-theme')
        editor.setOption('theme', prevtheme)
    }

    editor.setValue('// Write Some Verilog Code Here!')
    setTimeout(function () {
        editor.refresh()
    }, 1)
}