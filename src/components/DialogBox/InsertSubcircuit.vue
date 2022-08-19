<template>
    <v-dialog
        v-model="SimulatorState.dialogBox.insertsubcircuit_dialog"
        :persistent="false"
    >
        <v-card class="messageBoxContent">
            <v-card-text>
                <p class="dialogHeader">Insert Subcircuit</p>
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
                    title="Insert SubCircuit"
                >
                    <template
                        v-for="(value, scopeId) in scopeList"
                        :key="scopeId"
                    >
                        <label
                            v-if="
                                !value.checkDependency(scopeId) &&
                                value.isVisible()
                            "
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
                </div>
            </v-card-text>
            <v-card-actions>
                <v-btn class="messageBtn" block @click="insertSubcircuit()">
                    Insert SubCircuit
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
import { onMounted, onUpdated, ref } from '@vue/runtime-core'
import { useState } from '#/store/SimulatorStore/state'
import { scopeList } from '#/simulator/src/circuit'
import SubCircuit from '#/simulator/src/subcircuit'
import simulationArea from '#/simulator/src/simulationArea'
const SimulatorState = useState()
const flag = ref(true)
onMounted(() => {
    SimulatorState.dialogBox.insertsubcircuit_dialog = false
})
onUpdated(() => {
    console.log(scopeList)
})

function insertSubcircuit() {
    if (!$('input[name=subCircuitId]:checked').val()) return
    simulationArea.lastSelected = new SubCircuit(
        undefined,
        undefined,
        globalScope,
        $('input[name=subCircuitId]:checked').val()
    )
    SimulatorState.dialogBox.insertsubcircuit_dialog = false
}

function getName(x) {
    return x.name
}
</script>
