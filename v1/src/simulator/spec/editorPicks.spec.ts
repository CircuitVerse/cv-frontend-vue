import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeAll, describe, expect, test, vi } from "vitest";

vi.mock("../src/Verilog2CV", () => ({
  createVerilogCircuit: vi.fn(),
  setupCodeMirrorEnvironment: vi.fn(),
  verilogModeGet: () => false,
  verilogModeSet: vi.fn(),
}));

vi.mock("../src/setup", () => ({
  resetup: vi.fn(),
}));

vi.mock("../src/ux", () => ({
  fillSubcircuitElements: vi.fn(),
  prevPropertyObjGet: vi.fn(),
  showProperties: vi.fn(),
}));

vi.mock("../src/engine");
vi.mock("../src/canvasApi");
vi.mock("../src/plotArea");

import { scopeList } from "../src/circuit";
import { colorToRGBA } from "../src/canvasApi";
import { canonicaliseProject } from "../src/data/canonical";
import { importCanonical } from "../src/data/importCanonical";
import load from "../src/data/load";
import setupModules from "../src/moduleSetup";
import { simulationArea } from "../src/simulationArea";
import type { CanonicalProject } from "../src/types/canonical.types";
import sixteenBitUCISCProcessor from "./fixtures/editorPicks/16-bit-ucisc-processor.json";
import eightBitCPU from "./fixtures/editorPicks/8-bit-cpu.json";
import conwaysGameOfLife from "./fixtures/editorPicks/conways-game-of-life.json";
import cpuMicroprocessor from "./fixtures/editorPicks/cpu-microprocessor.json";
import elevator from "./fixtures/editorPicks/elevator.json";
import femtoComputer from "./fixtures/editorPicks/femto-4v2-6-computer.json";
import ledMatrix from "./fixtures/editorPicks/led-matrix.json";
import lights from "./fixtures/editorPicks/lights.json";
import staticRAM from "./fixtures/editorPicks/static-ram.json";
import string32000 from "./fixtures/editorPicks/string-32000.json";
import ticTacToeSimulator from "./fixtures/editorPicks/tic-tac-toe-simulator.json";
import yabeiSAPSystem from "./fixtures/editorPicks/yabei-sap-system.json";

type EditorPickProject = {
  name: string;
  scopes: Array<{ id: string | number }>;
};

const timeout = 120_000;

function withSortedRouting(project: CanonicalProject): CanonicalProject {
  for (const circuit of Object.values(project.circuits)) {
    for (const routing of Object.values(circuit.layout.intermediateNodes ?? {})) {
      routing.connections.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    }
  }
  return project;
}

async function verifyCanonicalRoundTrip(fixture: EditorPickProject): Promise<void> {
  load(fixture);

  const canonical = await canonicaliseProject(Object.values(scopeList));

  expect(canonical.projectMetadata.name).toBe(fixture.name);

  const imported = await importCanonical(canonical);
  const reExported = await canonicaliseProject(Object.values(scopeList));

  expect(imported).toEqual({
    success: true,
    imported: fixture.scopes.length,
    errors: [],
  });
  expect(reExported.canonicalHash).toBe(canonical.canonicalHash);
  expect(withSortedRouting(reExported)).toEqual(withSortedRouting(canonical));
}

beforeAll(() => {
  setActivePinia(createPinia());
  setupModules();
  vi.mocked(colorToRGBA).mockReturnValue(new Uint8ClampedArray([0, 0, 0, 255]));
  simulationArea.context = {
    measureText: (text: string) => ({ width: text.length * 10 }),
  } as CanvasRenderingContext2D;
});

afterEach(() => vi.clearAllMocks());

describe("canonical Editor's Picks verification", () => {
  test(
    "loads and round-trips 16-bit uCISC Processor",
    () => verifyCanonicalRoundTrip(sixteenBitUCISCProcessor),
    timeout,
  );

  test("loads and round-trips 8 Bit CPU", () => verifyCanonicalRoundTrip(eightBitCPU), timeout);

  test(
    "loads and round-trips CPU Microprocessor",
    () => verifyCanonicalRoundTrip(cpuMicroprocessor),
    timeout,
  );

  test(
    "loads and round-trips Conway's Game of Life",
    () => verifyCanonicalRoundTrip(conwaysGameOfLife),
    timeout,
  );

  test("loads and round-trips ELEVATOR", () => verifyCanonicalRoundTrip(elevator), timeout);

  test(
    "loads and round-trips Femto-4v2.6 (Computer)",
    () => verifyCanonicalRoundTrip(femtoComputer),
    timeout,
  );

  test("loads and round-trips led matrix", () => verifyCanonicalRoundTrip(ledMatrix), timeout);

  test("loads and round-trips LIGHTS", () => verifyCanonicalRoundTrip(lights), timeout);

  test("loads and round-trips Static RAM", () => verifyCanonicalRoundTrip(staticRAM), timeout);

  test("loads and round-trips STRING 32000", () => verifyCanonicalRoundTrip(string32000), timeout);

  test(
    "loads and round-trips Tic tac toe Simulator",
    () => verifyCanonicalRoundTrip(ticTacToeSimulator),
    timeout,
  );

  test(
    "loads and round-trips YABEI SAP System",
    () => verifyCanonicalRoundTrip(yabeiSAPSystem),
    timeout,
  );
});
