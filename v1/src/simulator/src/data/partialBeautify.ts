import Node from "../node";
import type Scope from "../circuit";
import { simulationArea } from "../simulationArea";
import type {
  CanonicalComponent,
  CanonicalNet,
  ComponentInstance,
  CanonicalComponentPosition,
  IntermediateNet,
} from "../types/canonical.types";
import { generateElkLayout } from "./autoLayout";
import { resolvePortNode } from "./importCanonical";
import {
  scheduleUpdate,
  updateCanvasSet,
  updateSimulationSet,
  wireToBeCheckedSet,
  forceResetNodesSet,
} from "../engine";

/**
 * Minimal live component interface used by the partial-beautify pipeline.
 * CircuitVerse components have dynamic port and direction properties.
 */
type CVComponent = ComponentInstance & {
  objectType: string;
  x: number;
  y: number;
  bitWidth: number;
  nodeList?: Node[];
  update?: () => void;
  // CircuitVerse components dynamically define ports and configuration properties.
  [key: string]: unknown;
};

/** Axis-aligned bounding box boundary representation. */
interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

const GRID = 10;

/**
 * Snaps a coordinate value to the nearest CircuitVerse grid point (multiple of 10).
 *
 * @param v - Coordinate value to snap.
 * @returns Snapped coordinate value.
 */
function snap(v: number): number {
  return Math.round(v / GRID) * GRID;
}

/**
 * Disconnects two nodes from each other and removes any corresponding Wire from scope.wires.
 *
 * @param scope - Current circuit scope.
 * @param nodeA - First node.
 * @param nodeB - Second node.
 */
function disconnectNodes(scope: Scope, nodeA: Node, nodeB: Node): void {
  if (nodeA.connections) {
    nodeA.connections = nodeA.connections.filter((n: Node) => n !== nodeB);
  }
  if (nodeB.connections) {
    nodeB.connections = nodeB.connections.filter((n: Node) => n !== nodeA);
  }
  if (scope.wires) {
    scope.wires = scope.wires.filter(
      (w: { node1: Node; node2: Node }) =>
        !((w.node1 === nodeA && w.node2 === nodeB) || (w.node1 === nodeB && w.node2 === nodeA)),
    );
  }
}

/**
 * Completely removes an intermediate node (type 2) from the circuit graph and scope.
 *
 * @param scope - Current circuit scope.
 * @param node - Intermediate node to delete.
 */
function deleteIntermediateNode(scope: Scope, node: Node): void {
  if (node.type !== 2) return;
  node.deleted = true;
  for (const neighbor of (node.connections ?? []).slice()) {
    disconnectNodes(scope, node, neighbor);
  }
  if (scope.allNodes) {
    scope.allNodes = scope.allNodes.filter((n: Node) => n !== node);
  }
  if (scope.nodes) {
    scope.nodes = scope.nodes.filter((n: Node) => n !== node);
  }
  if (scope.root?.nodeList) {
    scope.root.nodeList = scope.root.nodeList.filter((n: Node) => n !== node);
  }
  if (simulationArea.lastSelected === node) {
    simulationArea.lastSelected = undefined;
  }
}

/**
 * Connects two nodes with right-angled orthogonal wire segments.
 * All segments are strictly horizontal or vertical to eliminate diagonal wires.
 *
 * @param scope - Current circuit scope.
 * @param nodeA - Starting node.
 * @param nodeB - Ending node.
 * @param bitWidth - Bit width of the net.
 * @param netNodeMap - Map of existing intermediate nodes for this net keyed by "x,y".
 */
function connectOrthogonal(
  scope: Scope,
  nodeA: Node,
  nodeB: Node,
  bitWidth: number | undefined,
  netNodeMap: Map<string, Node>,
): void {
  if (nodeA === nodeB) return;
  if (nodeA.connections?.includes(nodeB)) return;

  const x1 = nodeA.absX();
  const y1 = nodeA.absY();
  const x2 = nodeB.absX();
  const y2 = nodeB.absY();

  // If already collinear along X or Y axis, connect directly
  if (x1 === x2 || y1 === y2) {
    nodeA.connect(nodeB);
    return;
  }

  function getOrCreateBend(x: number, y: number): Node {
    const key = `${x},${y}`;
    let bend = netNodeMap.get(key);
    if (!bend || bend.deleted) {
      if (nodeA.absX() === x && nodeA.absY() === y) return nodeA;
      if (nodeB.absX() === x && nodeB.absY() === y) return nodeB;

      // node.js accepts a bit width number at runtime even if types are loose.
      bend = Reflect.construct(Node, [x, y, 2, scope.root, bitWidth ?? 1]) as Node;
      netNodeMap.set(key, bend);
    }
    return bend;
  }

  const midX = snap((x1 + x2) / 2);

  if (midX !== x1 && midX !== x2) {
    // Standard horizontal -> vertical -> horizontal Z-route
    const b1 = getOrCreateBend(midX, y1);
    const b2 = getOrCreateBend(midX, y2);
    if (!nodeA.connections?.includes(b1)) nodeA.connect(b1);
    if (b1 !== b2 && !b1.connections?.includes(b2)) b1.connect(b2);
    if (!b2.connections?.includes(nodeB)) b2.connect(nodeB);
  } else {
    // Single L-bend at (x2, y1)
    const b = getOrCreateBend(x2, y1);
    if (!nodeA.connections?.includes(b)) nodeA.connect(b);
    if (!b.connections?.includes(nodeB)) b.connect(nodeB);
  }
}

/**
 * Cleans up an internal net: deletes all obsolete intermediate nodes and severs port connections.
 *
 * @param scope - Current circuit scope.
 * @param portNodes - Port nodes belonging to this internal net.
 */
function cleanInternalNet(scope: Scope, portNodes: Node[]): void {
  const netNodes = new Set<Node>();
  const queue: Node[] = [...portNodes];
  for (const p of portNodes) netNodes.add(p);

  while (queue.length > 0) {
    const curr = queue.shift()!;
    for (const neighbor of curr.connections ?? []) {
      if (!netNodes.has(neighbor)) {
        netNodes.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  for (const port of portNodes) {
    for (const neighbor of (port.connections ?? []).slice()) {
      disconnectNodes(scope, port, neighbor);
    }
  }

  for (const node of netNodes) {
    if (node.type === 2) {
      deleteIntermediateNode(scope, node);
    }
  }
}

/**
 * Cleans up a boundary net:
 * - Keeps all unselected wiring completely intact
 * - Disconnects selected ports from unselected wires
 * - Deletes intermediate nodes reachable only from selected ports
 * - Prunes dead-end bends inside the selected components' bounding box
 * - Preserves unselected wiring outside the bounding box as stable connection anchors
 *
 * @param scope - Current circuit scope.
 * @param netSelectedPorts - Ports on this net that belong to selected components.
 * @param netUnselectedPorts - Ports on this net that belong to unselected components.
 * @param selectedBox - Bounding box of the selected components.
 * @returns Array of anchor nodes on the unselected side to connect to.
 */
function cleanBoundaryNet(
  scope: Scope,
  netSelectedPorts: Node[],
  netUnselectedPorts: Node[],
  selectedBox: BoundingBox,
): Node[] {
  const selectedPortSet = new Set(netSelectedPorts);
  const unselectedReachable = new Set<Node>();
  const queue: Node[] = [...netUnselectedPorts];
  for (const u of netUnselectedPorts) unselectedReachable.add(u);

  // Traverse unselected side without crossing selected ports
  while (queue.length > 0) {
    const curr = queue.shift()!;
    for (const neighbor of curr.connections ?? []) {
      if (!unselectedReachable.has(neighbor) && !selectedPortSet.has(neighbor)) {
        unselectedReachable.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  // Traverse selected side
  const selectedReachable = new Set<Node>();
  const sQueue: Node[] = [...netSelectedPorts];
  for (const s of netSelectedPorts) selectedReachable.add(s);
  while (sQueue.length > 0) {
    const curr = sQueue.shift()!;
    for (const neighbor of curr.connections ?? []) {
      if (!selectedReachable.has(neighbor) && !unselectedReachable.has(neighbor)) {
        selectedReachable.add(neighbor);
        sQueue.push(neighbor);
      }
    }
  }

  // Sever connections between selected ports and unselected side
  const cutNeighbors: Node[] = [];
  for (const selPort of netSelectedPorts) {
    for (const neighbor of (selPort.connections ?? []).slice()) {
      if (unselectedReachable.has(neighbor)) {
        cutNeighbors.push(neighbor);
      }
      disconnectNodes(scope, selPort, neighbor);
    }
  }

  // Delete intermediate nodes on the selected side
  for (const node of selectedReachable) {
    if (node.type === 2) {
      deleteIntermediateNode(scope, node);
    }
  }

  // Prune dead-end intermediate nodes on the unselected side that lie inside the selected region
  const pruneQueue: Node[] = [...cutNeighbors];
  const anchors = new Set<Node>();

  while (pruneQueue.length > 0) {
    const node = pruneQueue.shift()!;
    if (node.deleted) continue;

    if (node.type !== 2) {
      anchors.add(node);
      continue;
    }

    const conns = node.connections ?? [];
    if (conns.length === 0) {
      deleteIntermediateNode(scope, node);
    } else if (conns.length === 1) {
      const isInside =
        node.absX() >= selectedBox.minX &&
        node.absX() <= selectedBox.maxX &&
        node.absY() >= selectedBox.minY &&
        node.absY() <= selectedBox.maxY;

      if (isInside) {
        // Bend inside the selected area that led to the old port: prune it back
        const parentNode = conns[0];
        deleteIntermediateNode(scope, node);
        pruneQueue.push(parentNode);
      } else {
        // Outside the selected area: keep as stable anchor for unselected wiring
        anchors.add(node);
      }
    } else {
      // Degree >= 2 connects other unselected wires: keep as anchor
      anchors.add(node);
    }
  }

  if (anchors.size === 0 && netUnselectedPorts.length > 0) {
    anchors.add(netUnselectedPorts[0]);
  }

  return Array.from(anchors);
}

/**
 * Core logic for Partial Circuit Beautification.
 * Rearranges only the user-selected components using ELK layout while keeping
 * the bounding-box center identical and re-routing wires orthogonally.
 *
 * @param selectedInstances - Live component instances chosen by the user.
 * @param components - Full canonical component list for the active circuit.
 * @param nets - Full canonical net list for the active circuit.
 * @param instanceMap - Maps canonical component IDs to live component instances.
 * @param instanceToId - Maps live component instances to canonical component IDs.
 * @param scope - The active circuit scope.
 */
export async function partialBeautifyCircuit(
  selectedInstances: CVComponent[],
  components: CanonicalComponent[],
  nets: CanonicalNet[],
  instanceMap: Map<string, ComponentInstance>,
  instanceToId: Map<ComponentInstance, string>,
  scope: Scope,
): Promise<void> {
  // ── 1. Identify selected canonical IDs ──────────────────────────────────
  const selectedIds = new Set<string>();
  for (const inst of selectedInstances) {
    const id = instanceToId.get(inst);
    if (id) selectedIds.add(id);
  }

  const selectedCanonicalComponents = components.filter((c) => selectedIds.has(c.id));
  if (selectedCanonicalComponents.length === 0) return;

  // ── 2. Record the original bounding-box center of selected components ───
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const inst of selectedInstances) {
    minX = Math.min(minX, inst.x);
    maxX = Math.max(maxX, inst.x);
    minY = Math.min(minY, inst.y);
    maxY = Math.max(maxY, inst.y);
  }

  const centerBefore = {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
  };

  const selectedBox: BoundingBox = {
    minX: minX - 30,
    maxX: maxX + 30,
    minY: minY - 30,
    maxY: maxY + 30,
  };

  // ── 3. Partition nets into internal, boundary, and subgraph nets ────────
  const internalNets: CanonicalNet[] = [];
  const boundaryNets: CanonicalNet[] = [];
  const subgraphNets: CanonicalNet[] = [];

  for (const net of nets) {
    let hasSelected = false;
    let hasUnselected = false;
    const internalConns: string[] = [];

    for (const conn of net.connections) {
      const compId = conn.slice(0, conn.indexOf("."));
      if (selectedIds.has(compId)) {
        hasSelected = true;
        internalConns.push(conn);
      } else {
        hasUnselected = true;
      }
    }

    if (hasSelected && !hasUnselected) {
      internalNets.push(net);
    } else if (hasSelected && hasUnselected) {
      boundaryNets.push(net);
    }

    if (internalConns.length >= 2) {
      subgraphNets.push({
        id: net.id,
        bitWidth: net.bitWidth,
        connections: internalConns,
      });
    }
  }

  // ── 4. Run ELK on the selected sub-graph ─────────────────────────────────
  const elkLayout = await generateElkLayout(selectedCanonicalComponents, subgraphNets, instanceMap);

  // ── 5. Compute ELK centroid and translation offset ──────────────────────
  let elkMinX = Infinity;
  let elkMaxX = -Infinity;
  let elkMinY = Infinity;
  let maxYElk = -Infinity;

  for (const comp of selectedCanonicalComponents) {
    const pos = elkLayout[comp.id] as CanonicalComponentPosition | undefined;
    if (!pos) continue;
    elkMinX = Math.min(elkMinX, pos.x);
    elkMaxX = Math.max(elkMaxX, pos.x);
    elkMinY = Math.min(elkMinY, pos.y);
    maxYElk = Math.max(maxYElk, pos.y);
  }

  const centerAfter = {
    x: (elkMinX + elkMaxX) / 2,
    y: (elkMinY + maxYElk) / 2,
  };

  const offset = {
    x: snap(centerBefore.x - centerAfter.x),
    y: snap(centerBefore.y - centerAfter.y),
  };

  // ── 6. Clean obsolete wires and capture boundary anchors BEFORE moving ──
  // Clean purely internal nets
  for (const net of internalNets) {
    const portNodes: Node[] = [];
    for (const conn of net.connections) {
      const node = resolvePortNode(conn, instanceMap);
      if (node) portNodes.push(node);
    }
    cleanInternalNet(scope, portNodes);
  }

  // Clean boundary nets & collect anchors
  type BoundaryInfo = {
    net: CanonicalNet;
    anchors: Node[];
    selectedPorts: Node[];
  };
  const boundaryInfos: BoundaryInfo[] = [];

  for (const net of boundaryNets) {
    const selectedPorts: Node[] = [];
    const unselectedPorts: Node[] = [];

    for (const conn of net.connections) {
      const compId = conn.slice(0, conn.indexOf("."));
      const node = resolvePortNode(conn, instanceMap);
      if (!node) continue;
      if (selectedIds.has(compId)) {
        selectedPorts.push(node);
      } else {
        unselectedPorts.push(node);
      }
    }

    if (selectedPorts.length === 0 || unselectedPorts.length === 0) continue;

    const anchors = cleanBoundaryNet(scope, selectedPorts, unselectedPorts, selectedBox);
    boundaryInfos.push({ net, anchors, selectedPorts });
  }

  // ── 7. Apply translated positions to live component instances ───────────
  for (const comp of selectedCanonicalComponents) {
    const inst = instanceMap.get(comp.id) as CVComponent | undefined;
    if (!inst) continue;
    const pos = elkLayout[comp.id] as CanonicalComponentPosition | undefined;
    if (!pos) continue;

    inst.x = snap(pos.x + offset.x);
    inst.y = snap(pos.y + offset.y);
    inst.update?.();
  }

  // ── 8. Reconstruct internal wires ───────────────────────────────────────
  // 8a. From ELK intermediate routing
  if (elkLayout.intermediateNodes) {
    const elkRouting = elkLayout.intermediateNodes as Record<string, IntermediateNet>;

    for (const [netId, routing] of Object.entries(elkRouting)) {
      const net = nets.find((n) => n.id === netId);
      if (!net) continue;

      const junctionNodes: Node[] = routing.nodes.map((pt) => {
        const x = snap(pt.x + offset.x);
        const y = snap(pt.y + offset.y);
        // node.js accepts a bit width number at runtime even if types are loose.
        return Reflect.construct(Node, [x, y, 2, scope.root, net.bitWidth ?? 1]) as Node;
      });

      for (const [a, b] of routing.connections) {
        const nodeA =
          typeof a === "number" ? junctionNodes[a] : resolvePortNode(a as string, instanceMap);
        const nodeB =
          typeof b === "number" ? junctionNodes[b] : resolvePortNode(b as string, instanceMap);
        if (nodeA && nodeB && !nodeA.connections?.includes(nodeB)) {
          if (nodeA.absX() === nodeB.absX() || nodeA.absY() === nodeB.absY()) {
            nodeA.connect(nodeB);
          } else {
            // Guard: ensure strictly right-angled orthogonal segments if ELK snapped diagonally.
            const netNodeMap = new Map<string, Node>();
            connectOrthogonal(scope, nodeA, nodeB, net.bitWidth ?? 1, netNodeMap);
          }
        }
      }
    }
  }

  // 8b. Internal nets that ELK routed directly (no intermediate nodes)
  for (const net of internalNets) {
    if (elkLayout.intermediateNodes?.[net.id]) continue;
    const portNodes: Node[] = [];
    for (const conn of net.connections) {
      const node = resolvePortNode(conn, instanceMap);
      if (node) portNodes.push(node);
    }
    const netNodeMap = new Map<string, Node>();
    for (let i = 1; i < portNodes.length; i++) {
      connectOrthogonal(scope, portNodes[i - 1], portNodes[i], net.bitWidth, netNodeMap);
    }
  }

  // ── 9. Reconnect boundary nets orthogonally ─────────────────────────────
  for (const { net, anchors, selectedPorts } of boundaryInfos) {
    // If there are multiple selected ports and ELK didn't route them, connect them
    if (selectedPorts.length > 1 && !elkLayout.intermediateNodes?.[net.id]) {
      const netNodeMap = new Map<string, Node>();
      for (let i = 1; i < selectedPorts.length; i++) {
        connectOrthogonal(scope, selectedPorts[i - 1], selectedPorts[i], net.bitWidth, netNodeMap);
      }
    }

    // Connect each anchor on the unselected side to the closest selected port
    for (const anchor of anchors) {
      let bestPort = selectedPorts[0];
      let bestDist = Infinity;
      for (const sp of selectedPorts) {
        const d = Math.abs(sp.absX() - anchor.absX()) + Math.abs(sp.absY() - anchor.absY());
        if (d < bestDist) {
          bestDist = d;
          bestPort = sp;
        }
      }
      const netNodeMap = new Map<string, Node>();
      connectOrthogonal(scope, anchor, bestPort, net.bitWidth, netNodeMap);
    }
  }

  // ── 10. Clean wire array and trigger engine updates ──────────────────────
  if (scope.wires) {
    scope.wires = scope.wires.filter(
      (w: { node1: Node; node2: Node }) =>
        !w.node1.deleted &&
        !w.node2.deleted &&
        w.node1.connections?.includes(w.node2) &&
        w.node2.connections?.includes(w.node1),
    );
    for (const w of scope.wires) {
      w.updateData();
    }
  }

  wireToBeCheckedSet(1);
  forceResetNodesSet(true);
  updateCanvasSet(true);
  updateSimulationSet(true);
  scheduleUpdate(1);
}
