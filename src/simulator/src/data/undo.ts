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
    if (layoutModeGet()) return
    if (scope.backups.length < 2) return
    
    const backupOx: number = globalScope.ox
    const backupOy: number = globalScope.oy
    const backupScale: number = globalScope.scale
    
    globalScope.ox = 0
    globalScope.oy = 0
    
    const tempScope: Scope = new Scope(scope.name)
    loading = true
    
    const undoData: string = scope.backups.pop()!
    scope.history.push(undoData)
    
    if (scope.backups.length !== 0) {
        loadScope(
            tempScope,
            JSON.parse(scope.backups[scope.backups.length - 1])
        )
    }
    
    tempScope.backups = scope.backups
    tempScope.history = scope.history
    tempScope.id = scope.id
    tempScope.name = scope.name
    tempScope.testbenchData = scope.testbenchData
    
    scopeList[scope.id] = tempScope
    globalScope = tempScope
    
    globalScope.ox = backupOx
    globalScope.oy = backupOy
    globalScope.scale = backupScale
    
    loading = false
    forceResetNodesSet(true)

    // Update restricted elements
    updateRestrictedElementsInScope()
}