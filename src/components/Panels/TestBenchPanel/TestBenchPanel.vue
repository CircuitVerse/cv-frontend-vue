<template>
    <div ref="testbenchPanelRef" class="testbench-manual-panel draggable-panel noSelect defaultCursor">
        <div class="panel-header">
            Testbench
            <span class="fas fa-minus-square minimize panel-button"></span>
            <span class="fas fa-external-link-square-alt maximize panel-button-icon"></span>
        </div>
        <div v-if="testBenchStore.showTestbenchUI" class="panel-body tb-test-not-null tb-panel-hidden">
            <div class="tb-manual-test-data">
                <div class="tb-scroll-container">
                    <span id="data-title" class="tb-data"><b>Test:</b> <span>{{ testData.title || 'Untitled' }}</span></span>
                    <span id="data-type" class="tb-data"><b>Type:</b> <span>{{ testData.type === 'comb' ? 'Combinational' : 'Sequential' }}</span></span>
                </div>
                <button id="edit-test-btn" class="custom-btn--basic panel-button tb-dialog-button" @mousedown="buttonListenerFunctions.editTestButton()">
                    Edit
                </button>
                <button id="remove-test-btn" class="custom-btn--tertiary panel-button tb-dialog-button" @mousedown="buttonListenerFunctions.removeTestButton()">
                    Remove
                </button>
            </div>
            <div class="tb-scroll-container">
                <div class="tb-manual-test-buttons tb-group-buttons">
                    <span class="tb-label"><b>Group: </b></span>
                    <button id="prev-group-btn" class="custom-btn--basic panel-button tb-case-button-left tb-case-button" @mousedown="buttonListenerFunctions.previousGroupButton()">
                        <i class="tb-case-arrow tb-case-arrow-left"></i>
                    </button>
                    <span class="tb-test-label group-label">{{ testData.groups[testBenchStore.testbenchData.currentGroup].label }}</span>
                    <button id="next-group-btn" class="custom-btn--basic panel-button tb-case-button-right tb-case-button" @mousedown="buttonListenerFunctions.nextGroupButton()">
                        <i class="tb-case-arrow tb-case-arrow-right"></i>
                    </button>
                </div>
                <div class="tb-manual-test-buttons tb-case-buttons">
                    <span class="tb-label"><b>Case: </b></span>
                    <button id="prev-case-btn" class="custom-btn--basic panel-button tb-case-button-left tb-case-button" @mousedown="buttonListenerFunctions.previousCaseButton()">
                        <i class="tb-case-arrow tb-case-arrow-left"></i>
                    </button>
                    <span class="tb-test-label case-label">{{ currentCase + 1 }}</span>
                    <button id="next-case-btn" class="custom-btn--basic panel-button tb-case-button-right tb-case-button" @mousedown="buttonListenerFunctions.nextCaseButton()">
                        <i class="tb-case-arrow tb-case-arrow-right"></i>
                    </button>
                </div>
            </div>
            <div class="tb-table-wrapper">
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
                        <td v-for="input in inputs" :key="input.label">{{ input.values[currentCase] }}</td>
                        <td v-for="output in outputs" :key="output.label">{{ output.values[currentCase] }}</td>
                    </tr>
                    <tr id="tb-manual-table-test-result">
                        <td>Result</td>
                        <td v-for="(result, index) in testBenchStore.resultValues" :key="index" :class="{ 'result-pass': result.color === 'green', 'result-fail': result.color === 'red' }">{{ result.value }}</td>
                    </tr>
                </table>
            </div>
            <div class="tb-footer">
                <div class="testbench-manual-panel-buttons">
                    <button id="validate-btn" class="custom-btn--basic panel-button tb-dialog-button" @mousedown="buttonListenerFunctions.validateButton()">
                        Validate
                    </button>
                    <button id="runall-btn" class="custom-btn--primary panel-button tb-dialog-button" @mousedown="buttonListenerFunctions.runAllButton()">
                        Run All
                    </button>
                </div>
                <span v-if="testBenchStore.showPassed">
                    <span>{{ testBenchStore.passed }} out of {{ testBenchStore.total }}</span> Tests Passed
                    <span class="tb-view-detailed" @mousedown="openCreator('result')">View Detailed</span>
                </span>
            </div>
        </div>
        <div v-else class="panel-body tb-test-null">
            <div class="tb-manual-test-data">
                <div class="tb-scroll-container">
                    <p><i>No Test is attached to the current circuit</i></p>
                </div>
                <button id="attach-test-btn" class="custom-btn--primary panel-button tb-dialog-button" @mousedown="buttonListenerFunctions.attachTestButton()">
                    Attach Test
                </button>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useTestBenchStore } from '#/store/testBenchStore';
import { computed } from 'vue';
import { buttonListenerFunctions } from '#/simulator/src/testbench';
import { openCreator } from '#/simulator/src/testbench';
import { useLayoutStore } from '#/store/layoutStore';
import { onMounted, ref } from 'vue';

const layoutStore = useLayoutStore();
const testBenchStore = useTestBenchStore();
const testbenchPanelRef = ref<HTMLElement | null>(null);

onMounted(() => {
    layoutStore.testbenchPanelRef = testbenchPanelRef.value;
});

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
.panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background-color: #f5f5f5;
    border-bottom: 1px solid #ddd;
}
.panel-button {
    margin-left: 8px;
}
.tb-scroll-container {
    margin-bottom: 10px;
    overflow: auto;
}
.tb-label {
    line-height: 24px;
    margin-right: 5px;
}
.tb-table-wrapper {
    text-align: center;
}
.tb-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
    padding: 8px;
}
.tb-view-detailed {
    color: #18a2cd;
    cursor: pointer;
}
.result-pass {
    color: green;
}
.result-fail {
    color: red;
}
</style>
