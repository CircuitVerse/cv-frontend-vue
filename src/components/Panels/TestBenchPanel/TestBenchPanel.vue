<template>
    <div class="testbench-manual-panel draggable-panel noSelect defaultCursor" ref="testbenchPanelRef">
        <div class="panel-header">
            Testbench
            <span class="fas fa-minus-square minimize panel-button"></span>
            <span class="fas fa-external-link-square-alt maximize panel-button-icon"></span>
        </div>
        <div v-if="testBenchStore.showTestbenchUI" class="panel-body tb-test-not-null tb-panel-hidden">
            <div class="tb-manual-test-data">
                <div style="margin-bottom: 10px; overflow: auto">
                    <span id="data-title" class="tb-data"><b>Test:</b> <span>{{ testData.title || 'Untitled'
                            }}</span></span>
                    <span id="data-type" class="tb-data"><b>Type:</b> <span>{{ testData.type === 'comb' ?
                            'Combinational' : 'Sequential' }}</span></span>
                </div>
                <button id="edit-test-btn" @mousedown="buttonListenerFunctions.editTestButton()"
                    class="custom-btn--basic panel-button tb-dialog-button">
                    Edit
                </button>
                <button id="remove-test-btn" @mousedown="buttonListenerFunctions.removeTestButton()"
                    class="custom-btn--tertiary panel-button tb-dialog-button">
                    Remove
                </button>
            </div>
            <div style="overflow: auto; margin-bottom: 10px">
                <div class="tb-manual-test-buttons tb-group-buttons">
                    <span style="line-height: 24px; margin-right: 5px"><b>Group: </b></span>
                    <button id="prev-group-btn" @mousedown="buttonListenerFunctions.previousGroupButton()"
                        class="custom-btn--basic panel-button tb-case-button-left tb-case-button">
                        <i class="tb-case-arrow tb-case-arrow-left"></i>
                    </button>
                    <span class="tb-test-label group-label"> {{ testData.groups[testBenchStore.testbenchData.currentGroup].label
                        }}</span>
                    <button id="next-group-btn" @mousedown="buttonListenerFunctions.nextGroupButton()"
                        class="custom-btn--basic panel-button tb-case-button-right tb-case-button">
                        <i class="tb-case-arrow tb-case-arrow-right"></i>
                    </button>
                </div>
                <div class="tb-manual-test-buttons tb-case-buttons">
                    <span style="line-height: 24px; margin-right: 5px"><b>Case: </b></span>
                    <button id="prev-case-btn" @mousedown="buttonListenerFunctions.previousCaseButton()"
                        class="custom-btn--basic panel-button tb-case-button-left tb-case-button">
                        <i class="tb-case-arrow tb-case-arrow-left"></i>
                    </button>
                    <span class="tb-test-label case-label"> {{ currentCase + 1 }}</span>
                    <button id="next-case-btn" @mousedown="buttonListenerFunctions.nextCaseButton()"
                        class="custom-btn--basic panel-button tb-case-button-right tb-case-button">
                        <i class="tb-case-arrow tb-case-arrow-right"></i>
                    </button>
                </div>
            </div>
            <div style="text-align: center">
                <table class="tb-manual-table">
                    <tr id="tb-manual-table-labels">
                        <th>LABELS</th>
                        <th v-for="io in combinedIO" :key="io.label">{{ io.label }}</th>
                    </tr>
                    <tr id="tb-manual-table-bitwidths">
                        <td>Bitwidth</td>
                        <td v-for="io in combinedIO" :key="io.label">{{ io.bitWidth }}</td>
                    </tr>
                    <tr id="tb-manual-table-current-case">
                        <td>Current Case</td>
                        <td v-for="input in inputs" :key="input.label">{{
                            input.values[currentCase] }}</td>
                        <td v-for="output in outputs" :key="output.label">{{
                            output.values[currentCase] }}</td>
                    </tr>
                    <tr id="tb-manual-table-test-result">
                        <td>Result</td>
                        <td v-for="(result, index) in testBenchStore.resultValues" :key="index" :style="{ color: result.color }">{{ result.value }}</td>
                    </tr>
                </table>
            </div>
            <div style="display: table; margin-top: 20px; margin-left: 8px">
                <div class="testbench-manual-panel-buttons">
                    <button id="validate-btn" @mousedown="buttonListenerFunctions.validateButton()"
                        class="custom-btn--basic panel-button tb-dialog-button">
                        Validate
                    </button>
                    <button id="runall-btn" @mousedown="buttonListenerFunctions.runAllButton()"
                        class="custom-btn--primary panel-button tb-dialog-button">
                        Run All
                    </button>
                </div>
                <span v-if="testBenchStore.showPassed">
                    <span>{{ testBenchStore.passed }} out of {{ testBenchStore.total }}</span> Tests Passed
                    <span @mousedown="openCreator('result')" :style="{ color: '#18a2cd' }">View Detailed</span>
                </span>
            </div>
        </div>
        <div v-else class="panel-body tb-test-null">
            <div class="tb-manual-test-data">
                <div style="margin-bottom: 10px; overflow: auto">
                    <p><i>No Test is attached to the current circuit</i></p>
                </div>
                <button id="attach-test-btn" @mousedown="buttonListenerFunctions.attachTestButton()"
                    class="custom-btn--primary panel-button tb-dialog-button">
                    Attach Test
                </button>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useTestBenchStore } from '#/store/testBenchStore'
import { computed } from 'vue'
import { buttonListenerFunctions } from '#/simulator/src/testbench'
import { openCreator } from '#/simulator/src/testbench';
import { useLayoutStore } from '#/store/layoutStore'
import { onMounted, ref } from 'vue'

const layoutStore = useLayoutStore()
const testBenchStore = useTestBenchStore();
const testbenchPanelRef = ref<HTMLElement | null>(null);

onMounted(() => {
    layoutStore.testbenchPanelRef = testbenchPanelRef.value
})

const testData = computed(() => testBenchStore.testbenchData?.testData);

const combinedIO = computed(() => {
    const group = testData.value.groups[0];
    return group.inputs.concat(group.outputs);
});

const currentGroup = computed(() => testBenchStore.testbenchData.currentGroup);
const currentCase = computed(() => testBenchStore.testbenchData.currentCase);

const inputs = computed(() => testData.value.groups[currentGroup.value].inputs);
const outputs = computed(() => testData.value.groups[currentGroup.value].outputs);
</script>

<style scoped>
.testbench-manual-panel {
    border-radius: 5px;
    z-index: 100;
    transition: background 0.5s ease-out;
    position: fixed;
    cursor: pointer;
    left: 10px;
    top: 470px;
}

.testbench-manual-panel .panel-header {
    border-radius: 5px;
    border-top-right-radius: 5px;
    padding: 3px;
    font-weight: bold;
    font-size: 16px;
    text-transform: uppercase;
    text-align: left;
    cursor: move;
}

.tb-case-arrow {
    border: solid var(--text-panel);
    border-width: 0 3px 3px 0;
    display: inline-block;
    padding: 3px;
}

.tb-case-arrow-right {
    transform: rotate(-45deg);
    -webkit-transform: rotate(-45deg);
}

.tb-case-arrow-left {
    transform: rotate(135deg);
    -webkit-transform: rotate(135deg);
}

.testbench-manual-panel .panel-body {
    width: 700px;
}

.testbench-manual-panel b {
    font-weight: bold;
}

.tb-manual-test-data {
    /*text-align: center;*/
    margin-top: 10px;
    border-bottom: 1px solid var(--br-secondary);
    padding-left: 8px;
    padding-right: 8px;
}

.tb-manual-test-data .tb-data {
    margin-right: 10px;
}

.tb-data span {
    vertical-align: middle;
    display: inline-block;
    max-width: 200px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.tb-data#data-title {
    float: left;
}

.tb-data#data-type {
    float: right;
}

.tb-manual-table {
    position: relative;
    display: inline-block;
    margin-top: 10px;
    color: var(--text-panel);
    max-width: 650px;
    overflow-x: auto;
    white-space: nowrap;
}

.tb-manual-table td,
.tb-manual-table th {
    padding-left: 15px;
    padding-right: 15px;
    padding-top: 12px;
    padding-bottom: 12px;
    text-align: center;
    min-width: 80px;
}

.tb-manual-table th {
    background: var(--table-head-dark);
    height: 50px;
}

.testbench-manual-panel-buttons {
    position: relative;
    display: table-cell;
    flex-wrap: wrap;
    right: 0px;
    text-align: left;
    width: 200px;
}

.tb-dialog-button {
    display: inline;
    margin: 8px;
    border-radius: 5px !important;
    padding-left: 8px !important;
    padding-right: 8px !important;
    padding-top: 4px !important;
    padding-bottom: 4px !important;
}

.tb-manual-test-buttons {
    display: flex;
    margin-top: 20px;
    margin-left: 30px;
    margin-right: 30px;
    height: 25px;
    overflow: auto;
}

.tb-manual-test-buttons .tb-case-button-left {
    border-bottom-left-radius: 5px;
    border-top-left-radius: 5px;
    width: 24px;
}

.tb-manual-test-buttons .tb-case-button-right {
    border-bottom-right-radius: 5px;
    border-top-right-radius: 5px;
    width: 24px;
}

.tb-manual-test-buttons .tb-test-label {
    position: relative;
    top: 0px;
    line-height: 25px;
    height: 25px;
    margin: 0px;
    padding-left: 2px;
    padding-right: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    background: #c4c4c4;
    color: black;
}

.tb-manual-test-buttons .tb-test-label.group-label {
    text-align: center;
    width: 100px;
}

.tb-manual-test-buttons .tb-test-label.case-label {
    text-align: center;
    width: 40px;
}

.tb-group-buttons {
    float: left;
}

.tb-case-buttons {
    float: right;
}

.tb-test-null {
    width: 350px !important;
}

.validation-ui-table td,
.validation-ui-table th {
    padding-left: 15px;
    padding-right: 15px;
    padding-top: 12px;
    padding-bottom: 12px;
    text-align: center;
    min-width: 80px;
    color: white;
}
</style>
