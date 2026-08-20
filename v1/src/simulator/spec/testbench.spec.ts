import { describe, test, expect, vi } from "vitest";
import type { TestData } from "#/store/testBenchStore";

// TestbenchData itself does not use any of these; they are only pulled in
// transitively (via engine.js -> setup.js) by the rest of testbench.ts, which
// side-effect-imports CodeMirror CSS that the vitest node runtime can't parse.
vi.mock("#/simulator/src/engine", () => ({ play: vi.fn() }));
vi.mock("#/simulator/src/sequential", () => ({ changeClockEnable: vi.fn() }));
vi.mock("#/utils/confirm", () => ({ confirmOption: vi.fn() }));
vi.mock("#/simulator/src/utils", () => ({
  showMessage: vi.fn(),
  escapeHtml: (s: string) => s,
}));

const { TestbenchData } = await import("#/simulator/src/testbench");

function makeGroup(label: string, caseCount: number): TestData["groups"][number] {
  return {
    label,
    inputs: [
      {
        label: "in",
        bitWidth: 1,
        values: Array.from({ length: caseCount }, (_, i) => String(i % 2)),
      },
    ],
    outputs: [
      {
        label: "out",
        bitWidth: 1,
        values: Array.from({ length: caseCount }, (_, i) => String(i % 2)),
      },
    ],
    n: caseCount,
  };
}

function makeTestData(groups: TestData["groups"]): TestData {
  return {
    type: "combinational",
    title: "test",
    groups,
  };
}

describe("TestbenchData.groupNext", () => {
  test("advances to the next group without throwing", () => {
    const data = makeTestData([makeGroup("g0", 2), makeGroup("g1", 3)]);
    const tb = new TestbenchData(data, 0, 0);

    let result: boolean | undefined;
    expect(() => {
      result = tb.groupNext();
    }).not.toThrow();
    expect(result).toBe(true);
    expect(tb.currentGroup).toBe(1);
    expect(tb.currentCase).toBe(0);
  });

  test("skips empty groups when advancing", () => {
    const data = makeTestData([makeGroup("g0", 1), makeGroup("empty", 0), makeGroup("g2", 2)]);
    const tb = new TestbenchData(data, 0, 0);

    expect(tb.groupNext()).toBe(true);
    expect(tb.currentGroup).toBe(2);
  });

  test("returns false and does not throw when already on the last group", () => {
    const data = makeTestData([makeGroup("g0", 1), makeGroup("g1", 1)]);
    const tb = new TestbenchData(data, 1, 0);

    let result: boolean | undefined;
    expect(() => {
      result = tb.groupNext();
    }).not.toThrow();
    expect(result).toBe(false);
    expect(tb.currentGroup).toBe(1);
  });

  test("returns false when every remaining group is empty", () => {
    const data = makeTestData([makeGroup("g0", 1), makeGroup("empty1", 0), makeGroup("empty2", 0)]);
    const tb = new TestbenchData(data, 0, 0);

    let result: boolean | undefined;
    expect(() => {
      result = tb.groupNext();
    }).not.toThrow();
    expect(result).toBe(false);
    expect(tb.currentGroup).toBe(0);
  });
});

describe("TestbenchData.groupPrev", () => {
  test("moves back to the previous group", () => {
    const data = makeTestData([makeGroup("g0", 2), makeGroup("g1", 3)]);
    const tb = new TestbenchData(data, 1, 0);

    expect(tb.groupPrev()).toBe(true);
    expect(tb.currentGroup).toBe(0);
  });

  test("returns false when already on the first group", () => {
    const data = makeTestData([makeGroup("g0", 1), makeGroup("g1", 1)]);
    const tb = new TestbenchData(data, 0, 0);

    expect(tb.groupPrev()).toBe(false);
    expect(tb.currentGroup).toBe(0);
  });
});

describe("TestbenchData.caseNext / casePrev group rollover", () => {
  test("caseNext rolls over into the next group without throwing", () => {
    const data = makeTestData([makeGroup("g0", 1), makeGroup("g1", 2)]);
    const tb = new TestbenchData(data, 0, 0);

    let result: boolean | undefined;
    expect(() => {
      result = tb.caseNext();
    }).not.toThrow();
    expect(result).toBe(true);
    expect(tb.currentGroup).toBe(1);
    expect(tb.currentCase).toBe(0);
  });

  test("casePrev rolls back into the previous group's last case", () => {
    const data = makeTestData([makeGroup("g0", 2), makeGroup("g1", 1)]);
    const tb = new TestbenchData(data, 1, 0);

    expect(tb.casePrev()).toBe(true);
    expect(tb.currentGroup).toBe(0);
    expect(tb.currentCase).toBe(1);
  });
});
