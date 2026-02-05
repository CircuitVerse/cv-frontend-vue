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
import { isTauri } from '@tauri-apps/api/core'

var editor
var verilogMode = false

export async function createVerilogCircuit() {
    const returned = await createNewCircuitScope(
        undefined,
        undefined,
        true,
        true
    )

    if (returned) {
        verilogModeSet(true)

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
    // TODO: It needs to be handled using pinia after moving it to vue components(Verilog2CV.js)
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

        if (!embed) {
            simulationArea.lastSelected = globalScope.root
            showProperties(undefined)
            showProperties(simulationArea.lastSelected)
        }
        resetVerilogCode()
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

export default async function generateVerilogCircuit(
    verilogCode,
    scope = globalScope
) {
    clearVerilogOutput()
    setVerilogOutput('Compiling Verilog code...', 'info')

    let apiUrl = '/api/v1/simulator/verilogcv'
    let fetchFn = window.fetch

    if (isTauri()) {
        apiUrl = `https://circuitverse.org${apiUrl}`
        try {
            fetchFn = (await import('@tauri-apps/plugin-http')).fetch
        } catch (e) {
            console.warn('Failed to load Tauri HTTP plugin:', e)
        }
    }

    try {
        const response = await fetchFn(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: verilogCode }),
        })

        if (!response.ok) throw response
        if (!response.headers.get('content-type')?.includes('application/json'))
            throw new Error('Invalid JSON response')

        const circuitData = await response.json()

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
        setVerilogOutput('Verilog Circuit Successfully Created', 'success')
    } catch (error) {
        console.error('Verilog compilation error:', error)
        showError('Verilog compilation failed')

        let msg = error.message || 'Unknown error'
        if (error.status === 500) msg = 'Could not connect to Yosys server'
        else if (typeof error.json === 'function') {
            try { msg = (await error.json()).message || msg } catch (e) { }
        }
        setVerilogOutput(msg, 'error')
    }
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
