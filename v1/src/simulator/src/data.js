import { fullView } from './ux'
import { createSubCircuitPrompt } from './subcircuit'
import save from './data/save'
import load from './data/load'
import createSaveAsImgPrompt from './data/saveImage'
import {
    clearProject,
    newProject,
    saveOffline,
    openOffline,
    recoverProject,
} from './data/project'
import { createNewCircuitScope } from './circuit'
import { createCombinationalAnalysisPrompt } from './combinationalAnalysis'
import { colorThemes } from './themer/themer'
import { showTourGuide } from './tutorials'
import { createVerilogCircuit } from './Verilog2CV'
import { generateVerilog } from './verilog'
import { bitConverterDialog, showError } from './utils'
import { keyBinder } from '#/components/DialogBox/CustomShortcut.vue'
import { ExportProject } from '#/components/DialogBox/ExportProject.vue'
import { ImportProject } from '#/components/DialogBox/ImportProject.vue'
import { canonicaliseProject } from './data/canonical'
import { importCanonical } from './data/importCanonical'
import { scopeList } from './circuit'
import { backUp, scheduleBackup } from './data/backupCircuit'
import { simulationArea } from './simulationArea'
import { syncTestbenchWithScope } from './testbench'

let beautifyInProgress = false

const logixFunction = {}
logixFunction.save = save
logixFunction.load = load
logixFunction.createSaveAsImgPrompt = createSaveAsImgPrompt
logixFunction.clearProject = clearProject
logixFunction.newProject = newProject
logixFunction.saveOffline = saveOffline
logixFunction.createOpenLocalPrompt = openOffline
logixFunction.recoverProject = recoverProject
logixFunction.createSubCircuitPrompt = createSubCircuitPrompt
logixFunction.createCombinationalAnalysisPrompt =
    createCombinationalAnalysisPrompt
logixFunction.fullViewOption = fullView
logixFunction.colorThemes = colorThemes
logixFunction.showTourGuide = showTourGuideHelper
logixFunction.newVerilogModule = createVerilogCircuit
logixFunction.generateVerilog = generateVerilog
logixFunction.bitconverter = bitConverterDialog
logixFunction.createNewCircuitScope = createNewCircuit
logixFunction.customShortcut = keyBinder
logixFunction.ExportProject = ExportProject
logixFunction.ImportProject = ImportProject
logixFunction.beautifyCircuit = triggerBeautifyCircuit
export default logixFunction

// Hack to restart tour guide
function showTourGuideHelper() {
    setTimeout(() => {
        showTourGuide()
    }, 100)
}

// Hack to call createNewCircuitScope with keyboard shortcut
function createNewCircuit() {
    createNewCircuitScope()
}

/**
 * Rebuilds the active circuit with ELK while preserving project state and undo history.
 */
async function triggerBeautifyCircuit() {
    if (beautifyInProgress) return
    const selected = simulationArea.multipleObjectSelections || []
    const selectedComponents = selected.filter(
        (component) =>
            component &&
            typeof component.objectType === 'string' &&
            component.objectType !== 'Wire' &&
            component.objectType !== 'CircuitElement',
    )
    if (selectedComponents.length > 0) {
        showError('Partial Beautify is under development.')
        return
    }
    beautifyInProgress = true

    const scopes = Object.values(scopeList)
    const activeCircuitId = String(globalScope.id)
    const savedScopeState = new Map(
        scopes.map((scope) => [
            String(scope.id),
            {
                backups: [...scope.backups],
                history: [...scope.history],
                testbenchData: scope.testbenchData,
            },
        ]),
    )
    let originalProject

    try {
        const project = await canonicaliseProject(scopes)
        originalProject = JSON.parse(JSON.stringify(project))
        const activeCircuit = project.circuits[activeCircuitId]
        if (!activeCircuit) {
            throw new Error(`Active circuit "${activeCircuitId}" was not found.`)
        }

        activeCircuit.layout = undefined
        const result = await importCanonical(project)
        if (!result.success) throw new Error(result.errors.join('\n'))

        for (const [id, state] of savedScopeState) {
            const rebuiltScope = scopeList[id]
            if (!rebuiltScope) continue
            rebuiltScope.backups = [...state.backups]
            rebuiltScope.history = [...state.history]
            rebuiltScope.testbenchData = state.testbenchData
        }

        const rebuiltScope = scopeList[activeCircuitId]
        if (!rebuiltScope) {
            throw new Error(`Rebuilt circuit "${activeCircuitId}" was not found.`)
        }
        const preBeautifyBackup = JSON.stringify(backUp(globalScope))
        if (rebuiltScope.backups[rebuiltScope.backups.length - 1] !== preBeautifyBackup) {
            rebuiltScope.backups.push(preBeautifyBackup)
        }
        scheduleBackup(rebuiltScope)
        syncTestbenchWithScope(rebuiltScope)
    } catch (err) {
        console.error('[beautifyCircuit] Error:', err)
        if (originalProject) {
            try {
                const rollbackResult = await importCanonical(originalProject)
                if (!rollbackResult.success) {
                    throw new Error(rollbackResult.errors.join('\n'))
                }
                for (const [id, state] of savedScopeState) {
                    const restoredScope = scopeList[id]
                    if (!restoredScope) continue
                    restoredScope.backups = [...state.backups]
                    restoredScope.history = [...state.history]
                    restoredScope.testbenchData = state.testbenchData
                }
                syncTestbenchWithScope(scopeList[activeCircuitId])
            } catch (rollbackError) {
                console.error('[beautifyCircuit] Rollback failed:', rollbackError)
            }
        }
        showError('Beautify Circuit failed.')
    } finally {
        beautifyInProgress = false
    }
}
