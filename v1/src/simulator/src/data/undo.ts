/* eslint-disable import/no-cycle */
import { layoutModeGet } from "../layoutMode";
import Scope, { scopeList } from "../circuit";
import { loadScope } from "./load";
import { updateRestrictedElementsInScope } from "../restrictedElementDiv";
import { errorDetectedGet, errorDetectedSet, forceResetNodesSet } from "../engine";

// Declare global variables
declare let globalScope: Scope;
// loading is a global set on window

/**
 * Function to restore copy from backup
 * @param scope - The circuit on which undo is called
 * @category data
 */
export default function undo(scope: Scope = globalScope): void {
  if (layoutModeGet() || scope.backups.length < 2) return;

  const previousError = errorDetectedGet();
  const { ox, oy, scale } = saveGlobalScopePosition();
  resetGlobalScopePosition();

  (window as any).loading = true;
  let tempScope: Scope | undefined;
  try {
    tempScope = createTempScope(scope);
  } finally {
    globalScope.ox = ox;
    globalScope.oy = oy;
    (window as any).loading = false;
  }
  if (!tempScope) {
    errorDetectedSet(previousError);
    return;
  }

  const undoData = popLastBackup(scope)!;
  scope.history.push(undoData);

  updateGlobalScope(tempScope, ox, oy, scale);
  forceResetNodesSet(true);
  updateRestrictedElementsInScope();
}

function saveGlobalScopePosition() {
  return {
    ox: globalScope.ox,
    oy: globalScope.oy,
    scale: globalScope.scale,
  };
}

function resetGlobalScopePosition() {
  globalScope.ox = 0;
  globalScope.oy = 0;
}

function popLastBackup(scope: Scope): string | undefined {
  return scope.backups.pop();
}

function createTempScope(scope: Scope): Scope | undefined {
  try {
    const tempScope = new Scope(scope.name);
    loadScope(tempScope, JSON.parse(scope.backups[scope.backups.length - 2]));

    tempScope.backups = scope.backups;
    tempScope.history = scope.history;
    tempScope.id = scope.id;
    tempScope.name = scope.name;
    tempScope.testbenchData = scope.testbenchData;

    return tempScope;
  } catch (error) {
    console.error("Failed to restore undo backup:", error);
    return undefined;
  }
}

function updateGlobalScope(tempScope: Scope, ox: number, oy: number, scale: number) {
  scopeList[tempScope.id] = tempScope;
  globalScope = tempScope;
  globalScope.ox = ox;
  globalScope.oy = oy;
  globalScope.scale = scale;
  (window as any).loading = false;
}
