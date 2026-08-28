import { describe, expect, it, vi } from "vitest";
import type { TestData } from "#/store/testBenchStore";

// testbench.ts pulls in the verilog editor through engine.ts/sequential.ts,
// which imports codemirror's CSS. Vitest can't transform a raw .css import,
// so it is mocked the same way bitConvertor.spec.js does for the same chain.
vi.mock("codemirror", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, fromTextArea: vi.fn(() => ({ setValue: () => {} })) };
});
vi.mock("codemirror-editor-vue3", () => ({ defineSimpleMode: vi.fn() }));

const { TestbenchData } = await import("../src/testbench");

function makeGroup(values: string[]): TestData["groups"][number] {
  return {
    label: "g",
    inputs: [{ label: "a", bitWidth: 1, values }],
    outputs: [],
    n: values.length,
  };
}

function makeEmptyInputsGroup(): TestData["groups"][number] {
  // The shape removeTestButton constructs: a group with no inputs at all.
  return { label: "g", inputs: [], outputs: [], n: 0 };
}

function makeTestData(groups: TestData["groups"]): TestData {
  return { type: "combinational", title: "t", groups };
}

describe("TestbenchData", () => {
  describe("groupNext", () => {
    it("advances past an intermediate group with no cases", () => {
      const testData = makeTestData([makeGroup(["1"]), makeGroup([]), makeGroup(["1", "0"])]);
      const tb = new TestbenchData(testData, 0, 0);

      expect(tb.groupNext()).toBe(true);
      expect(tb.currentGroup).toBe(2);
    });

    it("returns false when there is no next group with cases", () => {
      const testData = makeTestData([makeGroup(["1"])]);
      const tb = new TestbenchData(testData, 0, 0);

      expect(tb.groupNext()).toBe(false);
    });

    it("does not throw on a group with no inputs, and skips past it", () => {
      const testData = makeTestData([
        makeGroup(["1"]),
        makeEmptyInputsGroup(),
        makeGroup(["1", "0"]),
      ]);
      const tb = new TestbenchData(testData, 0, 0);

      expect(() => tb.groupNext()).not.toThrow();
      expect(tb.currentGroup).toBe(2);
    });

    it("returns false rather than throwing when every later group has no inputs", () => {
      const testData = makeTestData([makeGroup(["1"]), makeEmptyInputsGroup()]);
      const tb = new TestbenchData(testData, 0, 0);

      expect(() => tb.groupNext()).not.toThrow();
      expect(tb.groupNext()).toBe(false);
    });
  });

  describe("groupPrev", () => {
    it("moves back past an intermediate group with no cases", () => {
      const testData = makeTestData([makeGroup(["1"]), makeGroup([]), makeGroup(["1", "0"])]);
      const tb = new TestbenchData(testData, 2, 0);

      expect(tb.groupPrev()).toBe(true);
      expect(tb.currentGroup).toBe(0);
    });

    it("does not throw when the starting group has no inputs", () => {
      const testData = makeTestData([makeGroup(["1"]), makeEmptyInputsGroup()]);
      const tb = new TestbenchData(testData, 1, 0);

      let moved: boolean | undefined;
      expect(() => {
        moved = tb.groupPrev();
      }).not.toThrow();
      expect(moved).toBe(true);
      expect(tb.currentGroup).toBe(0);
    });

    it("does not throw on an intermediate group with no inputs", () => {
      const testData = makeTestData([
        makeGroup(["1"]),
        makeEmptyInputsGroup(),
        makeGroup(["1", "0"]),
      ]);
      const tb = new TestbenchData(testData, 2, 0);

      expect(() => tb.groupPrev()).not.toThrow();
      expect(tb.currentGroup).toBe(0);
    });

    it("returns false rather than throwing when every earlier group has no inputs", () => {
      const testData = makeTestData([makeEmptyInputsGroup(), makeGroup(["1"])]);
      const tb = new TestbenchData(testData, 1, 0);

      expect(() => tb.groupPrev()).not.toThrow();
      expect(tb.groupPrev()).toBe(false);
    });
  });
});
