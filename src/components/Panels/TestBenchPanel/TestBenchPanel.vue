<template>
  <div
    class="testbench-manual-panel draggable-panel noSelect defaultCursor"
    ref="testbenchPanelRef"
  >
    <div class="panel-header">
      {{ $t("simulator.panel_header.testbench") }}
      <span class="fas fa-minus-square minimize panel-button"></span>
      <span
        class="fas fa-external-link-square-alt maximize panel-button-icon"
      ></span>
    </div>
    <div
      v-if="testBenchStore.showTestbenchUI"
      class="panel-body tb-test-not-null tb-panel-hidden"
    >
      <div class="tb-manual-test-data">
        <div style="margin-bottom: 10px; overflow: auto">
          <span id="data-title" class="tb-data"
            ><b>{{ $t("simulator.panel_body.testbench.test") }}</b>
            <span>{{
              testData.title || $t("simulator.panel_body.testbench.untitled")
            }}</span></span
          >
          <span id="data-type" class="tb-data"
            ><b>{{ $t("simulator.panel_body.testbench.type") }}</b>
            <span>{{
              testData.type === "comb"
                ? $t("simulator.panel_body.testbench.combinational")
                : $t("simulator.panel_body.testbench.sequential")
            }}</span></span
          >
        </div>
        <button
          id="edit-test-btn"
          @mousedown="buttonListenerFunctions.editTestButton()"
          class="custom-btn--basic panel-button tb-dialog-button"
        >
          {{ $t("simulator.panel_body.testbench.edit") }}
        </button>
        <button
          id="remove-test-btn"
          @mousedown="buttonListenerFunctions.removeTestButton()"
          class="custom-btn--tertiary panel-button tb-dialog-button"
        >
          {{ $t("simulator.panel_body.testbench.remove") }}
        </button>
      </div>
      <div style="overflow: auto; margin-bottom: 10px">
        <div class="tb-manual-test-buttons tb-group-buttons">
          <span style="line-height: 24px; margin-right: 5px"
            ><b>{{ $t("simulator.panel_body.testbench.group") }} </b></span
          >
          <button
            id="prev-group-btn"
            @mousedown="buttonListenerFunctions.previousGroupButton()"
            class="custom-btn--basic panel-button tb-case-button-left tb-case-button"
          >
            <i class="tb-case-arrow tb-case-arrow-left"></i>
          </button>
          <span class="tb-test-label group-label">
            {{
              testData.groups[testBenchStore.testbenchData.currentGroup].label
            }}</span
          >
          <button
            id="next-group-btn"
            @mousedown="buttonListenerFunctions.nextGroupButton()"
            class="custom-btn--basic panel-button tb-case-button-right tb-case-button"
          >
            <i class="tb-case-arrow tb-case-arrow-right"></i>
          </button>
        </div>
        <div class="tb-manual-test-buttons tb-case-buttons">
          <span style="line-height: 24px; margin-right: 5px"
            ><b>{{ $t("simulator.panel_body.testbench.case") }} </b></span
          >
          <button
            id="prev-case-btn"
            @mousedown="buttonListenerFunctions.previousCaseButton()"
            class="custom-btn--basic panel-button tb-case-button-left tb-case-button"
          >
            <i class="tb-case-arrow tb-case-arrow-left"></i>
          </button>
          <span class="tb-test-label case-label"> {{ currentCase + 1 }}</span>
          <button
            id="next-case-btn"
            @mousedown="buttonListenerFunctions.nextCaseButton()"
            class="custom-btn--basic panel-button tb-case-button-right tb-case-button"
          >
            <i class="tb-case-arrow tb-case-arrow-right"></i>
          </button>
        </div>
      </div>
      <div style="text-align: center">
        <table class="tb-manual-table">
          <thead>
            <tr id="tb-manual-table-labels">
              <th>{{ $t("simulator.panel_body.testbench.labels") }}</th>
              <th v-for="io in combinedIO" :key="io.label">{{ io.label }}</th>
            </tr>
          </thead>

          <tbody>
            <tr id="tb-manual-table-bitwidths">
              <td>{{ $t("simulator.panel_body.testbench.bitwidth") }}</td>
              <td v-for="io in combinedIO" :key="io.label">
                {{ io.bitWidth }}
              </td>
            </tr>
            <tr id="tb-manual-table-current-case">
              <td>{{ $t("simulator.panel_body.testbench.current_case") }}</td>
              <td v-for="input in inputs" :key="input.label">
                {{ input.values[currentCase] }}
              </td>
              <td v-for="output in outputs" :key="output.label">
                {{ output.values[currentCase] }}
              </td>
            </tr>
            <tr id="tb-manual-table-test-result">
              <td>{{ $t("simulator.panel_body.testbench.result") }}</td>
              <td
                v-for="(result, index) in testBenchStore.resultValues"
                :key="index"
                :style="{ color: result.color }"
              >
                {{ result.value }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style="display: table; margin-top: 20px; margin-left: 8px">
        <div class="testbench-manual-panel-buttons">
          <button
            id="validate-btn"
            @mousedown="buttonListenerFunctions.validateButton()"
            class="custom-btn--basic panel-button tb-dialog-button"
          >
            {{ $t("simulator.panel_body.testbench.validate") }}
          </button>
          <button
            id="runall-btn"
            @mousedown="buttonListenerFunctions.runAllButton()"
            class="custom-btn--primary panel-button tb-dialog-button"
          >
            {{ $t("simulator.panel_body.testbench.run_all") }}
          </button>
        </div>
        <span v-if="testBenchStore.showPassed">
          <span
            >{{ testBenchStore.passed }}
            {{ $t("simulator.panel_body.testbench.out_of") }}
            {{ testBenchStore.total }}</span
          >
          {{ $t("simulator.panel_body.testbench.tests_passed") }}
          <span @mousedown="openCreator('result')" :style="{ color: '#18a2cd' }"
            >{{ $t("simulator.panel_body.testbench.view_detailed") }}</span
          >
        </span>
      </div>
    </div>
    <div v-else class="panel-body tb-test-null">
      <div class="tb-manual-test-data">
        <div style="margin-bottom: 10px; overflow: auto">
          <p><i>{{ $t("simulator.panel_body.testbench.no_test_attached") }}</i></p>
        </div>
        <button
          id="attach-test-btn"
          @mousedown="buttonListenerFunctions.attachTestButton()"
          class="custom-btn--primary panel-button tb-dialog-button"
        >
          {{ $t("simulator.panel_body.testbench.attach_test") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useTestBenchStore } from "#/store/testBenchStore";
import { computed } from "vue";
import { buttonListenerFunctions } from "#/simulator/src/testbench";
import { openCreator } from "#/simulator/src/testbench";
import { useLayoutStore } from "#/store/layoutStore";
import { onMounted, ref } from "vue";
import { setupPanelListeners, minimizePanel } from "#/simulator/src/ux";

const layoutStore = useLayoutStore();
const testBenchStore = useTestBenchStore();
const testbenchPanelRef = ref<HTMLElement | null>(null);

onMounted(() => {
  layoutStore.testbenchPanelRef = testbenchPanelRef.value;
  setupPanelListeners(".testbench-manual-panel");
  minimizePanel(".testbench-manual-panel");
});

const testData = computed(() => testBenchStore.testbenchData?.testData);

const combinedIO = computed(() => {
  const group = testData.value.groups[0];
  return group ? group.inputs.concat(group.outputs) : [];
});

const currentGroup = computed(() => testBenchStore.testbenchData.currentGroup);
const currentCase = computed(() => testBenchStore.testbenchData.currentCase);

const inputs = computed(
  () => testData.value.groups[currentGroup.value]?.inputs ?? [],
);
const outputs = computed(
  () => testData.value.groups[currentGroup.value]?.outputs ?? [],
);
</script>
