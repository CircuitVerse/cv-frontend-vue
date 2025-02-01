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
    try {
        const returned = await createNewCircuitScope(
            undefined,
            undefined,
            true,
            true
        );

        if (returned) {
            verilogModeSet(true);

            const simulatorMobileStore = toRefs(useSimulatorMobileStore()) as SimulatorMobileStore;
            simulatorMobileStore.isVerilog.value = true;
        }
    } catch (error) {
        console.error('Failed to create Verilog circuit:', error);
        showError('Failed to create Verilog circuit. Please try again.');
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
        enableVerilogMode();
    } else {
        disableVerilogMode();
    }
}

function enableVerilogMode(): void {
    setElementDisplay('code-window', 'block');
    setElementDisplay('.elementPanel', 'none');
    setElementDisplay('.timing-diagram-panel', 'none');
    setElementDisplay('.quick-btn', 'none');
    setElementDisplay('#verilogEditorPanel', 'block');

    if (!embed) {
        simulationArea.lastSelected = globalScope.root;
        showProperties(null);
        showProperties(simulationArea.lastSelected);
    }
    resetVerilogCode();
}

function disableVerilogMode(): void {
    setElementDisplay('code-window', 'none');
    setElementDisplay('.elementPanel', '');
    setElementDisplay('.timing-diagram-panel', '');
    setElementDisplay('.quick-btn', '');
    setElementDisplay('#verilogEditorPanel', 'none');
}

function setElementDisplay(selector: string, display: string): void {
    const element = selector.startsWith('.') || selector.startsWith('#') 
        ? document.querySelector(selector) 
        : document.getElementById(selector);
    if (element) (element as HTMLElement).style.display = display;
}


import yosysTypeMap from './VerilogClasses';

class VerilogSubCircuit {
    circuit: CircuitElement;

    constructor(circuit: CircuitElement) {
        this.circuit = circuit;
    }

    getPort(portName: string): Node | undefined {
        return (
            findPortInNodes(this.circuit.inputNodes, this.circuit.data.Input, portName) ||
            findPortInNodes(this.circuit.outputNodes, this.circuit.data.Output, portName)
        );
    }
}

function findPortInNodes(nodes: Node[], data: { label: string }[], portName: string): Node | undefined {
    for (let i = 0; i < nodes.length; i++) {
        if (data[i].label === portName) {
            return nodes[i];
        }
    }
    return undefined;
}

export async function YosysJSON2CV(
    json: YosysJSON,
    parentScope: GlobalScope = globalScope,
    name: string = 'verilogCircuit',
    subCircuitScope: { [key: string]: string } = {},
    root: boolean = false
): Promise<GlobalScope> {
    const parentID = parentScope.id;
    const subScope = root ? parentScope : (await createNewCircuitScope(name, undefined, true, false)) as unknown as GlobalScope;
    const circuitDevices: { [key: string]: VerilogSubCircuit | unknown } = {};

    processSubCircuits(json, subScope, subCircuitScope);
    processDevices(json, circuitDevices, subCircuitScope);
    processConnectors(json, circuitDevices);

    if (!root) {
        switchCircuit(parentID);
        return subScope;
    }
    return subScope;
}

async function processSubCircuits(json: YosysJSON, subScope: GlobalScope, subCircuitScope: { [key: string]: string }): Promise<void> {
    for (const subCircuitName in json.subcircuits) {
        const scope = await YosysJSON2CV(
            json.subcircuits[subCircuitName],
            subScope,
            subCircuitName,
            subCircuitScope
        );
        subCircuitScope[subCircuitName] = scope.id;
    }
}

function processDevices(json: YosysJSON, circuitDevices: { [key: string]: VerilogSubCircuit | unknown }, subCircuitScope: { [key: string]: string }): void {
    for (const device in json.devices) {
        processDevice(device, json.devices[device], circuitDevices, subCircuitScope);
    }
}

function processDevice(device: string, deviceData: any, circuitDevices: { [key: string]: VerilogSubCircuit | unknown }, subCircuitScope: { [key: string]: string }): void {
    const deviceType = deviceData.type;
    if (deviceType === 'Subcircuit') {
        processSubCircuitDevice(device, deviceData, circuitDevices, subCircuitScope);
    } else {
        processStandardDevice(device, deviceData, circuitDevices);
    }
}

function processSubCircuitDevice(device: string, deviceData: any, circuitDevices: { [key: string]: VerilogSubCircuit | unknown }, subCircuitScope: { [key: string]: string }): void {
    const subCircuitName = deviceData.celltype!;
    if (subCircuitScope[subCircuitName] === undefined) {
        throw new Error(`subCircuitScope[${subCircuitName}] is undefined`);
    }
    circuitDevices[device] = new VerilogSubCircuit(
        new SubCircuit(
            500,
            500,
            null,
            subCircuitScope[subCircuitName]
        )
    );
}

function processStandardDevice(device: string, deviceData: any, circuitDevices: { [key: string]: VerilogSubCircuit | unknown }): void {
    const deviceType = deviceData.type;
    circuitDevices[device] = new yosysTypeMap[deviceType](deviceData);
}

function processConnectors(json: YosysJSON, circuitDevices: { [key: string]: VerilogSubCircuit | unknown }): void {
    for (const connection in json.connectors) {
        const { from, to } = json.connectors[connection];
        const fromObj = circuitDevices[from.id] as VerilogSubCircuit;
        const toObj = circuitDevices[to.id] as VerilogSubCircuit;

        const fromPortNode = fromObj.getPort(from.port);
        const toPortNode = toObj.getPort(to.port);

        if (fromPortNode && toPortNode) {
            fromPortNode.connect(toPortNode);
        }
    }
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