/* eslint-disable import/no-cycle */
import { layoutModeGet } from '../layoutMode'
import Scope, { scopeList } from '../circuit'
import { loadScope } from './load'
import { updateRestrictedElementsInScope } from '../restrictedElementDiv'
import { forceResetNodesSet } from '../engine'

// Declare global variables
declare let globalScope: Scope
declare let loading: boolean

/**
 * Function to restore copy from backup
 * @param scope - The circuit on which undo is called
 * @category data
 */
export default function undo(scope: Scope = globalScope): void {
    if (layoutModeGet() || scope.backups.length < 2) return

    const { ox, oy, scale } = saveGlobalScopePosition()
    resetGlobalScopePosition()

    loading = true
    const undoData = popLastBackup(scope)
    if (!undoData) return

    scope.history.push(undoData)

    const tempScope = createTempScope(scope)
    if (!tempScope) return

    updateGlobalScope(tempScope, ox, oy, scale)
    forceResetNodesSet(true)
    updateRestrictedElementsInScope()
}

function saveGlobalScopePosition() {
    return {
        ox: globalScope.ox,
        oy: globalScope.oy,
        scale: globalScope.scale,
    }
}

function resetGlobalScopePosition() {
    globalScope.ox = 0
    globalScope.oy = 0
}

function popLastBackup(scope: Scope): string | undefined {
    return scope.backups.pop()
}

function createTempScope(scope: Scope): Scope | undefined {
    const tempScope = new Scope(scope.name)
    if (scope.backups.length === 0) return tempScope

    try {
        loadScope(tempScope, JSON.parse(scope.backups[scope.backups.length - 1]))
    } catch (error) {
        console.error('Failed to parse backup data:', error)
        loading = false
        return undefined
    }

    tempScope.backups = scope.backups
    tempScope.history = scope.history
    tempScope.id = scope.id
    tempScope.name = scope.name
    tempScope.testbenchData = scope.testbenchData

    return tempScope
}

function updateGlobalScope(tempScope: Scope, ox: number, oy: number, scale: number) {
    scopeList[tempScope.id] = tempScope
    globalScope = tempScope
    globalScope.ox = ox
    globalScope.oy = oy
    globalScope.scale = scale
    loading = false
}