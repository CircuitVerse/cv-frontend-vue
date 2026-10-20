/* eslint-disable import/no-cycle */
/**
 * Auto-layout engine using ELK to reposition circuit elements and route orthogonal wires.
 */

import ELK from "elkjs/lib/elk.bundled.js";
import { scheduleBackup } from "../data/backupCircuit";
import {
  scheduleUpdate,
  forceResetNodesSet,
  updateSimulationSet,
  updateCanvasSet,
} from "../engine";

let layoutInProgress = false;

async function runBeautify(
  scope: CircuitScope = globalScope,
  selectedOnly = false,
): Promise<boolean> {
  const { simulationArea } = await import("../simulationArea");
  const { moduleList } = await import("../metadata");

  const allElements: CircuitElement[] = [];
  for (const key of moduleList as string[]) {
    const list = scope[key];
    if (Array.isArray(list)) {
      allElements.push(...(list as CircuitElement[]));
    }
  }

  let workingSet: Set<CircuitElement>;
  if (selectedOnly && simulationArea.multipleObjectSelections?.length > 0) {
    workingSet = new Set(
      (simulationArea.multipleObjectSelections as CircuitElement[]).filter(
        (o) =>
          o.objectType !== "Node" &&
          o.objectType !== "Wire" &&
          Array.isArray(o.nodeList) &&
          !o.isPositionLocked,
      ),
    );
  } else {
    workingSet = new Set(
      allElements.filter((el) => Array.isArray(el.nodeList) && !el.isPositionLocked),
    );
  }

  if (workingSet.size === 0) {
    console.warn("[autoLayout] No elements to layout.");
    return false;
  }

  // Anchor layout to the current top-left bounding box of the working set
  let minX = Infinity;
  let minY = Infinity;
  for (const el of workingSet) {
    minX = Math.min(minX, el.x - (el.leftDimensionX || 20));
    minY = Math.min(minY, el.y - (el.upDimensionY || 20));
  }
  minX = snapGrid(minX);
  minY = snapGrid(minY);

  scheduleBackup(scope);

  const nets = extractNets(workingSet);

  const elementIdMap = new Map<CircuitElement, string>();
  let elIdx = 0;
  for (const el of workingSet) {
    elementIdMap.set(el, `el_${elIdx++}`);
  }

  const pinToPortId = new Map<CircuitPin, string>();
  const elkNodes: ElkNode[] = [];

  for (const el of workingSet) {
    const id = elementIdMap.get(el)!;
    const lx = el.leftDimensionX || 20;
    const rx = el.rightDimensionX || 20;
    const uy = el.upDimensionY || 20;
    const dy = el.downDimensionY || 20;

    const w = snapGrid(Math.max(lx + rx, 40));
    const h = snapGrid(Math.max(uy + dy, 40));

    const ports: ElkPort[] = [];
    let portIdx = 0;
    for (const pin of el.nodeList || []) {
      const portId = `${id}_p${portIdx++}`;
      pinToPortId.set(pin, portId);
      ports.push({
        id: portId,
        x: pin.x + lx,
        y: pin.y + uy,
        // Zero-size ports prevent ELK from adding a +3px center offset to wires
        width: 0,
        height: 0,
        properties: { "elk.port.side": portSide(pin, el) },
      });
    }

    const nodeProps: Record<string, string> = {
      "elk.portConstraints": "FIXED_POS",
    };
    const lc = layerConstraint(el);
    if (lc) {
      nodeProps["elk.layered.layering.layerConstraint"] = lc;
    }

    elkNodes.push({
      id,
      width: w,
      height: h,
      ports,
      properties: nodeProps,
    });
  }

  const elkEdges: ElkEdge[] = [];
  const edgeByPinPair = new Map<string, ElkEdge>();
  const pairKey = (src: CircuitPin, tgt: CircuitPin): string => {
    const sId = pinToPortId.get(src) || "";
    const tId = pinToPortId.get(tgt) || "";
    return `${sId}->${tId}`;
  };

  let edgeIdx = 0;
  for (const net of nets) {
    const srcPortId = pinToPortId.get(net.source);
    if (!srcPortId) continue;

    for (const tgt of net.targets) {
      const tgtPortId = pinToPortId.get(tgt);
      if (!tgtPortId) continue;

      const srcElId = srcPortId.substring(0, srcPortId.lastIndexOf("_"));
      const tgtElId = tgtPortId.substring(0, tgtPortId.lastIndexOf("_"));

      const edge: ElkEdge = {
        id: `e_${edgeIdx++}`,
        sources: [srcPortId],
        targets: [tgtPortId],
        sourceNode: srcElId,
        targetNode: tgtElId,
      };
      elkEdges.push(edge);
      edgeByPinPair.set(pairKey(net.source, tgt), edge);
    }
  }

  const elkGraph = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.edgeRouting": "ORTHOGONAL",
      // All spacing options are multiples of 10px to stay aligned with the CircuitVerse grid
      "elk.layered.spacing.nodeNodeBetweenLayers": "60",
      "elk.spacing.nodeNode": "40",
      "elk.spacing.edgeNode": "20",
      "elk.spacing.edgeEdge": "20",
      "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
    },
    children: elkNodes,
    edges: elkEdges,
  };

  const elk = new ELK();
  let result: { children?: ElkNode[]; edges?: ElkEdge[] };
  try {
    result = (await elk.layout(elkGraph)) as { children?: ElkNode[]; edges?: ElkEdge[] };
  } catch (err) {
    console.error("[autoLayout] ELK layout failed:", err);
    return false;
  }

  // Tear down old intermediate nodes and wires only after ELK succeeds
  for (const net of nets) {
    teardownNet(net, scope);
  }

  let elkMinX = Infinity;
  let elkMinY = Infinity;
  for (const n of result.children || []) {
    elkMinX = Math.min(elkMinX, n.x ?? 0);
    elkMinY = Math.min(elkMinY, n.y ?? 0);
  }
  if (!Number.isFinite(elkMinX)) elkMinX = 0;
  if (!Number.isFinite(elkMinY)) elkMinY = 0;

  const elkNodeById = new Map<string, ElkNode>();
  for (const n of result.children || []) {
    elkNodeById.set(n.id, n);
  }

  // Update positions of elements in workingSet
  for (const el of workingSet) {
    const en = elkNodeById.get(elementIdMap.get(el)!);
    if (!en) continue;
    el.x = snapGrid(minX + ((en.x ?? 0) - elkMinX) + (el.leftDimensionX || 20));
    el.y = snapGrid(minY + ((en.y ?? 0) - elkMinY) + (el.upDimensionY || 20));
  }

  // Index laid-out ELK edges by id
  const resultEdgeById = new Map<string, ElkEdge>();
  for (const e of result.edges || []) {
    resultEdgeById.set(e.id, e);
  }

  // Rebuild each net with shared trunk junctions and preserved boundary connections
  for (const net of nets) {
    const netNodeMap = new Map<string, CircuitPin>();
    const rawBranchPaths: Point[][] = [];

    const srcAbs: Point = {
      x: snapGrid(net.source.absX()),
      y: snapGrid(net.source.absY()),
    };

    for (const tgt of net.targets) {
      const tgtAbs: Point = {
        x: snapGrid(tgt.absX()),
        y: snapGrid(tgt.absY()),
      };

      const reqEdge = edgeByPinPair.get(pairKey(net.source, tgt));
      const laidOutEdge = reqEdge ? resultEdgeById.get(reqEdge.id) : undefined;
      const sections = laidOutEdge?.sections || [];

      const rawBends =
        sections.length > 0 ? extractBendPoints(sections, minX, minY, elkMinX, elkMinY) : [];

      const cleanedPath = simplifyOrthogonalPath([srcAbs, ...rawBends, tgtAbs]);
      rawBranchPaths.push(cleanedPath);
    }

    // Split shared trunk segments at branch points so 1-to-N fan-out nets share nodes
    const subdividedPaths = subdivideSharedTrunks(rawBranchPaths);

    for (let i = 0; i < net.targets.length; i++) {
      const tgt = net.targets[i];
      const fullPath = subdividedPaths[i];
      const bendOnly = fullPath.slice(1, fullPath.length - 1);
      buildWireChain(net.source, tgt, bendOnly, scope, netNodeMap);
    }
  }

  forceResetNodesSet(true);
  updateSimulationSet(true);
  updateCanvasSet(true);
  scheduleUpdate(1);

  return true;
}

import Node from "../node";

// Global scope is dynamically populated at runtime in the simulator
declare const globalScope: CircuitScope;

export interface Point {
  x: number;
  y: number;
}

export interface CircuitPin {
  x: number;
  y: number;
  type: number; // 0 = input pin, 1 = output pin, 2 = intermediate wire junction
  parent: CircuitElement;
  connections: CircuitPin[];
  absX: () => number;
  absY: () => number;
  connect: (target: CircuitPin) => void;
}

export interface CircuitElement {
  x: number;
  y: number;
  objectType?: string;
  direction?: string;
  leftDimensionX?: number;
  rightDimensionX?: number;
  upDimensionY?: number;
  downDimensionY?: number;
  isPositionLocked?: boolean;
  nodeList?: CircuitPin[];
}

export interface CircuitWire {
  node1: CircuitPin;
  node2: CircuitPin;
}

export interface CircuitScope {
  root?: unknown;
  wires?: CircuitWire[];
  nodes?: CircuitPin[];
  allNodes?: CircuitPin[];
  [moduleKey: string]: unknown;
}

interface Net {
  source: CircuitPin;
  targets: CircuitPin[];
  intermediates: CircuitPin[];
}

interface ElkPort {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  properties: Record<string, string>;
}

interface ElkNode {
  id: string;
  x?: number;
  y?: number;
  width: number;
  height: number;
  ports: ElkPort[];
  properties: Record<string, string>;
}

interface ElkEdgeSection {
  startPoint?: Point;
  endPoint?: Point;
  bendPoints?: Point[];
}

interface ElkEdge {
  id: string;
  sources: string[];
  targets: string[];
  sourceNode: string;
  targetNode: string;
  sections?: ElkEdgeSection[];
}

/**
 * Snap coordinate to 10px canvas grid.
 * @param v - coordinate value
 */
export function snapGrid(v: number): number {
  return Math.round(v / 10) * 10;
}

/**
 * Remove redundant points and ensure all segments are strictly orthogonal on the 10px grid.
 * @param points - list of coordinates along the route
 */
export function simplifyOrthogonalPath(points: Point[]): Point[] {
  if (points.length === 0) return [];

  let pts: Point[] = points.map((p) => ({ x: snapGrid(p.x), y: snapGrid(p.y) }));
  pts = pts.filter((p, i) => i === 0 || p.x !== pts[i - 1].x || p.y !== pts[i - 1].y);

  if (pts.length <= 1) return pts;

  // Insert corner waypoints for any diagonal segments first so collinear cleanup can merge jogs
  const ortho: Point[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const prev = ortho[ortho.length - 1];
    const curr = pts[i];
    if (prev.x !== curr.x && prev.y !== curr.y) {
      // Bend horizontally first if moving toward the target column
      ortho.push({ x: curr.x, y: prev.y });
    }
    ortho.push(curr);
  }

  pts = ortho.filter((p, i) => i === 0 || p.x !== ortho[i - 1].x || p.y !== ortho[i - 1].y);

  // Drop collinear middle points that lie along a straight horizontal or vertical line
  let changed = true;
  while (changed && pts.length > 2) {
    changed = false;
    const out: Point[] = [pts[0]];
    for (let i = 1; i < pts.length - 1; i++) {
      const prev = out[out.length - 1];
      const curr = pts[i];
      const next = pts[i + 1];
      if ((prev.x === curr.x && curr.x === next.x) || (prev.y === curr.y && curr.y === next.y)) {
        changed = true;
      } else {
        out.push(curr);
      }
    }
    out.push(pts[pts.length - 1]);
    pts = out.filter((p, i) => i === 0 || p.x !== out[i - 1].x || p.y !== out[i - 1].y);
  }

  return pts;
}

/**
 * Subdivide branch paths of the same net where they share a trunk so T-junctions
 * reuse the exact same intermediate Node instead of creating stacked overlapping wires.
 */
function subdivideSharedTrunks(branchPaths: Point[][]): Point[][] {
  const waypointMap = new Map<string, Point>();
  for (const path of branchPaths) {
    for (const pt of path) {
      waypointMap.set(`${pt.x},${pt.y}`, pt);
    }
  }
  const allWaypoints = Array.from(waypointMap.values());

  return branchPaths.map((path) => {
    if (path.length < 2) return path;
    const subdivided: Point[] = [path[0]];

    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i];
      const b = path[i + 1];

      if (a.y === b.y && a.x !== b.x) {
        const minX = Math.min(a.x, b.x);
        const maxX = Math.max(a.x, b.x);
        const between = allWaypoints
          .filter((w) => w.y === a.y && w.x > minX && w.x < maxX)
          .sort((w1, w2) => (a.x < b.x ? w1.x - w2.x : w2.x - w1.x));
        subdivided.push(...between);
      } else if (a.x === b.x && a.y !== b.y) {
        const minY = Math.min(a.y, b.y);
        const maxY = Math.max(a.y, b.y);
        const between = allWaypoints
          .filter((w) => w.x === a.x && w.y > minY && w.y < maxY)
          .sort((w1, w2) => (a.y < b.y ? w1.y - w2.y : w2.y - w1.y));
        subdivided.push(...between);
      }

      subdivided.push(b);
    }

    return subdivided.filter(
      (p, idx) => idx === 0 || p.x !== subdivided[idx - 1].x || p.y !== subdivided[idx - 1].y,
    );
  });
}

/**
 * Extract full electrical nets touching any element in the workingSet.
 * Preserves external boundary pins (for partial selection / locked elements)
 * and handles multi-driver nets (e.g., TriState buses) without duplicating nets.
 */
function extractNets(workingSet: Set<CircuitElement>): Net[] {
  const nets: Net[] = [];
  const visitedPins = new Set<CircuitPin>();

  for (const el of workingSet) {
    if (!el.nodeList) continue;
    for (const startPin of el.nodeList) {
      if (visitedPins.has(startPin)) continue;
      if (!startPin.connections || startPin.connections.length === 0) continue;

      const discoveredPins: CircuitPin[] = [];
      const intermediates: CircuitPin[] = [];
      const queue: CircuitPin[] = [startPin];
      const seen = new Set<CircuitPin>([startPin]);

      while (queue.length > 0) {
        const cur = queue.shift()!;
        if (cur.type === 2) {
          intermediates.push(cur);
        } else {
          discoveredPins.push(cur);
          visitedPins.add(cur);
        }

        for (const conn of cur.connections || []) {
          if (seen.has(conn)) continue;
          seen.add(conn);
          queue.push(conn);
        }
      }

      if (discoveredPins.length < 2) continue;

      // Prefer an output pin inside workingSet as the primary source, else any output pin, else first pin
      const primarySource =
        discoveredPins.find((p) => p.type === 1 && workingSet.has(p.parent)) ||
        discoveredPins.find((p) => p.type === 1) ||
        discoveredPins[0];

      const targets = discoveredPins.filter((p) => p !== primarySource);
      nets.push({ source: primarySource, targets, intermediates });
    }
  }

  return nets;
}

/**
 * Remove existing wires and intermediate nodes on a net before re-routing.
 */
function teardownNet(net: Net, scope: CircuitScope): void {
  const allNetNodes = new Set<CircuitPin>([net.source, ...net.targets, ...net.intermediates]);

  scope.wires = (scope.wires || []).filter(
    (w) => !allNetNodes.has(w.node1) && !allNetNodes.has(w.node2),
  );

  net.source.connections = (net.source.connections || []).filter(
    (c) => !allNetNodes.has(c) || c === net.source,
  );

  for (const t of net.targets) {
    t.connections = (t.connections || []).filter((c) => !allNetNodes.has(c) || c === t);
  }

  for (const inode of net.intermediates) {
    inode.connections = [];
    scope.nodes = (scope.nodes || []).filter((n) => n !== inode);
    scope.allNodes = (scope.allNodes || []).filter((n) => n !== inode);
  }
}

/**
 * Find which bounding box side the pin belongs to.
 */
function portSide(pin: CircuitPin, el: CircuitElement): "WEST" | "EAST" | "NORTH" | "SOUTH" {
  const px = pin.x;
  const py = pin.y;
  const lx = el.leftDimensionX || 20;
  const rx = el.rightDimensionX || 20;
  const uy = el.upDimensionY || 20;
  const dy = el.downDimensionY || 20;

  if (px <= -lx + 2) return "WEST";
  if (px >= rx - 2) return "EAST";
  if (py <= -uy + 2) return "NORTH";
  if (py >= dy - 2) return "SOUTH";

  const dists: Array<{ side: "WEST" | "EAST" | "NORTH" | "SOUTH"; d: number }> = [
    { side: "WEST", d: Math.abs(px + lx) },
    { side: "EAST", d: Math.abs(rx - px) },
    { side: "NORTH", d: Math.abs(py + uy) },
    { side: "SOUTH", d: Math.abs(dy - py) },
  ];
  return dists.sort((a, b) => a.d - b.d)[0].side;
}

const FIRST_LAYER = new Set([
  "Input",
  "Clock",
  "Power",
  "Ground",
  "ConstantVal",
  "Button",
  "Random",
  "Counter",
  "Stepper",
]);

const LAST_LAYER = new Set([
  "Output",
  "DigitalLed",
  "RGBLed",
  "VariableLed",
  "HexDisplay",
  "SevenSegDisplay",
  "SixteenSegDisplay",
  "SquareRGBLed",
  "RGBLedMatrix",
  "TTY",
  "Flag",
]);

function layerConstraint(el: CircuitElement): string | undefined {
  const t = el.objectType;
  if (!t) return undefined;
  if (FIRST_LAYER.has(t)) return "FIRST";
  if (LAST_LAYER.has(t)) return "LAST";
  return undefined;
}

/**
 * Connect pins through intermediate waypoints while reusing shared junction nodes
 * across fan-out branches of the same net.
 */
function buildWireChain(
  srcPin: CircuitPin,
  tgtPin: CircuitPin,
  bendPoints: Point[],
  scope: CircuitScope,
  netNodeMap: Map<string, CircuitPin>,
): void {
  if (srcPin.connections.includes(tgtPin)) {
    srcPin.connections = srcPin.connections.filter((c) => c !== tgtPin);
    tgtPin.connections = tgtPin.connections.filter((c) => c !== srcPin);
  }

  let prev = srcPin;

  for (const pt of bendPoints) {
    // Avoid spawning an intermediate node directly on top of the source or target pin
    if (
      (pt.x === snapGrid(srcPin.absX()) && pt.y === snapGrid(srcPin.absY())) ||
      (pt.x === snapGrid(tgtPin.absX()) && pt.y === snapGrid(tgtPin.absY()))
    ) {
      continue;
    }

    const key = `${pt.x},${pt.y}`;
    let intNode = netNodeMap.get(key);
    if (!intNode) {
      intNode = new (Node as unknown as new (
        x: number,
        y: number,
        type: number,
        root: unknown,
      ) => CircuitPin)(pt.x, pt.y, 2, scope.root);
      netNodeMap.set(key, intNode);
    }

    if (prev !== intNode && !prev.connections.includes(intNode)) {
      prev.connect(intNode);
    }
    prev = intNode;
  }

  if (prev !== tgtPin && !prev.connections.includes(tgtPin)) {
    prev.connect(tgtPin);
  }
}

/**
 * Convert ELK bend points to canvas coordinate space.
 */
function extractBendPoints(
  sections: ElkEdgeSection[],
  offsetX: number,
  offsetY: number,
  elkMinX: number,
  elkMinY: number,
): Point[] {
  const raw: Point[] = [];

  for (const sec of sections) {
    for (const bp of sec.bendPoints || []) {
      raw.push({
        x: offsetX + bp.x - elkMinX,
        y: offsetY + bp.y - elkMinY,
      });
    }
  }

  return raw;
}

/**
 * Auto-layout elements and re-route orthogonal wires on the canvas.
 * @param scope - circuit scope (defaults to globalScope)
 * @param selectedOnly - layout only currently selected elements
 * @returns true if layout succeeded, false otherwise
 */
export async function beautifyCircuit(
  scope: CircuitScope = globalScope,
  selectedOnly = false,
): Promise<boolean> {
  if (layoutInProgress) return false;
  layoutInProgress = true;
  try {
    return await runBeautify(scope, selectedOnly);
  } finally {
    layoutInProgress = false;
  }
}
