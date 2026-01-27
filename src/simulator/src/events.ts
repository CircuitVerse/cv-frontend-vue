/* eslint-disable import/no-cycle */
import Scope, { scopeList, switchCircuit, newCircuit } from './circuit'

import { loadScope } from './data/load'
import {
    scheduleUpdate,
    updateSimulationSet,
    updateSubcircuitSet,
    forceResetNodesSet,
} from './engine'
import { backUp } from './data/backupCircuit'
import { getNextPosition } from './modules'
import { generateId } from './utils'
import { simulationArea } from './simulationArea'
import { TestbenchData } from '#/simulator/src/testbench'
import { moduleList, updateOrder } from './metadata'

interface CopyData {
    logixClipBoardData: boolean
    scopes: any[]
    [key: string]: any
}

/**
 * Helper function to paste
 * @category events
 */
export function paste(copyData: string): void {
    if (copyData === 'undefined') return
    const data: CopyData = JSON.parse(copyData)
    if (!data.logixClipBoardData) return

    const currentScopeId = globalScope.id
    for (let i = 0; i < data.scopes.length; i++) {
        if (scopeList[data.scopes[i].id] === undefined) {
            let isVerilogCircuit = false
            let isMainCircuit = false
            if (data.scopes[i].verilogMetadata) {
                isVerilogCircuit =
                    data.scopes[i].verilogMetadata.isVerilogCircuit
                isMainCircuit = data.scopes[i].verilogMetadata.isMainCircuit
            }
            const scope = newCircuit(
                data.scopes[i].name,
                data.scopes[i].id,
                isVerilogCircuit,
                isMainCircuit
            )
            loadScope(scope, data.scopes[i])
            scopeList[data.scopes[i].id] = scope
        }
    }

    switchCircuit(currentScopeId)
    const tempScope = new Scope(globalScope.name, globalScope.id)
    const oldOx = globalScope.ox
    const oldOy = globalScope.oy
    const oldScale = globalScope.scale
    loadScope(tempScope, data)

    let prevLength = tempScope.allNodes.length
    for (let i = 0; i < tempScope.allNodes.length; i++) {
        tempScope.allNodes[i].checkDeleted()
        if (tempScope.allNodes.length !== prevLength) {
            prevLength--
            i--
        }
    }

    let approxX = 0
    let approxY = 0
    let count = 0

    for (let i = 0; i < updateOrder.length; i++) {
        for (let j = 0; j < tempScope[updateOrder[i]].length; j++) {
            const obj = tempScope[updateOrder[i]][j]
            obj.updateScope(globalScope)
            if (obj.objectType !== 'Wire') {
                approxX += obj.x
                approxY += obj.y
                count++
            }
        }
    }

    for (let j = 0; j < tempScope.CircuitElement.length; j++) {
        const obj = tempScope.CircuitElement[j]
        obj.updateScope(globalScope)
    }

    approxX /= count
    approxY /= count

    approxX = Math.round(approxX / 10) * 10
    approxY = Math.round(approxY / 10) * 10

    for (let i = 0; i < updateOrder.length; i++) {
        for (let j = 0; j < tempScope[updateOrder[i]].length; j++) {
            const obj = tempScope[updateOrder[i]][j]
            if (obj.objectType !== 'Wire') {
                obj.x += simulationArea.mouseX - approxX
                obj.y += simulationArea.mouseY - approxY
            }
        }
    }

    Object.keys(tempScope).forEach((l: string) => {
        if (
            tempScope[l] instanceof Array &&
            l !== 'objects' &&
            l !== 'CircuitElement'
        ) {
            globalScope[l].push(...tempScope[l])
        }
    })
    for (let i = 0; i < tempScope.Input.length; i++) {
        tempScope.Input[i].layoutProperties.y = getNextPosition(0, globalScope)
        tempScope.Input[i].layoutProperties.id = generateId()
    }
    for (let i = 0; i < tempScope.Output.length; i++) {
        tempScope.Output[i].layoutProperties.x = globalScope.layout.width
        tempScope.Output[i].layoutProperties.id = generateId()
        tempScope.Output[i].layoutProperties.y = getNextPosition(
            globalScope.layout.width,
            globalScope
        )
    }
    updateSimulationSet(true)
    updateSubcircuitSet(true)
    scheduleUpdate()
    globalScope.ox = oldOx
    globalScope.oy = oldOy
    globalScope.scale = oldScale

    forceResetNodesSet(true)
}

/**
 * Helper function for cut
 * @param {JSON} copyList - The selected elements
 * @category events
 */
export function cut(copyList: any[]): string {
    if (copyList.length === 0) return ''
    const tempScope = new Scope(globalScope.name, globalScope.id)
    const oldOx = globalScope.ox
    const oldOy = globalScope.oy
    const oldScale = globalScope.scale
    let d = backUp(globalScope)
    loadScope(tempScope, d)
    scopeList[tempScope.id] = tempScope

    for (let i = 0; i < copyList.length; i++) {
        const obj = copyList[i]
        if (obj.objectType === 'Node') obj.objectType = 'allNodes'
        for (let j = 0; j < tempScope[obj.objectType].length; j++) {
            if (
                tempScope[obj.objectType][j].x === obj.x &&
                tempScope[obj.objectType][j].y === obj.y &&
                (obj.objectType !== 'Node' || obj.type === 2)
            ) {
                tempScope[obj.objectType][j].delete()
                break
            }
        }
    }
    tempScope.backups = globalScope.backups
    for (let i = 0; i < updateOrder.length; i++) {
        let prevLength = globalScope[updateOrder[i]].length // LOL length of list will reduce automatically when deletion starts
        for (let j = 0; j < globalScope[updateOrder[i]].length; j++) {
            const obj = globalScope[updateOrder[i]][j]
            if (obj.objectType !== 'Wire') {
                // }&&obj.objectType!='CircuitElement'){//}&&(obj.objectType!='Node'||obj.type==2)){
                if (!copyList.includes(globalScope[updateOrder[i]][j])) {
                    globalScope[updateOrder[i]][j].cleanDelete()
                }
            }

            if (globalScope[updateOrder[i]].length !== prevLength) {
                prevLength--
                j--
            }
        }
    }

    let prevLength = globalScope.wires.length
    for (let i = 0; i < globalScope.wires.length; i++) {
        globalScope.wires[i].checkConnections()
        if (globalScope.wires.length !== prevLength) {
            prevLength--
            i--
        }
    }

    updateSimulationSet(true)

    let data = backUp(globalScope)
    data.logixClipBoardData = true
    const dependencyList = globalScope.getDependencies()
    data.dependencies = {}
    Object.keys(dependencyList).forEach((dependency: string) => {
        data.dependencies[dependency] = backUp(scopeList[dependency])
    })
    data.logixClipBoardData = true
    const result = JSON.stringify(data)

    simulationArea.multipleObjectSelections = []
    simulationArea.copyList = []
    updateSimulationSet(true)
    globalScope = tempScope
    scheduleUpdate()
    globalScope.ox = oldOx
    globalScope.oy = oldOy
    globalScope.scale = oldScale
    forceResetNodesSet(true)
    // eslint-disable-next-line consistent-return
    return result
}

/**
 * Helper function for copy
 * @param {JSON} copyList - The data to copied
 * @param {boolean} cutflag - flase if we want to copy
 * @category events
 */
export function copy(copyList: any[], cutflag = false): string {
    if (copyList.length === 0) return ''
    const tempScope = new Scope(globalScope.name, globalScope.id)
    const oldOx = globalScope.ox
    const oldOy = globalScope.oy
    const oldScale = globalScope.scale
    const d = backUp(globalScope)
    const oldTestbenchData = globalScope.testbenchData

    loadScope(tempScope, d)
    scopeList[tempScope.id] = tempScope

    if (cutflag) {
        for (let i = 0; i < copyList.length; i++) {
            const obj = copyList[i]
            if (obj.objectType === 'Node') obj.objectType = 'allNodes'
            for (let j = 0; j < tempScope[obj.objectType].length; j++) {
                if (
                    tempScope[obj.objectType][j].x === obj.x &&
                    tempScope[obj.objectType][j].y === obj.y &&
                    (obj.objectType !== 'Node' || obj.type === 2)
                ) {
                    tempScope[obj.objectType][j].delete()
                    break
                }
            }
        }
    }
    tempScope.backups = globalScope.backups
    for (let i = 0; i < updateOrder.length; i++) {
        let prevLength = globalScope[updateOrder[i]].length // LOL length of list will reduce automatically when deletion starts
        for (let j = 0; j < globalScope[updateOrder[i]].length; j++) {
            const obj = globalScope[updateOrder[i]][j]
            if (obj.objectType !== 'Wire') {
                // }&&obj.objectType!='CircuitElement'){//}&&(obj.objectType!='Node'||obj.type==2)){
                if (!copyList.includes(globalScope[updateOrder[i]][j])) {
                    globalScope[updateOrder[i]][j].cleanDelete()
                }
            }

            if (globalScope[updateOrder[i]].length !== prevLength) {
                prevLength--
                j--
            }
        }
    }

    let prevLength = globalScope.wires.length
    for (let i = 0; i < globalScope.wires.length; i++) {
        globalScope.wires[i].checkConnections()
        if (globalScope.wires.length !== prevLength) {
            prevLength--
            i--
        }
    }

    updateSimulationSet(true)

    let data = backUp(globalScope)
    data.scopes = []
    const dependencyList: Record<string, any[]> = {}
    const requiredDependencies = globalScope.getDependencies()
    const completed: Record<string, boolean> = {}
    Object.keys(scopeList).forEach((id: string) => {
        dependencyList[id] = scopeList[id].getDependencies()
    })
    function saveScope(id: string): void {
        if (completed[id]) return
        for (let i = 0; i < dependencyList[id].length; i++) {
            saveScope(dependencyList[id][i])
        }
        completed[id] = true
        data.scopes.push(backUp(scopeList[id]))
    }
    for (let i = 0; i < requiredDependencies.length; i++) {
        saveScope(requiredDependencies[i])
    }
    data.logixClipBoardData = true
    data.testbenchData = undefined // Don't copy testbench data
    const result = JSON.stringify(data)
    simulationArea.multipleObjectSelections = []
    simulationArea.copyList = []
    updateSimulationSet(true)
    globalScope = tempScope
    scheduleUpdate()
    globalScope.ox = oldOx
    globalScope.oy = oldOy
    globalScope.scale = oldScale
    // Restore testbench data
    if (oldTestbenchData) {
        globalScope.testbenchData = new TestbenchData(
            oldTestbenchData.testData,
            oldTestbenchData.currentGroup,
            oldTestbenchData.currentCase
        )
    }

    forceResetNodesSet(true)
    // needs to be fixed
    // eslint-disable-next-line consistent-return
    return result
}

/**
 * Function selects all the elements from the scope
 * @category events
 */
export function selectAll(scope = globalScope): void {
    moduleList.forEach((val: string, _, __) => {
        if (scope.hasOwnProperty(val)) {
            simulationArea.multipleObjectSelections.push(...scope[val])
        }
    })

    if (scope.nodes) {
        simulationArea.multipleObjectSelections.push(...scope.nodes)
    }
}
