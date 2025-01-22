import { projectSavedSet } from './project';
import { moduleList, updateOrder } from '../metadata';


// Define interfaces for the core types
interface Node {
   saveObject(): any;
}


interface SubCircuit {
   removeConnections(): void;
   makeConnections(): void;
}


interface VerilogMetadata {
   [key: string]: any;
}


interface Layout {
   [key: string]: any;
}


interface TestbenchData {
   [key: string]: any;
}


interface Scope {
   layout: Layout;
   verilogMetadata: VerilogMetadata;
   allNodes: Node[];
   testbenchData: TestbenchData;
   id: string | number;
   name: string;
   SubCircuit: SubCircuit[];
   nodes: Node[];
   restrictedCircuitElementsUsed: string[];
   backups: string[];
   history: any[];
   timeStamp: number;
   [key: string]: any; // For dynamic module access
}


interface BackupData {
   layout: Layout;
   verilogMetadata: VerilogMetadata;
   allNodes: any[];
   testbenchData: TestbenchData;
   id: string | number;
   name: string;
   nodes: number[];
   restrictedCircuitElementsUsed: string[];
   [key: string]: any; // For dynamic module properties
}


/* eslint-disable no-param-reassign */
function extract(obj: { saveObject: () => any }): any {
   return obj.saveObject();
}


// Check if there is anything to backup - to be deprecated
/**
* Check if backup is available
* @param {Scope} scope - The scope to check for backup
* @return {boolean} - Whether backup is available
* @category data
*/
export function checkIfBackup(scope: Scope): boolean {
   for (let i = 0; i < updateOrder.length; i++) {
      if (scope[updateOrder[i]] && scope[updateOrder[i]].length) return true;
   }
   return false;
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
      if (scope[moduleList[i]] && scope[moduleList[i]].length) {
           data[moduleList[i]] = scope[moduleList[i]].map(extract);
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


// Add global type declaration
declare const globalScope: Scope;

