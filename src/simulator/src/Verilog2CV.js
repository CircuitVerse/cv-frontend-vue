import {
    createNewCircuitScope,
    switchCircuit,
    changeCircuitName,
} from './circuit'
import SubCircuit from './subcircuit'
import { simulationArea } from './simulationArea'
import CodeMirror from 'codemirror/lib/codemirror.js'
import 'codemirror/lib/codemirror.css'

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
import { update } from './engine'
import { showProperties } from './ux'
import { useSimulatorMobileStore } from '#/store/simulatorMobileStore'
import { toRefs } from 'vue'

var editor
var verilogMode = false

// â”€â”€â”€ WASM worker state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
var wasmWorker = null
var wasmReady = false

function initWasmWorker() {
    if (wasmWorker) return
    try {
        wasmWorker = new Worker('/yosys-worker.js', { type: 'module' })
        wasmWorker.onmessage = function (e) {
            if (e.data.type === 'ready') {
                wasmReady = true
                console.log('[Yosys WASM] Worker ready')
            } else if (e.data.type === 'error' && !wasmReady) {
                // A load-time error before we've ever gone ready
                console.warn('[Yosys WASM] Worker failed to initialize:', e.data.message)
                wasmWorker = null
                wasmReady = false
            }
        }
        wasmWorker.onerror = function (err) {
            console.warn('[Yosys WASM] Worker init error:', err.message)
            wasmWorker = null
            wasmReady = false
        }
    } catch (err) {
        console.warn('[Yosys WASM] Failed to init worker:', err.message)
    }
}

function shouldUseWasm() {
    if (window.__TAURI__) return true
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
    var code = editor ? editor.getValue() : ''

    // Guard: don't synthesize the placeholder comment
    if (!code || code.trim() === '// Write Some Verilog Code Here!') {
        const ta = document.getElementById('codeTextArea')
        if (ta && ta.value && ta.value.trim() !== '// Write Some Verilog Code Here!') {
            code = ta.value
        }
    }

    console.log('[SaveCode] length:', code.length)
    console.log('[SaveCode] preview:', code.substring(0, 100))
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

// â”€â”€ Helper: does the saved code contain a real module? â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function savedCodeHasModule() {
    const code = globalScope.verilogMetadata && globalScope.verilogMetadata.code
    if (!code) return false
    const stripped = code
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
    return /\bmodule\s+\w+/.test(stripped)
}

export function verilogModeSet(mode) {
    if (mode == verilogMode) return
    verilogMode = mode
    if (mode) {
        const code_window = document.getElementById('code-window')
        if (code_window)
            document.getElementById('code-window').style.display = 'block'

        const elementPanel = document.querySelector('.elementPanel')
        if (elementPanel)
            document.querySelector('.elementPanel').style.display = 'none'

        const timingDiagramPanel = document.querySelector('.timing-diagram-panel')
        if (timingDiagramPanel)
            document.querySelector('.timing-diagram-panel').style.display = 'none'

        const quickBtn = document.querySelector('.quick-btn')
        if (quickBtn)
            document.querySelector('.quick-btn').style.display = 'none'

        const verilogEditorPanel = document.getElementById('verilogEditorPanel')
        if (verilogEditorPanel)
            document.getElementById('verilogEditorPanel').style.display = 'block'

        // Refresh CodeMirror after the panel becomes visible â€”
        // without this it doesn't know its dimensions and getValue() may
        // return stale content.
        if (editor) {
            setTimeout(() => editor.refresh(), 10)
        }

        if (!embed) {
            simulationArea.lastSelected = globalScope.root
            showProperties(undefined)
            showProperties(simulationArea.lastSelected)
        }

        // Only restore saved code if it actually contains a real Verilog module.
        if (savedCodeHasModule()) {
            resetVerilogCode()
        }

    } else {
        const code_window = document.getElementById('code-window')
        if (code_window)
            document.getElementById('code-window').style.display = 'none'

        const elementPanel = document.querySelector('.elementPanel')
        if (elementPanel)
            document.querySelector('.elementPanel').style.display = ''

        const timingDiagramPanel = document.querySelector('.timing-diagram-panel')
        if (timingDiagramPanel)
            document.querySelector('.timing-diagram-panel').style.display = ''

        const quickBtn = document.querySelector('.quick-btn')
        if (quickBtn)
            document.querySelector('.quick-btn').style.display = ''

        const verilogEditorPanel = document.getElementById('verilogEditorPanel')
        if (verilogEditorPanel)
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

        for (let i = 0; i < numInputs; i++) {
            if (this.circuit.data.Input[i].label == portName) {
                return this.circuit.inputNodes[i]
            }
        }

        for (let i = 0; i < numOutputs; i++) {
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
            const subCircuitName = JSON.devices[device].celltype
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

export default function generateVerilogCircuit(
    verilogCode,
    scope = globalScope
) {
    clearVerilogOutput()
    setVerilogOutput('Compiling Verilog code...', 'info')
    const synthBtn = document.querySelector('.save-btn, #saveVerilog, button[onclick*="save"]'); if (synthBtn) { synthBtn.disabled = true; synthBtn.textContent = 'Synthesizing...'; }

    if (shouldUseWasm()) {
        synthesizeWithWasm(verilogCode, scope)
    } else {
        synthesizeWithServer(verilogCode, scope)
    }
}

function synthesizeWithServer(verilogCode, scope) {
    var params = { code: verilogCode }
    fetch('/api/v1/simulator/verilogcv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    })
        .then((response) => {
            if (!response.ok) throw response
            return response.json()
        })
        .then((circuitData) => {
            renderVerilogCircuit(circuitData, verilogCode, scope, 'server')
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

function extractTopModule(code) {
    const stripped = code
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
    const moduleNames = []
    const re = /\bmodule\s+(\w+)/g
    let match
    while ((match = re.exec(stripped)) !== null) {
        moduleNames.push(match[1])
    }
    if (moduleNames.length === 0) return 'top'
    return moduleNames[moduleNames.length - 1]
}

function synthesizeWithWasm(verilogCode, scope) {
    setVerilogOutput('Synthesizing with Yosys WASM (client-side, no server)...', 'info')

    if (!wasmWorker) {
        initWasmWorker()
    }

    if (!wasmReady) {
        setVerilogOutput('Yosys WASM loading (first load ~10-30s)...', 'info')

        var checkReady = setInterval(function () {
            if (wasmReady) {
                clearInterval(checkReady)
                doWasmSynthesis(verilogCode, scope)
            }
        }, 500)

        setTimeout(function () {
            if (!wasmReady) {
                clearInterval(checkReady)
                setVerilogOutput('WASM load timed out after 60s', 'error')
                showError('Yosys WASM failed to load in time')
            }
        }, 60000)
    } else {
        doWasmSynthesis(verilogCode, scope)
    }
}

function doWasmSynthesis(verilogCode, scope) {
    const topModule = extractTopModule(verilogCode)
    const requestId = 'synth-' + Date.now()

    console.log('[WASM] Top module:', topModule)
    console.log('[WASM] Code length:', verilogCode.length)

    // Replace the onmessage handler for this synthesis request.
    // Using requestId lets us safely ignore stale messages from prior runs.
    wasmWorker.onmessage = function (e) {
        var msg = e.data

        // Ignore ready pings and messages from other requests
        if (msg.type === 'ready') return
        if (msg.requestId && msg.requestId !== requestId) return

        if (msg.type === 'success') {
            try {
                // The worker sends raw Yosys JSON.
                // Convert it to the CircuitVerse device/connector format.
                var circuitData = convertYosysToDigitalJs(msg.json, topModule)

                if (!circuitData.devices || Object.keys(circuitData.devices).length === 0) {
                    setVerilogOutput(
                        'Synthesis succeeded but no devices were produced. ' +
                        'Check that all module outputs are driven.',
                        'error'
                    )
                    return
                }

                console.log('[WASM] Devices:', Object.keys(circuitData.devices).length)
                setVerilogOutput('Synthesis complete. Rendering circuit...', 'info')
                renderVerilogCircuit(circuitData, verilogCode, scope, 'WASM')
            } catch (err) {
                console.error('[WASM] Render error:', err)
                setVerilogOutput('Render failed: ' + err.message, 'error')
                showError('Circuit render failed: ' + err.message)
            }
        }

        if (msg.type === 'error') {
            console.error('[WASM] Synthesis error:', msg.message)
            setVerilogOutput('Synthesis error:\n' + msg.message, 'error')
            showError('Yosys WASM synthesis failed')
        }
    }

    wasmWorker.onerror = function (err) {
        console.error('[WASM] Worker crashed:', err)
        setVerilogOutput('Worker error: ' + err.message, 'error')
        wasmWorker = null
        wasmReady = false
    }

    wasmWorker.postMessage({
        verilog: verilogCode,
        topModule: topModule,
        requestId: requestId
    })
}

// â”€â”€â”€ Yosys JSON â†’ CircuitVerse device/connector format â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Converts the raw Yosys JSON (produced by write_json after techmap) into
// the flat { name, devices, connectors, subcircuits } shape that YosysJSON2CV
// and the rest of the CV simulator expect.

function findTopModule(modules, preferred) {
    const names = Object.keys(modules)
    if (preferred && modules[preferred]) return preferred
    for (const n of names) {
        const a = modules[n].attributes || {}
        if (a.top === 1 || a.top === '1') return n
    }
    return names[names.length - 1]
}

function convertYosysToDigitalJs(yosysJson, preferredTop) {
    const modules = yosysJson.modules || {}
    if (!Object.keys(modules).length) throw new Error('No modules in Yosys output')

    const topName = findTopModule(modules, preferredTop)
    const top = modules[topName]

    console.log('[Converter] Top module:', topName)
    console.log('[Converter] Ports:', Object.keys(top.ports || {}))
    console.log('[Converter] Cells:', Object.keys(top.cells || {}))

    const devices = {}
    const connectors = []
    let dc = 0
    const drivers = {}   // bit-index â†’ { id, port }
    const receivers = [] // { bit, id, port }
    let po = 0

    // â”€â”€ Ports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    for (const pName in top.ports) {
        const p = top.ports[pName]
        const id = 'dev' + dc++
        const bits = p.bits || []
        if (p.direction === 'input') {
            devices[id] = { type: 'Input', net: pName, order: po++, bits: bits.length }
            bits.forEach(b => {
                if (typeof b === 'number') drivers[b] = { id, port: 'out' }
            })
        } else if (p.direction === 'output') {
            devices[id] = { type: 'Output', net: pName, order: po++, bits: bits.length }
            bits.forEach(b => {
                if (typeof b === 'number') receivers.push({ bit: b, id, port: 'in' })
            })
        }
    }

    // â”€â”€ Cell type map â€” gate-level primitives produced by techmap â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // techmap emits $_AND_, $_OR_, etc. We also cover the non-gate-level
    // names in case prep was used or techmap is partial.
    const CMAP = {
        '$_AND_':    'And',      '$_OR_':     'Or',       '$_NOT_':   'Not',
        '$_NAND_':   'Nand',     '$_NOR_':    'Nor',      '$_XOR_':   'Xor',
        '$_XNOR_':   'Xnor',    '$_BUF_':    'Repeater', '$_MUX_':   'Mux',
        '$_DFF_P_':  'Dff',      '$_DFF_N_':  'Dff',
        '$_DFFE_PP_':'Dff',      '$_SR_PP_':  'Dff',
        // High-level (pre-techmap) fallbacks
        '$and':      'And',      '$or':       'Or',       '$not':     'Not',
        '$xor':      'Xor',      '$xnor':     'Xnor',
        '$mux':      'Mux',      '$pmux':     'Mux',
        '$reduce_and':'And',     '$reduce_or':'Or',       '$reduce_xor':'Xor',
        '$reduce_bool':'Or',     '$logic_not':'Not',
        '$logic_and':'And',      '$logic_or': 'Or',
        '$dff':      'Dff',      '$adff':     'Dff',      '$buf':     'Repeater',
    }

    // Port name â†’ canonical CV port name
    const IMAP = {
        'A': 'in1', 'B': 'in2', 'S': 'sel',
        'C': 'clk', 'D': 'in',  'R': 'rst', 'E': 'en',
        'CLK': 'clk', 'ARST': 'rst', 'EN': 'en',
    }
    const OMAP = { 'Y': 'out', 'Q': 'out' }

    // â”€â”€ Cells â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    for (const cName in top.cells) {
        const cell = top.cells[cName]
        const type = CMAP[cell.type]
        if (!type) {
            console.warn('[Converter] Skipping unknown cell type:', cell.type)
            continue
        }
        const id = 'dev' + dc++
        devices[id] = { type, label: cName }

        for (const pName in cell.connections) {
            const bits = cell.connections[pName]
            const dir = cell.port_directions?.[pName]
                || (OMAP[pName] ? 'output' : 'input')

            if (dir === 'input') {
                const port = IMAP[pName] || pName.toLowerCase()
                bits.forEach(b => {
                    if (typeof b === 'number') receivers.push({ bit: b, id, port })
                })
            } else if (dir === 'output') {
                const port = OMAP[pName] || pName.toLowerCase()
                bits.forEach(b => {
                    if (typeof b === 'number') drivers[b] = { id, port }
                })
            }
        }
    }

    // â”€â”€ Wire up connectors â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    for (const r of receivers) {
        const d = drivers[r.bit]
        if (d) {
            connectors.push({
                from: { id: d.id, port: d.port },
                to:   { id: r.id, port: r.port },
                source_positions: []
            })
        } else {
            console.warn('[Converter] No driver for bit', r.bit, 'â€” receiver:', r)
        }
    }

    console.log('[Converter] Devices:', Object.keys(devices).length,
        '| Connectors:', connectors.length)

    return { name: topName, devices, connectors, subcircuits: {} }
}

function renderVerilogCircuit(circuitData, verilogCode, scope, source) {
    scope.initialize()
    for (var id of scope.verilogMetadata.subCircuitScopeIds)
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
    scope.verilogMetadata.subCircuitScopeIds = Object.values(subCircuitScope)
    changeCircuitName(circuitData.name)
    showMessage('Verilog Circuit Successfully Created')
    setVerilogOutput('Verilog Circuit Successfully Created (via ' + source + ')', 'success')
    update(scope)
    verilogModeSet(false)
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

    // Force a layout pass once the editor is in the DOM
    requestAnimationFrame(() => editor.refresh())
    setTimeout(() => editor.refresh(), 1)
}




