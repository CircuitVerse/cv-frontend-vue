import { projectSavedSet } from './project'
import { moduleList, updateOrder } from '../metadata'
import { Scope } from '../types/scope.types'

interface Saveable {
    saveObject(): any
}

interface BackupData {
    layout: {
        width: number
        height: number
        title_x: number
        title_y: number
        titleEnabled: boolean
    }
    verilogMetadata: {
        isVerilogCircuit: boolean
        isMainCircuit: boolean
        code: string
        subCircuitScopeIds: string[]
    }
    allNodes: any[]
    testbenchData: any
    id: number | string
    name: string
    nodes: number[]
    restrictedCircuitElementsUsed: any[]
    [key: string]: any 
}

declare const globalScope: Scope

/**
 * Extract save object from an object
 * @param obj - Object with saveObject method
 * @returns Result of saveObject method
 */
function extract(obj: Saveable): any {
    return obj.saveObject()
}

// Check if there is anything to backup - to be deprecated
/**
 * Check if backup is available
 * @param scope - Circuit scope
 * @return True if backup is available
 * @category data
 */
export function checkIfBackup(scope: Scope): boolean {
    for (let i = 0; i < updateOrder.length; i++) {
        if (scope[updateOrder[i]].length) return true
    }
    return false
}

/**
 * Creates a backup of the circuit
 * @param scope - Circuit scope, defaults to globalScope
 * @returns Backup data object
 */
export function backUp(scope: Scope = globalScope): BackupData {
    // Disconnection of subcircuits are needed because these are the connections between nodes
    // in current scope and those in the subcircuit's scope
    for (let i = 0; i < scope.SubCircuit.length; i++) {
        scope.SubCircuit[i].removeConnections()
    }

    const data: BackupData = {} as BackupData

    // Storing layout
    data.layout = scope.layout

    // Storing Verilog Properties
    data.verilogMetadata = scope.verilogMetadata

    // Storing all nodes
    data.allNodes = scope.allNodes.map(extract)

    // Storing test attached to scope
    data.testbenchData = scope.testbenchData

    // Storing other details
    data.id = scope.id
    data.name = scope.name

    // Storing details of all module objects
    for (let i = 0; i < moduleList.length; i++) {
        if (scope[moduleList[i]].length) {
            data[moduleList[i]] = scope[moduleList[i]].map(extract)
        }
    }

    // Adding restricted circuit elements used in the save data
    data.restrictedCircuitElementsUsed = scope.restrictedCircuitElementsUsed

    // Storing intermediate nodes (nodes in wires)
    data.nodes = []
    for (let i = 0; i < scope.nodes.length; i++) {
        data.nodes.push(scope.allNodes.indexOf(scope.nodes[i]))
    }

    // Restoring the connections
    for (let i = 0; i < scope.SubCircuit.length; i++) {
        scope.SubCircuit[i].makeConnections()
    }

    return data
}

/**
 * Schedules a backup of the circuit
 * @param scope - Circuit scope, defaults to globalScope
 * @returns Stringified backup
 */
export function scheduleBackup(scope: Scope = globalScope): string {
    const backup = JSON.stringify(backUp(scope))

    if (
        scope.backups.length === 0 ||
        scope.backups[scope.backups.length - 1] !== backup
    ) {
        scope.backups.push(backup)
        scope.history = []
        scope.timeStamp = new Date().getTime()
        projectSavedSet(false)
    }

    return backup
}
