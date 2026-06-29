import {
    createNewCircuitScope,
    switchCircuit,
    changeCircuitName,
} from './circuit'
import { synthesizeVerilog } from './synthesis/clientSynthesis.js'
import { computeLayout, computePortLayout } from './synthesis/circuitLayout.js';
import { isTauri } from '@tauri-apps/api/core'
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
import 'codemirror/addon/hint/anyword-hint.js'
import 'codemirror/addon/hint/show-hint.js'
import 'codemirror/addon/display/autorefresh.js'
import { showError, showMessage } from './utils'
import { showProperties } from './ux'
import { useSimulatorMobileStore } from '#/store/simulatorMobileStore'
import { toRefs } from 'vue'

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
            verilogOutputDiv.textContent = text
            if (type === 'error') {
                verilogOutputDiv.style.color = '#ff6b6b'
            } else if (type === 'success') {
                verilogOutputDiv.style.color = '#51cf66'
            } else {
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

function applyVerilogPortLayout(scope) {
    var portLayout = computePortLayout(scope.Input.length, scope.Output.length);

    Object.assign(scope.layout, portLayout.layout);

    for (var i = 0; i < scope.Input.length; i++) {
        scope.Input[i].layoutProperties.x = portLayout.inputs[i].x;
        scope.Input[i].layoutProperties.y = portLayout.inputs[i].y;
    }

    for (var j = 0; j < scope.Output.length; j++) {
        scope.Output[j].layoutProperties.x = portLayout.outputs[j].x;
        scope.Output[j].layoutProperties.y = portLayout.outputs[j].y;
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

    applyVerilogPortLayout(subScope);

    // Auto-layout: compute non-overlapping positions
    var layoutPositions = computeLayout(JSON)
    for (var deviceId in circuitDevices) {
        var pos = layoutPositions[deviceId]
        if (pos && circuitDevices[deviceId].element) {
            circuitDevices[deviceId].element.x = pos.x
            circuitDevices[deviceId].element.y = pos.y
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

// Platform detection: Tauri desktop app vs. web browser

function serverSynthesis(verilogCode) {
    return fetch('/api/v1/simulator/verilogcv', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: verilogCode }),
    }).then((response) => {
        if (!response.ok) {
            throw response
        }
        return response.json()
    })
}

export default function generateVerilogCircuit(
    verilogCode,
    scope = globalScope
) {
    clearVerilogOutput()
    const isDesktop = isTauri()

    if (isDesktop) {
        setVerilogOutput('Compiling Verilog (offline, WASM)...', 'info')
    } else {
        setVerilogOutput('Compiling Verilog code...', 'info')
    }

    var synthesisPromise = isDesktop
        ? synthesizeVerilog(verilogCode, (progress) => {
            setVerilogOutput(progress, 'info')
        })
        : serverSynthesis(verilogCode)

    synthesisPromise
        .then((circuitData) => {
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
            clearVerilogOutput()
        })
        .catch((error) => {
            if (isDesktop) {
                if (error.name === 'SynthesisTimeoutError') {
                    var timeoutMessage =
                        'Synthesis timed out. The worker has been reset; try again or simplify your design.'
                    setVerilogOutput(timeoutMessage, 'error')
                    showError(timeoutMessage)
                } else {
                    setVerilogOutput(error.message || 'Synthesis failed', 'error')
                    showError(error.message || 'Synthesis failed')
                }
            } else if (error instanceof Response) {
                if (error.status == 500) {
                    showError('Could not connect to Yosys')
                    setVerilogOutput('Could not connect to Yosys', 'error')
                } else {
                    showError('There is some issue with the code')
                    error.json()
                        .then((errorMessage) => {
                            setVerilogOutput(errorMessage.message, 'error')
                        })
                        .catch(() => {
                            setVerilogOutput('Server returned a non-JSON error response', 'error')
                        })
                }
            } else {
                showError(error.message || 'Could not reach the synthesis server')
            }
        })
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
