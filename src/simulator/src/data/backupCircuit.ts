import { projectSavedSet } from './project';
import { moduleList, updateOrder } from '../metadata';

/* eslint-disable no-param-reassign */

// ------------------
// Type Declarations
// ------------------

interface NodeLike {
  saveObject: () => Record<string, any>;
}

interface SubCircuitLike {
  removeConnections: () => void;
  makeConnections: () => void;
}

interface Scope {
  SubCircuit: SubCircuitLike[];
  allNodes: NodeLike[];
  nodes: NodeLike[];
  layout: Record<string, any>;
  verilogMetadata: Record<string, any>;
  testbenchData: Record<string, any>;
  id: number;
  name: string;
  restrictedCircuitElementsUsed: Record<string, any>;
  backups: string[];
  history: string[];
  timeStamp: number;
  [key: string]: any; // For dynamic moduleList entries
}

// Global declaration (CircuitVerse uses globalScope)
declare const globalScope: Scope;

// ------------------
// Helper Functions
// ------------------

function extract(obj: NodeLike): Record<string, any> {
  return obj.saveObject();
}

/**
 * Check if backup is available
 * @param scope Circuit scope
 * @returns true if any data exists for backup
 * @category data
 */
export function checkIfBackup(scope: Scope): boolean {
  for (let i = 0; i < updateOrder.length; i++) {
    const key = updateOrder[i];
    if (scope[key]?.length) return true;
  }
  return false;
}

/**
 * Create a serialized backup of the current circuit state.
 * @param scope Current working scope (defaults to globalScope)
 * @returns JSON-compatible backup data object
 */
export function backUp(scope: Scope = globalScope): Record<string, any> {
  // Disconnect subcircuits before saving
  for (const sub of scope.SubCircuit) {
    sub.removeConnections();
  }

  const data: Record<string, any> = {
    layout: scope.layout,
    verilogMetadata: scope.verilogMetadata,
    allNodes: scope.allNodes.map(extract),
    testbenchData: scope.testbenchData,
    id: scope.id,
    name: scope.name,
  };

  // Save all module objects dynamically
  for (const moduleName of moduleList) {
    if (scope[moduleName]?.length) {
      data[moduleName] = scope[moduleName].map(extract);
    }
  }

  data.restrictedCircuitElementsUsed = scope.restrictedCircuitElementsUsed;

  // Save intermediate nodes (wire nodes)
  data.nodes = scope.nodes.map(node =>
    scope.allNodes.indexOf(node)
  );

  // Reconnect subcircuits after saving
  for (const sub of scope.SubCircuit) {
    sub.makeConnections();
  }

  return data;
}

/**
 * Schedule a new backup in the current scope.
 * Ensures duplicates aren’t stored consecutively.
 * @param scope Current scope (default = globalScope)
 * @returns The serialized backup string
 */
export function scheduleBackup(scope: Scope = globalScope): string {
  const backup = JSON.stringify(backUp(scope));

  if (
    scope.backups.length === 0 ||
    scope.backups[scope.backups.length - 1] !== backup
  ) {
    scope.backups.push(backup);
    scope.history = [];
    scope.timeStamp = Date.now();
    projectSavedSet(false);
  }

  return backup;
}
