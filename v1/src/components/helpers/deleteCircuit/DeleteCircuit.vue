<template>
    <MessageBox
        v-model="promptStore.DeleteCircuit.activate"
        :circuit-item="promptStore.DeleteCircuit.circuitItem"
        :button-list="promptStore.DeleteCircuit.buttonList"
        :is-persistent="promptStore.DeleteCircuit.isPersistent"
        :message-text="promptStore.DeleteCircuit.messageText"
        @button-click="
            (selectedOption:string, circuitItem:CircuitItem) =>
                confirmation(selectedOption, circuitItem)
        "
    />
</template>

<script lang="ts">
import { showMessage } from '#/simulator/src/utils'
import { getDependenciesList, scopeList } from '#/simulator/src/circuit'
import { switchCircuit } from '#/simulator/src/circuit'
import { usePromptStore } from '#/store/promptStore'
import { useState } from '#/store/SimulatorStore/state'
import MessageBox from '#/components/MessageBox/messageBox.vue'

type SimulatorStateType = {
    activeCircuit: {
        id: string | number
        name: string
    }
    circuit_list: Array<Object>
    dialogBox: {
        delete_circuit: boolean
    }
}

type CircuitItem = {
    id: string | number
    name: string
}

function clearMessageBoxFields(): void {
    const promptStore = usePromptStore()

    promptStore.DeleteCircuit.activate = false
    promptStore.DeleteCircuit.circuitItem = {}
    promptStore.DeleteCircuit.isPersistent = false
    promptStore.DeleteCircuit.messageText = ''
    promptStore.DeleteCircuit.buttonList = []
}

export function closeCircuit(circuitItem: CircuitItem): void {
    const SimulatorState = <SimulatorStateType>useState()
    const promptStore = usePromptStore()

    clearMessageBoxFields()

    // Ensure at least one circuit remains
    if (SimulatorState.circuit_list.length <= 1) {
        promptStore.DeleteCircuit.activate = true
        promptStore.DeleteCircuit.isPersistent = false
        promptStore.DeleteCircuit.messageText =
            'At least 2 circuits need to be there in order to delete a circuit.'
        promptStore.DeleteCircuit.buttonList = [
            {
                text: 'Close',
                emitOption: 'dispMessage',
            },
        ]
        return
    }

    // Check whether other circuits depend on this circuit
    const dependencies = getDependenciesList(circuitItem.id)

    if (dependencies) {
        const circuitName = scopeList[circuitItem.id].name

        promptStore.DeleteCircuit.activate = true
        promptStore.DeleteCircuit.isPersistent = true
        promptStore.DeleteCircuit.circuitItem = circuitItem
        promptStore.DeleteCircuit.messageText =
            `The following circuits depend on '${circuitName}': [ ${dependencies} ].\n` +
            `Deleting it may break these circuits. Do you want to delete it anyway?`

        promptStore.DeleteCircuit.buttonList = [
            {
                text: 'Delete Anyway',
                emitOption: 'confirmDeletion',
            },
            {
                text: 'Cancel',
                emitOption: 'cancelDeletion',
            },
        ]
        return
    }

    // Normal confirmation when no dependencies exist
    promptStore.DeleteCircuit.activate = true
    promptStore.DeleteCircuit.isPersistent = true
    promptStore.DeleteCircuit.buttonList = [
        {
            text: 'Continue',
            emitOption: 'confirmDeletion',
        },
        {
            text: 'Cancel',
            emitOption: 'cancelDeletion',
        },
    ]
    promptStore.DeleteCircuit.circuitItem = circuitItem
    promptStore.DeleteCircuit.messageText = `Are you sure want to close: ${
        scopeList[circuitItem.id].name
    }\nThis cannot be undone.`
}

/**
 * Deletes the current circuit
 * Switched to another circuit if the active circuit is deleted
 * @category circuit
 */
export function deleteCurrentCircuit(
    scopeId: string | number = globalScope.id ?? useState().activeCircuit?.id
) {
    const SimulatorState = <SimulatorStateType>useState()
    const circuit_list = SimulatorState.circuit_list
    let scope = scopeList[scopeId]
    if (scope == undefined)
        scope = scopeList[globalScope.id ?? SimulatorState.activeCircuit?.id]

    if (scope.verilogMetadata.isVerilogCircuit) {
        scope.initialize()
        for (var id in scope.verilogMetadata.subCircuitScopeIds)
            delete scopeList[id]
    }

    // Remove SubCircuit instances that reference the circuit being deleted
    for (const parentScopeId in scopeList) {
        const parentScope = scopeList[parentScopeId]

        if (parentScope.id === scope.id || !parentScope.SubCircuit) {
            continue
        }

        for (let i = parentScope.SubCircuit.length - 1; i >= 0; i--) {
            const subCircuit = parentScope.SubCircuit[i]

            if (String(subCircuit.id) === String(scope.id)) {
                subCircuit.cleanDelete()

                // Invalidate cached copies of the parent circuit
                parentScope.timeStamp = Math.max(
                    Date.now(),
                    parentScope.timeStamp + 1
                )
            }
        }
    }

    const index = circuit_list.findIndex(
        (circuit: any) => circuit.id === scope.id
    )
    circuit_list.splice(index, 1)
    delete scopeList[scope.id]
    if (scope.id == globalScope.id ?? SimulatorState.activeCircuit?.id) {
        switchCircuit(Object.keys(scopeList)[0])
    }
    showMessage('Circuit was successfully closed')
}
</script>

<script lang="ts" setup>
const promptStore = usePromptStore()

function confirmation(selectedOption: string, circuitItem: CircuitItem): void {
    promptStore.DeleteCircuit.activate = false
    if (selectedOption == 'confirmDeletion') {
        deleteCurrentCircuit(circuitItem.id)
    } else if (selectedOption == 'cancelDeletion') {
        showMessage('Circuit was not closed')
    }
}
</script>
