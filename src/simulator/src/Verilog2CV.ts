import {
    createNewCircuitScope,
    switchCircuit,
    changeCircuitName,
} from './circuit';
import SubCircuit from './subcircuit';
import { simulationArea } from './simulationArea';
import CodeMirror from 'codemirror/lib/codemirror.js';
import 'codemirror/lib/codemirror.css';

// Importing CodeMirror themes
import 'codemirror/theme/3024-day.css';
import 'codemirror/theme/solarized.css';
import 'codemirror/theme/elegant.css';
import 'codemirror/theme/neat.css';
import 'codemirror/theme/idea.css';
import 'codemirror/theme/neo.css';
import 'codemirror/theme/3024-night.css';
import 'codemirror/theme/blackboard.css';
import 'codemirror/theme/cobalt.css';
import 'codemirror/theme/the-matrix.css';
import 'codemirror/theme/night.css';
import 'codemirror/theme/monokai.css';
import 'codemirror/theme/midnight.css';

import 'codemirror/addon/hint/show-hint.css';
import 'codemirror/mode/verilog/verilog.js';
import 'codemirror/addon/edit/closebrackets.js';
import 'codemirror/addon/hint/anyword-hint.js';
import 'codemirror/addon/hint/show-hint.js';
import 'codemirror/addon/display/autorefresh.js';
import { showError, showMessage } from './utils';
import { showProperties } from './ux';
import { useSimulatorMobileStore } from '#/store/simulatorMobileStore';
import { toRefs } from 'vue';

import {GlobalScope} from './verilogInterfaces';
import {CircuitElement} from './verilogInterfaces';
import {YosysJSON} from './verilogInterfaces';
import {SimulatorMobileStore} from './verilogInterfaces';
import {Node} from './verilogInterfaces';

declare var globalScope: GlobalScope;
declare var embed: boolean;
declare var scopeList: { [key: string]: unknown };

let editor: CodeMirror.Editor;
let verilogMode: boolean = false;

export async function createVerilogCircuit(): Promise<void> {
    const returned = await createNewCircuitScope(
        undefined,
        undefined,
        true,
        true
    );

    if (returned) {
        verilogModeSet(true);

        try {
            const simulatorMobileStore = toRefs(useSimulatorMobileStore()) as SimulatorMobileStore;
            simulatorMobileStore.isVerilog.value = true;
        } catch (error) {
            console.error('Failed to update simulatorMobileStore:', error);
        }
    }
}

export function saveVerilogCode(): void {
    const code: string = editor.getValue();
    globalScope.verilogMetadata.code = code;
    generateVerilogCircuit(code);
}

export function applyVerilogTheme(theme: string): void {
    localStorage.setItem('verilog-theme', theme);
    editor.setOption('theme', theme);
}

export function resetVerilogCode(): void {
    editor.setValue(globalScope.verilogMetadata.code);
}

export function hasVerilogCodeChanges(): boolean {
    return editor.getValue() !== globalScope.verilogMetadata.code;
}

export function verilogModeGet(): boolean {
    return verilogMode;
}

export function verilogModeSet(mode: boolean): void {
    if (mode === verilogMode) return;
    verilogMode = mode;
    if (mode) {
        const code_window = document.getElementById('code-window');
        if (code_window) code_window.style.display = 'block';

        const elementPanel = document.querySelector('.elementPanel');
        if (elementPanel) (elementPanel as HTMLElement).style.display = 'none';

        const timingDiagramPanel = document.querySelector('.timing-diagram-panel');
        if (timingDiagramPanel) (timingDiagramPanel as HTMLElement).style.display = 'none';

        const quickBtn = document.querySelector('.quick-btn');
        if (quickBtn) (quickBtn as HTMLElement).style.display = 'none';

        const verilogEditorPanel = document.getElementById('verilogEditorPanel');
        if (verilogEditorPanel) verilogEditorPanel.style.display = 'block';

        if (!embed) {
            simulationArea.lastSelected = globalScope.root;
            showProperties(undefined);
            showProperties(simulationArea.lastSelected);
        }
        resetVerilogCode();
    } else {
        const code_window = document.getElementById('code-window');
        if (code_window) code_window.style.display = 'none';

        const elementPanel = document.querySelector('.elementPanel');
        if (elementPanel) (elementPanel as HTMLElement).style.display = '';

        const timingDiagramPanel = document.querySelector('.timing-diagram-panel');
        if (timingDiagramPanel) (timingDiagramPanel as HTMLElement).style.display = '';

        const quickBtn = document.querySelector('.quick-btn');
        if (quickBtn) (quickBtn as HTMLElement).style.display = '';

        const verilogEditorPanel = document.getElementById('verilogEditorPanel');
        if (verilogEditorPanel) verilogEditorPanel.style.display = 'none';
    }
}

import yosysTypeMap from './VerilogClasses';

class VerilogSubCircuit {
    circuit: CircuitElement;

    constructor(circuit: CircuitElement) {
        this.circuit = circuit;
    }

    getPort(portName: string): Node | undefined {
        const numInputs = this.circuit.inputNodes.length;
        const numOutputs = this.circuit.outputNodes.length;

        for (let i = 0; i < numInputs; i++) {
            if (this.circuit.data.Input[i].label === portName) {
                return this.circuit.inputNodes[i];
            }
        }

        for (let i = 0; i < numOutputs; i++) {
            if (this.circuit.data.Output[i].label === portName) {
                return this.circuit.outputNodes[i];
            }
        }
        return undefined;
    }
}

export async function YosysJSON2CV(
    json: YosysJSON,
    parentScope: GlobalScope = globalScope,
    name: string = 'verilogCircuit',
    subCircuitScope: { [key: string]: string } = {},
    root: boolean = false
): Promise<GlobalScope> {
    const parentID = parentScope.id;
    let subScope: GlobalScope;
    if (root) {
        subScope = parentScope;
    } else {
        subScope = (await createNewCircuitScope(name, undefined, true, false)) as unknown as GlobalScope;
    }
    const circuitDevices: { [key: string]: VerilogSubCircuit | unknown } = {};

    for (const subCircuitName in json.subcircuits) {
        const scope = await YosysJSON2CV(
            json.subcircuits[subCircuitName],
            subScope,
            subCircuitName,
            subCircuitScope
        );
        subCircuitScope[subCircuitName] = scope.id;
    }

    for (const device in json.devices) {
        const deviceType = json.devices[device].type;
        if (deviceType === 'Subcircuit') {
            const subCircuitName = json.devices[device].celltype!;
            if (subCircuitScope[subCircuitName] === undefined) {                            //To debug the assignment of  
                throw new Error(`subCircuitScope[${subCircuitName}] is undefined`);         //subCircuitScope[subCircuitName]
            }
            circuitDevices[device] = new VerilogSubCircuit(
                new SubCircuit(
                    500,
                    500,
                    undefined,
                    subCircuitScope[subCircuitName]
                )
            );
        } else {
            circuitDevices[device] = new yosysTypeMap[deviceType](json.devices[device]);
        }
    }

    for (const connection in json.connectors) {
        const fromId = json.connectors[connection].from.id;
        const fromPort = json.connectors[connection].from.port;
        const toId = json.connectors[connection].to.id;
        const toPort = json.connectors[connection].to.port;

        const fromObj = circuitDevices[fromId] as VerilogSubCircuit;
        const toObj = circuitDevices[toId] as VerilogSubCircuit;

        const fromPortNode = fromObj.getPort(fromPort);
        const toPortNode = toObj.getPort(toPort);

        if (fromPortNode && toPortNode) {
            fromPortNode.connect(toPortNode);
        }
    }

    if (!root) {
        switchCircuit(parentID);
        return subScope;
    }
    return subScope;
}

export default function generateVerilogCircuit(
    verilogCode: string,
    scope: GlobalScope = globalScope
): void {
    const params = { code: verilogCode };
    fetch('/api/v1/simulator/verilogcv', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
    })
        .then((response) => {
            if (!response.ok) {
                throw response;
            }
            return response.json();
        })
        .then((circuitData: YosysJSON) => {
            scope.initialize();
            for (const id in scope.verilogMetadata.subCircuitScopeIds)
                delete scopeList[id];
            scope.verilogMetadata.subCircuitScopeIds = [];
            scope.verilogMetadata.code = verilogCode;
            const subCircuitScope: { [key: string]: string } = {};
            YosysJSON2CV(
                circuitData,
                globalScope,
                'verilogCircuit',
                subCircuitScope,
                true
            );
            changeCircuitName(circuitData.name);
            showMessage('Verilog Circuit Successfully Created');
            const verilogOutput = document.getElementById('verilogOutput');
            if (verilogOutput) verilogOutput.innerHTML = '';
        })
        .catch((error: Response) => {
            if (error.status === 500) {
                showError('Could not connect to Yosys');
            } else {
                showError('There is some issue with the code');
                error.json().then((errorMessage: { message: string }) => {
                    const verilogOutput = document.getElementById('verilogOutput');
                    if (verilogOutput) verilogOutput.innerHTML = errorMessage.message;
                });
            }
        });
}

export function setupCodeMirrorEnvironment(): void {
    const myTextarea = document.getElementById('codeTextArea') as HTMLTextAreaElement;

    CodeMirror.commands.autocomplete = function (cm: CodeMirror.Editor) {
        cm.showHint({ hint: CodeMirror.hint.anyword });
    };

    editor = CodeMirror.fromTextArea(myTextarea, {
        mode: 'verilog',
        autoRefresh: true,
        styleActiveLine: true,
        lineNumbers: true,
        autoCloseBrackets: true,
        smartIndent: true,
        indentWithTabs: true,
        extraKeys: { 'Ctrl-Space': 'autocomplete' },
    });

    if (!localStorage.getItem('verilog-theme')) {
        localStorage.setItem('verilog-theme', 'default');
    } else {
        const prevtheme = localStorage.getItem('verilog-theme');
        editor.setOption('theme', prevtheme);
    }

    editor.setValue('// Write Some Verilog Code Here!');
    setTimeout(function () {
        editor.refresh();
    }, 1);
}