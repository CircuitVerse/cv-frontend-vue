import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { MockNodeCls, lastElkGraphRef, shouldElkThrowRef } = vi.hoisted(() => {
  const lastElkGraphRef: { current: any } = { current: null };
  const shouldElkThrowRef: { current: boolean } = { current: false };

  class MockNodeCls {
    x: number;
    y: number;
    type: number;
    parent: any;
    connections: MockNodeCls[];
    scope: any;
    objectType = "Node";

    constructor(x: number, y: number, type: number, parent: any) {
      this.x = x;
      this.y = y;
      this.type = type;
      this.parent = parent;
      this.connections = [];
      this.scope = parent?.scope ?? null;
      if (type === 2 && parent?.scope) {
        parent.scope.nodes = parent.scope.nodes ?? [];
        parent.scope.allNodes = parent.scope.allNodes ?? [];
        parent.scope.nodes.push(this);
        parent.scope.allNodes.push(this);
      }
    }

    absX(): number {
      return this.x + (this.parent?.x ?? 0);
    }

    absY(): number {
      return this.y + (this.parent?.y ?? 0);
    }

    connect(other: MockNodeCls): void {
      if (other === this) return;
      if (this.connections.includes(other)) return;
      this.connections.push(other);
      other.connections.push(this);
      const scope = this.scope ?? other.scope;
      if (scope) {
        scope.wires = scope.wires ?? [];
        scope.wires.push({ node1: this, node2: other, scope });
      }
    }
  }

  return { MockNodeCls, lastElkGraphRef, shouldElkThrowRef };
});

vi.mock("elkjs/lib/elk.bundled.js", () => ({
  default: class MockELK {
    async layout(graph: any) {
      if (shouldElkThrowRef.current) {
        throw new Error("Simulated ELK layout failure");
      }
      lastElkGraphRef.current = graph;

      const children = (graph.children ?? []).map((node: any, i: number) => ({
        ...node,
        x: i * 100,
        y: (i % 2) * 80,
      }));

      const edges = (graph.edges ?? []).map((edge: any) => {
        const srcIdx = children.findIndex((n: any) => n.id === edge.sourceNode);
        const tgtIdx = children.findIndex((n: any) => n.id === edge.targetNode);
        const srcNode = children[srcIdx];
        const tgtNode = children[tgtIdx];
        const srcX = srcIdx >= 0 ? srcNode.x + (srcNode.width ?? 40) : 0;
        const srcY = srcIdx >= 0 ? srcNode.y + 20 : 20;
        const tgtX = tgtIdx >= 0 ? tgtNode.x : 100;
        const tgtY = tgtIdx >= 0 ? tgtNode.y + 20 : 20;
        const trunkX = srcX + 40;

        return {
          ...edge,
          sections: [
            {
              startPoint: { x: srcX, y: srcY },
              // Shared vertical trunk at trunkX so fan-out branches share segments
              bendPoints: [
                { x: trunkX, y: srcY },
                { x: trunkX, y: tgtY },
              ],
              endPoint: { x: tgtX, y: tgtY },
            },
          ],
        };
      });

      return { ...graph, children, edges };
    }
  },
}));

vi.mock("../src/data/backupCircuit", () => ({
  scheduleBackup: vi.fn(),
}));

vi.mock("../src/engine", () => ({
  scheduleUpdate: vi.fn(),
  forceResetNodesSet: vi.fn(),
  updateSimulationSet: vi.fn(),
  updateCanvasSet: vi.fn(),
}));

vi.mock("../src/simulationArea", () => ({
  simulationArea: { multipleObjectSelections: [] as any[] },
}));

vi.mock("../src/metadata", () => ({
  moduleList: ["Input", "AndGate", "XorGate", "Output", "TriState"],
}));

vi.mock("../src/node", () => ({ default: MockNodeCls }));

vi.mock("../src/wire", () => ({
  default: class MockWire {
    constructor(
      public node1: any,
      public node2: any,
      public scope: any,
    ) { }
  },
}));

import { snapGrid, simplifyOrthogonalPath, beautifyCircuit } from "../src/utils/autoLayout";

function makeScope() {
  const root: any = {
    x: 0,
    y: 0,
    nodeList: [],
    objectType: "Root",
    bitWidth: 1,
    scope: null as any,
  };
  const scope: any = {
    root,
    nodes: [] as any[],
    allNodes: [] as any[],
    wires: [] as any[],
    Input: [] as any[],
    AndGate: [] as any[],
    XorGate: [] as any[],
    Output: [] as any[],
    TriState: [] as any[],
  };
  root.scope = scope;
  return scope;
}

function makeElement(
  type: string,
  x: number,
  y: number,
  scope: any,
  lx = 20,
  rx = 20,
  uy = 20,
  dy = 20,
) {
  const el: any = {
    objectType: type,
    x,
    y,
    leftDimensionX: lx,
    rightDimensionX: rx,
    upDimensionY: uy,
    downDimensionY: dy,
    isPositionLocked: false,
    scope,
    nodeList: [] as MockNodeCls[],
  };

  const outPin = new MockNodeCls(rx, 0, 1, el);
  el.nodeList.push(outPin);
  el.outputPin = outPin;

  // Primary input pin (top/center) and secondary input pin (bottom) for multi-input gates
  const inPin1 = new MockNodeCls(-lx, -10, 0, el);
  const inPin2 = new MockNodeCls(-lx, 10, 0, el);
  el.nodeList.push(inPin1, inPin2);
  el.inputPin = inPin1;
  el.inputPin2 = inPin2;

  return el;
}

describe("snapGrid", () => {
  it("leaves exact multiples of 10 unchanged", () => {
    for (const v of [0, 10, -30, 100, 1000]) {
      expect(snapGrid(v)).toBe(v);
    }
  });

  it("rounds halves correctly", () => {
    expect(snapGrid(5)).toBe(10);
    expect(Math.abs(snapGrid(-5))).toBe(0);
  });

  it("rounds arbitrary values to the nearest 10", () => {
    expect(snapGrid(3)).toBe(0);
    expect(snapGrid(7)).toBe(10);
    expect(snapGrid(14)).toBe(10);
    expect(snapGrid(16)).toBe(20);
    expect(snapGrid(-4) + 0).toBe(0);
    expect(snapGrid(-6)).toBe(-10);
  });

  it("handles non-integer inputs", () => {
    expect(snapGrid(9.9)).toBe(10);
    expect(snapGrid(10.1)).toBe(10);
    expect(snapGrid(0.4)).toBe(0);
  });
});

describe("simplifyOrthogonalPath", () => {
  it("returns empty array for empty input", () => {
    expect(simplifyOrthogonalPath([])).toEqual([]);
  });

  it("snaps a single point to the grid", () => {
    expect(simplifyOrthogonalPath([{ x: 13, y: 7 }])).toEqual([{ x: 10, y: 10 }]);
  });

  it("snaps every coordinate to a multiple of 10", () => {
    const result = simplifyOrthogonalPath([
      { x: 3, y: 7 },
      { x: 53, y: 7 },
      { x: 53, y: 37 },
    ]);
    for (const p of result) {
      expect(p.x % 10).toBe(0);
      expect(p.y % 10).toBe(0);
    }
  });

  it("removes consecutive duplicate points after grid snapping", () => {
    const result = simplifyOrthogonalPath([
      { x: 8, y: 9 },
      { x: 12, y: 11 },
      { x: 50, y: 50 },
    ]);
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result[0]).toEqual({ x: 10, y: 10 });
  });

  it("removes collinear middle points on a horizontal line", () => {
    const result = simplifyOrthogonalPath([
      { x: 0, y: 20 },
      { x: 50, y: 20 },
      { x: 100, y: 20 },
    ]);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ x: 0, y: 20 });
    expect(result[1]).toEqual({ x: 100, y: 20 });
  });

  it("removes collinear middle points on a vertical line", () => {
    const result = simplifyOrthogonalPath([
      { x: 30, y: 0 },
      { x: 30, y: 50 },
      { x: 30, y: 100 },
    ]);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ x: 30, y: 0 });
    expect(result[1]).toEqual({ x: 30, y: 100 });
  });

  it("preserves an L-bend corner", () => {
    const result = simplifyOrthogonalPath([
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 50 },
    ]);
    expect(result).toHaveLength(3);
  });

  it("inserts an L-bend corner for a diagonal step and cleans collinear segments", () => {
    const result = simplifyOrthogonalPath([
      { x: 0, y: 0 },
      { x: 50, y: 50 },
    ]);
    expect(result).toHaveLength(3);
    for (let i = 1; i < result.length; i++) {
      const ok = result[i].x === result[i - 1].x || result[i].y === result[i - 1].y;
      expect(ok).toBe(true);
    }
  });

  it("keeps all segments strictly axis-aligned", () => {
    const result = simplifyOrthogonalPath([
      { x: 3, y: 7 },
      { x: 13, y: 7 },
      { x: 23, y: 17 },
      { x: 23, y: 47 },
      { x: 13, y: 77 },
    ]);
    for (const p of result) {
      expect(p.x % 10).toBe(0);
      expect(p.y % 10).toBe(0);
    }
    for (let i = 1; i < result.length; i++) {
      const ok = result[i].x === result[i - 1].x || result[i].y === result[i - 1].y;
      expect(ok).toBe(true);
    }
  });
});

describe("beautifyCircuit", () => {
  let scope: any;
  let input1: any;
  let input2: any;
  let andGate: any;
  let xorGate: any;
  let output1: any;
  let output2: any;

  beforeEach(async () => {
    shouldElkThrowRef.current = false;
    lastElkGraphRef.current = null;

    const { simulationArea } = await import("../src/simulationArea");
    simulationArea.multipleObjectSelections = [];

    scope = makeScope();

    input1 = makeElement("Input", 0, 0, scope);
    input2 = makeElement("Input", 0, 60, scope);
    andGate = makeElement("AndGate", 80, 0, scope);
    xorGate = makeElement("XorGate", 80, 60, scope);
    output1 = makeElement("Output", 200, 0, scope);
    output2 = makeElement("Output", 200, 60, scope);

    scope.Input.push(input1, input2);
    scope.AndGate.push(andGate);
    scope.XorGate.push(xorGate);
    scope.Output.push(output1, output2);

    // Half-adder netlist: input1 and input2 fan out to both AndGate and XorGate
    input1.outputPin.connect(andGate.inputPin);
    input1.outputPin.connect(xorGate.inputPin);
    input2.outputPin.connect(andGate.inputPin2);
    input2.outputPin.connect(xorGate.inputPin2);
    andGate.outputPin.connect(output1.inputPin);
    xorGate.outputPin.connect(output2.inputPin);

    (global as any).globalScope = scope;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns true on successful layout", async () => {
    await expect(beautifyCircuit(scope)).resolves.toBe(true);
  });

  it("returns false and skips backup when scope has no elements", async () => {
    const emptyScope = makeScope();
    const { scheduleBackup } = await import("../src/data/backupCircuit");
    vi.mocked(scheduleBackup).mockClear();

    await expect(beautifyCircuit(emptyScope)).resolves.toBe(false);
    expect(scheduleBackup).not.toHaveBeenCalled();
  });

  it("returns false gracefully if ELK throws an error without tearing down wires", async () => {
    shouldElkThrowRef.current = true;
    const wireCountBefore = scope.wires.length;

    await expect(beautifyCircuit(scope)).resolves.toBe(false);
    expect(scope.wires.length).toBe(wireCountBefore);
  });

  it("configures zero-size ports (width: 0, height: 0) and layer constraints in ELK", async () => {
    await beautifyCircuit(scope);
    expect(lastElkGraphRef.current).toBeDefined();

    for (const elkNode of lastElkGraphRef.current.children) {
      for (const port of elkNode.ports) {
        expect(port.width).toBe(0);
        expect(port.height).toBe(0);
      }
    }

    const firstNode = lastElkGraphRef.current.children[0];
    expect(firstNode.properties["elk.layered.layering.layerConstraint"]).toBe("FIRST");
  });

  it("assigns 10-px-grid-aligned coordinates to every element", async () => {
    await beautifyCircuit(scope);

    const all = [...scope.Input, ...scope.AndGate, ...scope.XorGate, ...scope.Output];
    for (const el of all) {
      expect(el.x % 10).toBe(0);
      expect(el.y % 10).toBe(0);
    }
  });

  it("produces no overlapping gate bounding boxes", async () => {
    await beautifyCircuit(scope);

    const all = [...scope.Input, ...scope.AndGate, ...scope.XorGate, ...scope.Output];
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        const a = all[i];
        const b = all[j];
        const aL = a.x - a.leftDimensionX;
        const aR = a.x + a.rightDimensionX;
        const aT = a.y - a.upDimensionY;
        const aB = a.y + a.downDimensionY;
        const bL = b.x - b.leftDimensionX;
        const bR = b.x + b.rightDimensionX;
        const bT = b.y - b.upDimensionY;
        const bB = b.y + b.downDimensionY;
        const overlap = aL < bR && aR > bL && aT < bB && aB > bT;
        expect(overlap).toBe(false);
      }
    }
  });

  it("reuses intermediate nodes on 1-to-N fan-out nets without duplicate wires", async () => {
    await beautifyCircuit(scope);

    // Ensure no two wires connect the exact same pair of nodes
    const seenWirePairs = new Set<string>();
    for (const w of scope.wires) {
      const idxA = scope.allNodes.indexOf(w.node1);
      const idxB = scope.allNodes.indexOf(w.node2);
      if (idxA !== -1 && idxB !== -1) {
        const key = `${Math.min(idxA, idxB)}-${Math.max(idxA, idxB)}`;
        expect(seenWirePairs.has(key)).toBe(false);
        seenWirePairs.add(key);
      }
    }

    // Verify input1 still reaches both andGate.inputPin and xorGate.inputPin via BFS
    const reachableFromInput1 = new Set<any>();
    const queue = [input1.outputPin];
    while (queue.length > 0) {
      const cur = queue.shift();
      if (reachableFromInput1.has(cur)) continue;
      reachableFromInput1.add(cur);
      for (const conn of cur.connections) {
        queue.push(conn);
      }
    }
    expect(reachableFromInput1.has(andGate.inputPin)).toBe(true);
    expect(reachableFromInput1.has(xorGate.inputPin)).toBe(true);
  });

  it("preserves external wires and stationary coordinates during partial selection (selectedOnly = true)", async () => {
    const { simulationArea } = await import("../src/simulationArea");
    // Select only the middle gates; leave Inputs and Outputs unselected
    simulationArea.multipleObjectSelections = [andGate, xorGate];

    const origInput1Pos = { x: input1.x, y: input1.y };
    const origOutput1Pos = { x: output1.x, y: output1.y };

    const ok = await beautifyCircuit(scope, true);
    expect(ok).toBe(true);

    // Unselected elements must not move
    expect({ x: input1.x, y: input1.y }).toEqual(origInput1Pos);
    expect({ x: output1.x, y: output1.y }).toEqual(origOutput1Pos);

    // External net from unselected input1 to selected andGate & xorGate must remain connected
    const reachable = new Set<any>();
    const queue = [input1.outputPin];
    while (queue.length > 0) {
      const cur = queue.shift();
      if (reachable.has(cur)) continue;
      reachable.add(cur);
      for (const c of cur.connections) queue.push(c);
    }
    expect(reachable.has(andGate.inputPin)).toBe(true);
    expect(reachable.has(xorGate.inputPin)).toBe(true);
  });

  it("keeps locked elements (isPositionLocked = true) stationary while routing wires to them", async () => {
    output1.isPositionLocked = true;
    const lockedPos = { x: output1.x, y: output1.y };

    await beautifyCircuit(scope);

    expect({ x: output1.x, y: output1.y }).toEqual(lockedPos);

    // Verify andGate.outputPin is still connected to locked output1.inputPin
    const reachable = new Set<any>();
    const queue = [andGate.outputPin];
    while (queue.length > 0) {
      const cur = queue.shift();
      if (reachable.has(cur)) continue;
      reachable.add(cur);
      for (const c of cur.connections) queue.push(c);
    }
    expect(reachable.has(output1.inputPin)).toBe(true);
  });

  it("handles multi-driver nets (e.g., two TriState buffers on a shared bus) without duplicating nets", async () => {
    const tri1 = makeElement("TriState", 40, 120, scope);
    const tri2 = makeElement("TriState", 40, 180, scope);
    const busOut = makeElement("Output", 200, 150, scope);
    scope.TriState.push(tri1, tri2);
    scope.Output.push(busOut);

    // Connect two output pins (type === 1) to the same target bus input
    tri1.outputPin.connect(busOut.inputPin);
    tri2.outputPin.connect(busOut.inputPin);

    await expect(beautifyCircuit(scope)).resolves.toBe(true);

    const reachable = new Set<any>();
    const queue = [tri1.outputPin];
    while (queue.length > 0) {
      const cur = queue.shift();
      if (reachable.has(cur)) continue;
      reachable.add(cur);
      for (const c of cur.connections) queue.push(c);
    }
    expect(reachable.has(tri2.outputPin)).toBe(true);
    expect(reachable.has(busOut.inputPin)).toBe(true);
  });

  it("calls scheduleBackup(scope) exactly once before making changes", async () => {
    const { scheduleBackup } = await import("../src/data/backupCircuit");
    vi.mocked(scheduleBackup).mockClear();
    await beautifyCircuit(scope);
    expect(scheduleBackup).toHaveBeenCalledOnce();
    expect(scheduleBackup).toHaveBeenCalledWith(scope);
  });

  it("calls scheduleUpdate after layout is complete", async () => {
    const { scheduleUpdate } = await import("../src/engine");
    vi.mocked(scheduleUpdate).mockClear();
    await beautifyCircuit(scope);
    expect(scheduleUpdate).toHaveBeenCalled();
  });
});