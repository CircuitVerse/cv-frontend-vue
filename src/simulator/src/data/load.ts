import { resetScopeList, newCircuit, switchCircuit } from '../circuit';
import { setProjectName } from './save';
import {
    scheduleUpdate,
    update,
    updateSimulationSet,
    updateCanvasSet,
    gridUpdateSet,
} from '../engine';
import { updateRestrictedElementsInScope } from '../restrictedElementDiv';
import { simulationArea } from '../simulationArea';
import { loadSubCircuit } from '../subcircuit';
import { scheduleBackup } from './backupCircuit';
import { showProperties } from '../ux';
import { constructNodeConnections, loadNode, replace } from '../node';
import { generateId } from '../utils';
import modules from '../modules';
import { oppositeDirection } from '../canvasApi';
import plotArea from '../plotArea';
import { TestbenchData } from '#/simulator/src/testbench';
import { SimulatorStore } from '#/store/SimulatorStore/SimulatorStore';
import { toRefs } from 'vue';
import { moduleList } from '../metadata';

type CircuitElement = any; // Replace with proper type
type Scope = any; // Replace with proper type
type JSONData = Record<string, any>; // Generic type for JSON data

function rectifyObjectType(obj: string): string {
    const rectify: Record<string, string> = {
        FlipFlop: 'DflipFlop',
        Ram: 'Rom',
    };
    return rectify[obj] || obj;
}

function loadModule(data: JSONData, scope: Scope): void {
    const obj = new modules[rectifyObjectType(data.objectType)](
        data.x,
        data.y,
        scope,
        ...(data.customData.constructorParamaters || [])
    );

    obj.label = data.label;
    obj.labelDirection =
        data.labelDirection || oppositeDirection[fixDirection[obj.direction]];

    obj.propagationDelay = data.propagationDelay || obj.propagationDelay;
    obj.fixDirection();

    if (data.customData.values) {
        for (const prop in data.customData.values) {
            obj[prop] = data.customData.values[prop];
        }
    }

    if (data.customData.nodes) {
        for (const node in data.customData.nodes) {
            const n = data.customData.nodes[node];
            if (Array.isArray(n)) {
                for (let i = 0; i < n.length; i++) {
                    obj[node][i] = replace(obj[node][i], n[i]);
                }
            } else {
                obj[node] = replace(obj[node], n);
            }
        }
    }

    if (data.subcircuitMetadata) {
        obj.subcircuitMetadata = data.subcircuitMetadata;
    }
}

function removeBugNodes(scope: Scope): void {
    let x = scope.allNodes.length;
    for (let i = 0; i < x; i++) {
        if (
            scope.allNodes[i].type !== 2 &&
            scope.allNodes[i].parent.objectType === 'CircuitElement'
        ) {
            scope.allNodes[i].delete();
        }
        if (scope.allNodes.length !== x) {
            i = 0;
            x = scope.allNodes.length;
        }
    }
}

export function loadScope(scope: Scope, data: JSONData): void {
    const ML = moduleList.slice();
    scope.restrictedCircuitElementsUsed = data.restrictedCircuitElementsUsed;

    data.allNodes.forEach((x: any) => loadNode(x, scope));

    for (let i = 0; i < data.allNodes.length; i++) {
        constructNodeConnections(scope.allNodes[i], data.allNodes[i]);
    }

    for (let i = 0; i < ML.length; i++) {
        if (data[ML[i]]) {
            if (ML[i] === 'SubCircuit') {
                for (let j = 0; j < data[ML[i]].length; j++) {
                    loadSubCircuit(data[ML[i]][j], scope);
                }
            } else {
                for (let j = 0; j < data[ML[i]].length; j++) {
                    loadModule(data[ML[i]][j], scope);
                }
            }
        }
    }

    scope.wires.forEach((x: any) => x.updateData(scope));
    removeBugNodes(scope);

    if (data.verilogMetadata) {
        scope.verilogMetadata = data.verilogMetadata;
    }

    if (data.testbenchData) {
        globalScope.testbenchData = new TestbenchData(
            data.testbenchData.testData,
            data.testbenchData.currentGroup,
            data.testbenchData.currentCase
        );
    }

    if (data.layout) {
        scope.layout = data.layout;
    } else {
        scope.layout = {};
        scope.layout.width = 100;
        scope.layout.height =
            Math.max(scope.Input.length, scope.Output.length) * 20 + 20;
        scope.layout.title_x = 50;
        scope.layout.title_y = 13;
        for (let i = 0; i < scope.Input.length; i++) {
            scope.Input[i].layoutProperties = {
                x: 0,
                y:
                    scope.layout.height / 2 -
                    scope.Input.length * 10 +
                    20 * i +
                    10,
                id: generateId(),
            };
        }
        for (let i = 0; i < scope.Output.length; i++) {
            scope.Output[i].layoutProperties = {
                x: scope.layout.width,
                y:
                    scope.layout.height / 2 -
                    scope.Output.length * 10 +
                    20 * i +
                    10,
                id: generateId(),
            };
        }
    }

    if (scope.layout.titleEnabled === undefined) {
        scope.layout.titleEnabled = true;
    }
}

export default function load(data: JSONData): void {
    const simulatorStore = SimulatorStore();
    const { circuit_list } = toRefs(simulatorStore);

    if (!data) {
        setProjectName(__projectName);
        return;
    }

    const { projectId } = data;
    setProjectName(data.name);

    globalScope = undefined;
    resetScopeList();

    for (let i = 0; i < data.scopes.length; i++) {
        const isVerilogCircuit = data.scopes[i].verilogMetadata?.isVerilogCircuit || false;
        const isMainCircuit = data.scopes[i].verilogMetadata?.isMainCircuit || false;

        const scope = newCircuit(
            data.scopes[i].name || 'Untitled',
            data.scopes[i].id,
            isVerilogCircuit,
            isMainCircuit
        );

        loadScope(scope, data.scopes[i]);
        globalScope = scope;

        if (embed) {
            globalScope.centerFocus(true);
        } else {
            globalScope.centerFocus(false);
        }

        update(globalScope, true);
        updateRestrictedElementsInScope();
        scheduleBackup();
    }

    simulationArea.changeClockTime(data.timePeriod || 500);
    simulationArea.clockEnabled =
        data.clockEnabled === undefined ? true : data.clockEnabled;

    if (!embed) {
        showProperties(simulationArea.lastSelected);
    }

    if (data.orderedTabs) {
        circuit_list.value.sort((a: any, b: any) => {
            return data.orderedTabs.indexOf(String(a.id)) - data.orderedTabs.indexOf(String(b.id));
        });
    }

    if (data.focussedCircuit) {
        switchCircuit(String(data.focussedCircuit));
    }

    updateSimulationSet(true);
    updateCanvasSet(true);
    gridUpdateSet(true);

    if (!embed) {
        plotArea.reset();
    }
    scheduleUpdate(1);
}
