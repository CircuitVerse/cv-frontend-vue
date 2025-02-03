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

   // Check if the backup is valid and doesn't contain malicious properties
   if (isValidBackup(backup)) {
       if (
           scope.backups.length === 0 ||
           scope.backups[scope.backups.length - 1] !== backup
       ) {
           // Safely assign the backup to scope.backups
           scope.backups = [...scope.backups, backup];

           // Safely assign an empty array to scope.history
           scope.history = [];

           // Safely assign the current timestamp
           scope.timeStamp = new Date().getTime();

           // Mark the project as unsaved
           projectSavedSet(false);
       }
   } else {
       console.error("Invalid backup data detected. Backup aborted.");
   }

   return backup;
}

/**
 * Validate the backup data to prevent prototype pollution.
 * @param backup The backup data to validate.
 * @returns True if the backup is valid, false otherwise.
 */
function isValidBackup(backup: string): boolean {
   try {
       const parsedBackup = JSON.parse(backup);

       // Check if the parsed backup contains any malicious properties
       if (parsedBackup && typeof parsedBackup === "object") {
           for (const key in parsedBackup) {
               if (key === "__proto__" || key === "constructor" || key === "prototype") {
                   return false; // Malicious property detected
               }
           }
       }

       return true; // Backup is valid
   } catch (error) {
       console.error("Failed to parse backup data:", error);
       return false; // Backup is invalid
   }
}