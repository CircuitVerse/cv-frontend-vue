import { projectSavedSet } from './project';
import { moduleList, updateOrder } from '../metadata';
import { LayoutData,VerilogMetadata,TestbenchData,Scope,
   RestrictedCircuitElements,SaveableObject } from './data.types'

declare const globalScope: Scope;

// Helper function to extract data from an object
function extract(obj: SaveableObject): unknown {
    return obj.saveObject();
}

/** 
 * Check if backup is available
 * @param {Scope} scope
 * @return {boolean}
 * @category data
 */
export function checkIfBackup(scope: Scope): boolean {
    for (let i = 0; i < updateOrder.length; i++) {
        if ((scope[updateOrder[i]] as unknown[]).length) return true;
    }
    return false;
}

interface BackupData {
    layout: LayoutData;
    verilogMetadata: VerilogMetadata;
    allNodes: unknown[];
    testbenchData: TestbenchData;
    id: string;
    name: string;
    nodes: number[];
    restrictedCircuitElementsUsed: RestrictedCircuitElements;
    [key: string]: unknown;
}

export function backUp(scope: Scope = globalScope): BackupData {
    // Disconnection of subcircuits are needed because these are the connections between nodes
    // in current scope and those in the subcircuit's scope
    for (let i = 0; i < scope.SubCircuit.length; i++) {
        scope.SubCircuit[i].removeConnections();
    }

    const data: BackupData = {
        layout: scope.layout,
        verilogMetadata: scope.verilogMetadata,
        allNodes: scope.allNodes.map(extract),
        testbenchData: scope.testbenchData,
        id: scope.id,
        name: scope.name,
        nodes: [],
        restrictedCircuitElementsUsed: scope.restrictedCircuitElementsUsed
    };

    // Storing details of all module objects
    for (let i = 0; i < moduleList.length; i++) {
        if ((scope[moduleList[i]] as unknown[]).length) {
            data[moduleList[i]] = (scope[moduleList[i]] as SaveableObject[]).map(extract);
        }
    }

    // Storing intermediate nodes (nodes in wires)
    data.nodes = scope.nodes.map(node => scope.allNodes.indexOf(node));

    // Restoring the connections
    for (let i = 0; i < scope.SubCircuit.length; i++) {
        scope.SubCircuit[i].makeConnections();
    }

    return data;
}

export function scheduleBackup(scope: Scope = globalScope): string {
    const backup = JSON.stringify(backUp(scope));
    if (
        scope.backups.length === 0 ||
        scope.backups[scope.backups.length - 1] !== backup
    ) {
        scope.backups.push(backup);
        scope.history = [];
        scope.timeStamp = new Date().getTime();
        projectSavedSet(false);
    }
    return backup;
}