/* eslint-disable import/no-cycle */
import { layoutModeGet } from '../layoutMode';
import Scope, { scopeList } from '../circuit';
import { loadScope } from './load';
import { updateRestrictedElementsInScope } from '../restrictedElementDiv';
import { forceResetNodesSet } from '../engine';

// Extend the Scope type to include missing properties
interface ExtendedScope extends Scope {
    testbenchData: any;
    ox: number;
    oy: number;
    scale: number;
    history: string[];
    backups: string[];
    name: string;
    id: string | number;
}

// Type declarations for global variables
declare var globalScope: ExtendedScope;
declare var loading: boolean;

/**
 * Function to restore copy from backup
 * @param {ExtendedScope=} scope - The circuit on which redo is called
 * @category data
 */
export default function redo(scope: ExtendedScope = globalScope): void {
    if (layoutModeGet()) return;
    if (scope.history.length === 0) return;

    // Store the current view state
    const backupOx: number = globalScope.ox;
    const backupOy: number = globalScope.oy;
    const backupScale: number = globalScope.scale;

    // Reset the view position
    globalScope.ox = 0;
    globalScope.oy = 0;

    // Create a temporary scope
    const tempScope: ExtendedScope = new Scope(scope.name) as ExtendedScope;
    loading = true;

    // Get the redo data and update history
    const redoData: string = scope.history.pop()!;
    scope.backups.push(redoData);

    // Load the scope data
    loadScope(tempScope, JSON.parse(redoData));

    // Transfer persistent properties
    tempScope.backups = scope.backups;
    tempScope.history = scope.history;
    tempScope.id = scope.id;
    tempScope.name = scope.name;
    tempScope.testbenchData = scope.testbenchData;

    // Update the scope list
    scopeList[scope.id] = tempScope;

    // Update global scope
    globalScope = tempScope;

    // Restore view state
    globalScope.ox = backupOx;
    globalScope.oy = backupOy;
    globalScope.scale = backupScale;

    loading = false;
    forceResetNodesSet(true);

    // Update restricted elements
    updateRestrictedElementsInScope();
}