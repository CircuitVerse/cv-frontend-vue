import { defineStore } from "pinia";
import { reactive, ref } from "vue";
import { runTestBench } from "#/components/Panels/TestBenchPanel/testbench";

export interface TestData {
  type: string;
  title: string;
  groups: {
    label: string;
    inputs: {
      label: string;
      bitWidth: number;
      values: string[];
    }[];
    outputs: {
      label: string;
      bitWidth: number;
      values: string[];
      results?: string[];
    }[];
    n: number;
  }[];
}

export interface TestBenchData {
  testData: TestData;
  currentGroup: number;
  currentCase: number;

  isCaseValid?(): boolean;
  setCase?(groupIndex: number, caseIndex: number): boolean;
  groupNext?(): boolean;
  groupPrev?(): boolean;
  caseNext?(): boolean;
  casePrev?(): boolean;
  goToFirstValidGroup?(): boolean;
};

export const useTestBenchStore = defineStore("testBenchStore", () => {
  const showTestBenchCreator = ref(false);
  const scopeId = ref<string | null>(null);
  const showPopup = ref(false);
  const data = ref<string | null>(null);
  const result = ref<string | null>(null);
  const showTestbenchUI = ref(false);

  const testData = reactive<TestData>({
    type: "",
    title: "",
    groups: [],
  });

  const testbenchData = reactive<TestBenchData>({
    testData: testData,
    currentGroup: 0,
    currentCase: 0,
  });

  const toggleTestBenchCreator = (value: boolean) => {
    showTestBenchCreator.value = value;
  }

  const createCreator = (id: string, popup: boolean, dataString?: string, dataType?: "data" | "result") => {
    scopeId.value = id;
    showPopup.value = popup;
    if(!dataString) return;

    if (dataType === "data") {
      data.value = dataString;
    } else {
      result.value = dataString;
    }
  }

  const sendData = (dataValues: TestData, circuitScopeID: string | null) => {
    // if (circuitScopeID !== scopeId.value) return;

    showTestbenchUI.value = true;
    testData.type = dataValues.type;
    testData.title = dataValues.title;
    testData.groups = dataValues.groups;
    runTestBench(dataValues, globalScope, 0);
    toggleTestBenchCreator(false);
  }

  return {
    showTestBenchCreator,
    toggleTestBenchCreator,
    createCreator,
    scopeId,
    showPopup,
    data,
    result,
    sendData,
    testbenchData,
    showTestbenchUI,
  }
})
