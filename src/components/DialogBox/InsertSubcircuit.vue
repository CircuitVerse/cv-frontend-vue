<template>
    <v-dialog
        v-model="SimulatorState.dialogBox.insertsubcircuit_dialog"
        :persistent="false"
    >
        <v-card class="messageBoxContent">
            <v-card-text>
                <p class="dialogHeader">{{ $t('simulator.insert_subcircuit.insert_btn') }}</p>
                <v-btn
                    size="x-small"
                    icon
                    class="dialogClose"
                    @click="
                        SimulatorState.dialogBox.insertsubcircuit_dialog = false
                    "
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
                <div
                    id="insertSubcircuitDialog"
                    class="subcircuitdialog"
                    :title="$t('simulator.insert_subcircuit.insert_btn')"
                >
                    <template
                        v-for="(value, scopeId) in scopeList"
                        :key="scopeId"
                    >
                        <label
                            v-if="availableSubCircuits(value, scopeId)"
                            class="option custom-radio inline"
                        >
                            <input
                                type="radio"
                                name="subCircuitId"
                                :value="scopeId"
                            />
                            {{ getName(value) }}
                            <span></span>
                        </label>
                    </template>
                    <p v-if="flag == true">
                        {{ $t('simulator.insert_subcircuit.no_circuits') }}
                    </p>
                </div>
            </v-card-text>
            <v-card-actions>
                <v-btn
                    v-if="flag == false"
                    class="messageBtn"
                    block
                    @click="insertSubcircuit()"
                >
                    {{ $t('simulator.insert_subcircuit.insert_btn') }}
                </v-btn>
                <v-btn v-else class="messageBtn" block @click="newCircuit">
                    {{ $t('simulator.insert_subcircuit.new_circuit_btn') }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
import { onMounted, onUpdated, ref } from '@vue/runtime-core'
import { useState } from '#/store/SimulatorStore/state'
import { createNewCircuitScope, scopeList } from '#/simulator/src/circuit'
import SubCircuit from '#/simulator/src/subcircuit'
import { simulationArea } from '#/simulator/src/simulationArea'
const SimulatorState = useState()
const flag = ref(true)
onMounted(() => {
    SimulatorState.dialogBox.insertsubcircuit_dialog = false
})

function insertSubcircuit() {
    const checkedSubCircuit = document.querySelector(
        'input[name=subCircuitId]:checked'
    ) as HTMLInputElement
    if (!checkedSubCircuit?.value) return
    simulationArea.lastSelected = new SubCircuit(
        undefined,
        undefined,
        globalScope,
        checkedSubCircuit?.value
    )
    flag.value = true
    SimulatorState.dialogBox.insertsubcircuit_dialog = false
}

function getName(x) {
    flag.value = false
    return x.name
}

function availableSubCircuits(value, scopeId) {
    return (
        !value.checkDependency(scopeId) &&
        value.isVisible() &&
        value !== globalScope
    )
}

function newCircuit() {
    createNewCircuitScope()
    SimulatorState.dialogBox.insertsubcircuit_dialog = false
}
</script>

<!-- 
	Some error on inserting empty circuit as subcircuit
	Some error on checking for rendering 
-->
