import { projectSavedSet } from './project';
import { moduleList, updateOrder } from '../metadata';

function extract(obj: { saveObject: () => any }): any {
    return obj.saveObject();
}

export function checkIfBackup(scope: Scope): boolean {
    for (let i = 0; i < updateOrder.length; i++) {
        if (scope[updateOrder[i]].length) return true;
    }
    return false;
}

export function backUp(scope: Scope = globalScope): Record<string, any> {
    for (let i = 0; i < scope.SubCircuit.length; i++) {
        scope.SubCircuit[i].removeConnections();
    }

    const data: Record<string, any> = {};
    data.layout = scope.layout;
    data.verilogMetadata = scope.verilogMetadata;
    data.allNodes = scope.allNodes.map(extract);
    data.testbenchData = scope.testbenchData;
    data.id = scope.id;
    data.name = scope.name;

    for (let i = 0; i < moduleList.length; i++) {
        if (scope[moduleList[i]].length) {
            data[moduleList[i]] = scope[moduleList[i]].map(extract);
        }
    }

    data.restrictedCircuitElementsUsed = scope.restrictedCircuitElementsUsed;

    data.nodes = [];
    for (let i = 0; i < scope.nodes.length; i++) {
        data.nodes.push(scope.allNodes.indexOf(scope.nodes[i]));
    }

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
