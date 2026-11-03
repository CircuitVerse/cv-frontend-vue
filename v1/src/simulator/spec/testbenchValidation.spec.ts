import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

const { showMessage } = vi.hoisted(() => ({ showMessage: vi.fn() }));
vi.mock("#/simulator/src/utils", () => ({ showMessage, escapeHtml: (value: string) => value }));
vi.mock("#/simulator/src/engine", () => ({ play: vi.fn() }));
vi.mock("#/simulator/src/sequential", () => ({ changeClockEnable: vi.fn() }));
vi.mock("#/utils/confirm", () => ({ confirmOption: vi.fn() }));

import { useTestBenchStore } from "#/store/testBenchStore";

describe("runTestBench validation", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    showMessage.mockClear();
  });

  const createTestData = (title: string) => ({
    type: "comb",
    title,
    groups: [
      {
        label: "Group 1",
        inputs: [{ label: "A", bitWidth: 1, values: ["0"] }],
        outputs: [{ label: "Y", bitWidth: 1, values: ["0"] }],
        n: 1,
      },
    ],
  });

  const invalidScope = () => ({ Input: [], Output: [] });
  const validScope = () => ({
    Input: [{ label: "A", bitWidth: 1 }],
    Output: [{ label: "Y", bitWidth: 1 }],
  });

  it("keeps the panel hidden and exposes detailed validation errors when no TestBench is attached", () => {
    const invalidData = createTestData("Missing I/O circuit");
    const scope = { Input: [], Output: [] };
    window.globalScope = scope;
    const store = useTestBenchStore();
    store.showTestBenchCreator = true;
    store.sendData(invalidData);

    expect(showMessage).toHaveBeenCalledWith(
      "Testbench: Some elements missing from circuit. Click Validate to know more",
    );
    expect(store.showTestbenchUI).toBe(false);
    expect(store.showTestBenchCreator).toBe(true);
    expect(store.showTestBenchValidator).toBe(true);
    expect(store.validationErrors.ok).toBe(false);
    expect(store.validationErrors.invalids).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          identifier: "A",
          message: "Input is not present in the circuit",
        }),
        expect.objectContaining({
          identifier: "Y",
          message: "Output is not present in the circuit",
        }),
      ]),
    );
  });

  it("preserves the current attachment and panel while exposing replacement errors", () => {
    window.globalScope = validScope();
    const store = useTestBenchStore();
    store.sendData(createTestData("Existing valid TestBench"));
    const originalAttachment = store.testbenchData.testData;

    window.globalScope = invalidScope();
    store.showTestBenchCreator = true;
    store.sendData(createTestData("Invalid replacement"));

    expect(store.testbenchData.testData).toBe(originalAttachment);
    expect(store.testbenchData.testData.title).toBe("Existing valid TestBench");
    expect(store.showTestbenchUI).toBe(true);
    expect(store.showTestBenchCreator).toBe(true);
    expect(store.showTestBenchValidator).toBe(true);
    expect(store.validationErrors.ok).toBe(false);
    expect(store.validationErrors.invalids).toHaveLength(2);
  });

  it("preserves the current attachment and panel when an empty replacement is rejected", () => {
    window.globalScope = validScope();
    const store = useTestBenchStore();
    store.sendData(createTestData("Existing valid TestBench"));
    const originalAttachment = store.testbenchData.testData;

    const emptyData = {
      type: "comb",
      title: "Empty replacement",
      groups: [],
    };
    store.showTestBenchCreator = true;
    store.sendData(emptyData);

    expect(showMessage).toHaveBeenCalledWith(
      "Testbench: Some elements missing from circuit. Click Validate to know more",
    );
    expect(store.testbenchData.testData).toBe(originalAttachment);
    expect(store.testbenchData.testData.title).toBe("Existing valid TestBench");
    expect(store.showTestbenchUI).toBe(true);
    expect(store.showTestBenchCreator).toBe(true);
    expect(store.showTestBenchValidator).toBe(true);
    expect(store.validationErrors.invalids).toEqual([
      expect.objectContaining({ identifier: "TestBench", message: "TestBench has no groups" }),
    ]);
  });

  it("preserves the current attachment when a replacement has no test cases", () => {
    window.globalScope = validScope();
    const store = useTestBenchStore();
    store.sendData(createTestData("Existing valid TestBench"));
    const originalAttachment = store.testbenchData.testData;
    const emptyData = {
      type: "comb",
      title: "Empty replacement",
      groups: [{ label: "Group 1", inputs: [], outputs: [], n: 0 }],
    };
    store.showTestBenchCreator = true;

    store.sendData(emptyData);

    expect(showMessage).toHaveBeenCalledWith("Testbench: The test is empty");
    expect(store.testbenchData.testData).toBe(originalAttachment);
    expect(store.showTestbenchUI).toBe(true);
    expect(store.showTestBenchCreator).toBe(true);
    expect(store.showTestBenchValidator).toBe(false);
  });

  it("commits a valid replacement and updates the panel state", () => {
    window.globalScope = validScope();
    const store = useTestBenchStore();
    store.sendData(createTestData("Existing TestBench"));
    const replacementData = createTestData("Valid replacement");
    store.showTestBenchCreator = true;

    store.sendData(replacementData);

    expect(showMessage).not.toHaveBeenCalled();
    expect(store.showTestbenchUI).toBe(true);
    expect(store.showTestBenchCreator).toBe(false);
    expect(store.testbenchData.testData).toEqual(replacementData);
    expect(store.testbenchData.testData.title).toBe("Valid replacement");
    expect(store.showTestBenchValidator).toBe(false);
  });
});
