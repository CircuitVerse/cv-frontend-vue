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
import 'codemirror/addon/lint/lint.js'
import 'codemirror/addon/lint/lint.css'
import { lintVerilog } from './verilogLinter.js'

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

export default function generateVerilogCircuit(
    verilogCode,
    scope = globalScope
) {
    clearVerilogOutput()
    setVerilogOutput('Compiling Verilog code...', 'info')

    // clear any previous Yosys error markers from the editor
    if (editor && editor.state) {
        editor.state.yosysAnnotations = []
        editor.performLint()
    }

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
        })
        .catch((error) => {
            if (error.status == 500) {
                showError('Could not connect to Yosys')
                setVerilogOutput('Could not connect to Yosys server', 'error')
            } else {
                showError('There is some issue with the code')
                error.json().then((errorMessage) => {
                    const raw = errorMessage.message || ''
                    setVerilogOutput(raw, 'error')
                    // parse Yosys errors and show them as gutter markers in the editor
                    const annotations = parseYosysErrors(raw)
                    if (annotations.length > 0) {
                        showYosysErrors(annotations)
                    }
                })
            }
        })
}

/**
 * Parses raw Yosys error output and converts it into CodeMirror annotation objects.
 * Yosys errors look like: "input.v:5: ERROR: syntax error, unexpected TOK_ID"
 * We extract the line number, severity (error/warning), and message from each line.
 * @param {string} yosysOutput - Raw error string returned from the Yosys server
 * @returns {Object[]} Array of CodeMirror lint annotation objects with from, to, message, severity
 */
function parseYosysErrors(yosysOutput) {
    const annotations = []
    const lines = yosysOutput.split('\n')

    // matches "filename:lineNumber: ERROR/WARNING: message"
    const errorRegex = /(?:[\w./\\-]*):(\d+):\s*(ERROR|WARNING|error|warning)[:\s]+(.*)/

    lines.forEach((line) => {
        const match = line.match(errorRegex)
        if (match) {
            // CodeMirror lines are 0-indexed, Yosys lines are 1-indexed
            const lineNum = parseInt(match[1], 10) - 1
            const severity = match[2].toLowerCase().startsWith('w') ? 'warning' : 'error'
            const message = match[3].trim()

            annotations.push({
                from: { line: lineNum, ch: 0 },
                to: { line: lineNum, ch: 999 },
                message: `[Yosys] ${message}`,
                severity: severity,
            })
        }
    })

    return annotations
}

/**
 * Takes Yosys error annotations and displays them as lint markers in the CodeMirror editor.
 * We store them on editor.state so they persist until the next compilation run.
 * Both the static linter errors and the Yosys errors are shown together in the gutter.
 * @param {Object[]} annotations - Array of CodeMirror lint annotation objects
 * @returns {void}
 */
function showYosysErrors(annotations) {
    if (!editor) return

    // store Yosys errors so the lint getAnnotations function can include them
    editor.state.yosysAnnotations = annotations

    // merge Yosys errors with the static linter errors and re-run lint
    editor.setOption('lint', {
        getAnnotations: function(code) {
            const linterErrors = lintVerilog(code)
            const yosysErrors = editor.state.yosysAnnotations || []
            return [...linterErrors, ...yosysErrors]
        },
        async: false,
    })

    // force the gutter markers to update immediately
    editor.performLint()
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
        // real-time linter - runs on every keystroke
        // also shows Yosys errors after compilation
        lint: {
            getAnnotations: function(code) {
                const linterErrors = lintVerilog(code)
                const yosysErrors = (editor && editor.state && editor.state.yosysAnnotations) || []
                return [...linterErrors, ...yosysErrors]
            },
            async: false,
        },
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-lint-markers'],
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