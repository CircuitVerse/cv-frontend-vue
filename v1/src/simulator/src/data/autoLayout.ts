import ELKConstructor from "elkjs/lib/elk-api.js";
import type { ELK, ElkExtendedEdge, ElkNode, ElkPoint, ElkPort } from "elkjs/lib/elk-api.js";
import ELKWorker from "elkjs/lib/elk-worker.min.js?worker";
import type Node from "../node";
import type {
  CanonicalComponent,
  CanonicalLayout,
  CanonicalNet,
  ComponentInstance,
  Direction,
  IntermediateNet,
  RoutingEndpoint,
  SubcircuitSymbol,
} from "../types/canonical.types";
import { resolvePortNode } from "./importCanonical";

type LayoutInstance = ComponentInstance & {
  objectType: string;
  layoutProperties?: { x?: number; y?: number };
  direction: Direction;
  directionFixed?: boolean;
  overrideDirectionRotation?: boolean;
  leftDimensionX: number;
  rightDimensionX: number;
  upDimensionY: number;
  downDimensionY: number;
};

type Bounds = {
  left: number;
  right: number;
  up: number;
  down: number;
};

type EdgeEndpoint = { kind: "port"; id: string } | { kind: "junction"; id: string };

type EdgeInfo = {
  netId: string;
  source: EdgeEndpoint;
  target: EdgeEndpoint;
};

type ElkEdgeData = {
  edges: ElkExtendedEdge[];
  edgeInfo: Map<string, EdgeInfo>;
  junctions: ElkNode[];
};

type RoutingState = {
  routing: IntermediateNet;
  nodeMap: Map<string, number>;
  connectionKeys: Set<string>;
};

type PortSide = "NORTH" | "EAST" | "WEST" | "SOUTH";

function addEdge(
  edges: ElkExtendedEdge[],
  edgeInfo: Map<string, EdgeInfo>,
  id: string,
  info: EdgeInfo,
): void {
  edges.push({
    id,
    sources: [info.source.id],
    targets: [info.target.id],
  });
  edgeInfo.set(id, info);
}

function getBounds(instance: LayoutInstance): Bounds {
  let left = instance.leftDimensionX;
  let right = instance.rightDimensionX;
  let up = instance.upDimensionY;
  let down = instance.downDimensionY;

  if (!instance.directionFixed && !instance.overrideDirectionRotation) {
    if (instance.direction === "LEFT") {
      [left, right] = [right, left];
    } else if (instance.direction === "DOWN") {
      [left, right, up, down] = [down, up, left, right];
    } else if (instance.direction === "UP") {
      [left, right, up, down] = [down, up, right, left];
    }
  }

  return { left, right, up, down };
}

function getPortDir(node: Node, bounds: Bounds): PortSide {
  if (node.x < -bounds.left) return "WEST";
  if (node.x > bounds.right) return "EAST";
  if (node.y < -bounds.up) return "NORTH";
  if (node.y > bounds.down) return "SOUTH";

  const distances = [
    {
      side: "WEST" as const,
      distance: Math.abs(node.x + bounds.left),
    },
    {
      side: "EAST" as const,
      distance: Math.abs(bounds.right - node.x),
    },
    {
      side: "NORTH" as const,
      distance: Math.abs(node.y + bounds.up),
    },
    {
      side: "SOUTH" as const,
      distance: Math.abs(bounds.down - node.y),
    },
  ];

  distances.sort((a, b) => a.distance - b.distance);
  return distances[0].side;
}

function buildElkNodes(
  components: CanonicalComponent[],
  instanceMap: Map<string, ComponentInstance>,
  portRefsByComponent: Map<string, Set<string>>,
): ElkNode[] {
  return components.map((component) => {
    const instance = instanceMap.get(component.id) as LayoutInstance | undefined;

    if (!instance) {
      throw new Error(`Cannot build ELK node for component "${component.id}"`);
    }

    const bounds = getBounds(instance);

    const ports: ElkPort[] = [];

    for (const portRef of portRefsByComponent.get(component.id) ?? []) {
      const node = resolvePortNode(portRef, instanceMap);

      if (!node) {
        throw new Error(`Cannot resolve ELK port "${portRef}"`);
      }

      ports.push({
        id: portRef,
        x: node.x + bounds.left,
        y: node.y + bounds.up,
        layoutOptions: {
          "elk.port.side": getPortDir(node, bounds),
        },
      });
    }

    const compLayoutOptions: Record<string, string> = {
      "elk.portConstraints": "FIXED_POS",
    };

    if (component.type === "Input") {
      compLayoutOptions["elk.layered.layering.layerConstraint"] = "FIRST";
    }

    if (component.type === "Output") {
      compLayoutOptions["elk.layered.layering.layerConstraint"] = "LAST";
    }

    return {
      id: component.id,
      width: bounds.left + bounds.right,
      height: bounds.up + bounds.down,
      ports,
      layoutOptions: compLayoutOptions,
    };
  });
}

let elk: ELK | undefined;

function getElk(): ELK {
  elk ??= new ELKConstructor({
    algorithms: ["layered"],
    workerFactory: () => new ELKWorker(),
  });

  return elk;
}

function buildElkEdges(
  nets: CanonicalNet[],
  instanceMap: Map<string, ComponentInstance>,
): ElkEdgeData {
  const edges: ElkExtendedEdge[] = [];
  const edgeInfo = new Map<string, EdgeInfo>();
  const junctions: ElkNode[] = [];

  for (const net of nets) {
    if (net.connections.length < 2) continue;

    const sourceId =
      net.connections.find((portRef) => resolvePortNode(portRef, instanceMap)?.type === 1) ??
      net.connections[0];

    const source: EdgeEndpoint = {
      kind: "port",
      id: sourceId,
    };

    const targets = net.connections.filter((portRef) => portRef !== sourceId);
    const firstEdgeId = `${net.id}_0`;

    if (targets.length === 1) {
      const target: EdgeEndpoint = {
        kind: "port",
        id: targets[0],
      };

      addEdge(edges, edgeInfo, firstEdgeId, {
        netId: net.id,
        source,
        target,
      });

      continue;
    }

    const junctionId = `junction_${net.id}`;
    const junction: EdgeEndpoint = {
      kind: "junction",
      id: junctionId,
    };

    junctions.push({
      id: junctionId,
      width: 0,
      height: 0,
      layoutOptions: {
        "elk.hypernode": "true",
      },
    });

    addEdge(edges, edgeInfo, firstEdgeId, {
      netId: net.id,
      source,
      target: junction,
    });

    for (let i = 0; i < targets.length; i++) {
      const id = `${net.id}_${i + 1}`;
      addEdge(edges, edgeInfo, id, {
        netId: net.id,
        source: junction,
        target: {
          kind: "port",
          id: targets[i],
        },
      });
    }
  }

  return { edges, edgeInfo, junctions };
}

/** Groups each port reference by its component so node creation can look it up directly.
* Eg:
* CanoicalNet[]: ["and1.inputA", "and1.inputB", "led1.input"]
* to:
  {
    and1: ["and1.inputA", "and1.inputB"];
  }
*/
function groupPortRefsByComponent(nets: CanonicalNet[]): Map<string, Set<string>> {
  const portRefsByComponent = new Map<string, Set<string>>();

  for (const net of nets) {
    for (const portRef of net.connections) {
      const separator = portRef.indexOf(".");
      if (separator < 1) continue;

      const componentId = portRef.slice(0, separator);
      let portRefs = portRefsByComponent.get(componentId);
      if (!portRefs) {
        portRefs = new Set();
        portRefsByComponent.set(componentId, portRefs);
      }
      portRefs.add(portRef);
    }
  }

  return portRefsByComponent;
}

function buildElkGraph(
  components: CanonicalComponent[],
  nets: CanonicalNet[],
  instanceMap: Map<string, ComponentInstance>,
) {
  const portRefsByComponent = groupPortRefsByComponent(nets);
  const children = buildElkNodes(components, instanceMap, portRefsByComponent);
  const { edges, edgeInfo, junctions } = buildElkEdges(nets, instanceMap);

  const graph: ElkNode = {
    id: "root",
    children: [...children, ...junctions],
    edges,
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.padding": "[top=40,left=40,bottom=40,right=40]",

      // More room between components in the same layer.
      "elk.spacing.nodeNode": "40",

      // More horizontal separation between successive logic layers.
      "elk.layered.spacing.nodeNodeBetweenLayers": "60",

      // Keep wires from running too close to components.
      "elk.spacing.edgeNode": "20",
      "elk.layered.spacing.edgeNodeBetweenLayers": "20",

      // Separate parallel wires a little more.
      "elk.spacing.edgeEdge": "15",
      "elk.layered.spacing.edgeEdgeBetweenLayers": "15",
    },
  };

  return { graph, edgeInfo, junctions };
}

function getOrAddNode(
  routing: IntermediateNet,
  nodeMap: Map<string, number>,
  point: ElkPoint,
): number {
  const x = snap(point.x);
  const y = snap(point.y);
  const key = `${x},${y}`;

  const existing = nodeMap.get(key);
  if (existing !== undefined) return existing;

  const index = routing.nodes.length;

  routing.nodes.push({ x, y });
  nodeMap.set(key, index);

  return index;
}

function resolveEndpoint(
  endpoint: EdgeEndpoint,
  junctionPoint: ElkPoint | undefined,
  routing: IntermediateNet,
  nodeMap: Map<string, number>,
): RoutingEndpoint {
  if (endpoint.kind === "port") return endpoint.id;

  if (!junctionPoint) {
    throw new Error(`ELK did not position junction "${endpoint.id}"`);
  }

  return getOrAddNode(routing, nodeMap, junctionPoint);
}

function addConnection(
  routing: IntermediateNet,
  connectionKeys: Set<string>,
  first: RoutingEndpoint,
  second: RoutingEndpoint,
): void {
  if (first === second) return;

  const firstKey = typeof first === "number" ? `node:${first}` : `port:${first}`;
  const secondKey = typeof second === "number" ? `node:${second}` : `port:${second}`;
  const key = firstKey < secondKey ? `${firstKey}|${secondKey}` : `${secondKey}|${firstKey}`;

  if (connectionKeys.has(key)) return;

  connectionKeys.add(key);
  routing.connections.push([first, second]);
}

export function buildIntermediateNodes(
  edges: ElkExtendedEdge[],
  edgeInfo: Map<string, EdgeInfo>,
  junctionPoints: Map<string, ElkPoint>,
): Record<string, IntermediateNet> {
  const result: Record<string, IntermediateNet> = {};

  const routingStateByNet = new Map<string, RoutingState>();

  // Build the actual canonical routing for each ELK edge.
  for (const edge of edges) {
    const info = edgeInfo.get(edge.id);
    if (!info) continue;

    const hasJunction = info.source.kind === "junction" || info.target.kind === "junction";
    const section = edge.sections?.[0];
    const hasBends = (section?.bendPoints?.length ?? 0) > 0;

    if (!hasJunction && !hasBends) continue;

    let state = routingStateByNet.get(info.netId);
    if (!state) {
      state = {
        routing: { nodes: [], connections: [] },
        nodeMap: new Map(),
        connectionKeys: new Set(),
      };
      routingStateByNet.set(info.netId, state);
      result[info.netId] = state.routing;
    }

    const { routing, nodeMap, connectionKeys } = state;
    const source = resolveEndpoint(
      info.source,
      junctionPoints.get(info.source.id),
      routing,
      nodeMap,
    );
    const target = resolveEndpoint(
      info.target,
      junctionPoints.get(info.target.id),
      routing,
      nodeMap,
    );

    // If ELK returned no section, connect the two known endpoints directly.
    if (!section) {
      addConnection(routing, connectionKeys, source, target);
      continue;
    }

    const path: (string | number)[] = [
      source,
      ...(section.bendPoints ?? []).map((point) => getOrAddNode(routing, nodeMap, point)),
      target,
    ];

    for (let i = 1; i < path.length; i++) {
      addConnection(routing, connectionKeys, path[i - 1], path[i]);
    }
  }

  return result;
}

const GRID_SIZE = 10;

function snap(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

function defaultSubcircuitSymbol(instanceMap: Map<string, ComponentInstance>): SubcircuitSymbol {
  let width = 100;
  let height = 40;

  for (const value of instanceMap.values()) {
    const instance = value as LayoutInstance;
    if (instance.objectType !== "Input" && instance.objectType !== "Output") continue;

    const x = instance.layoutProperties?.x;
    const y = instance.layoutProperties?.y;

    if (typeof x === "number" && Number.isFinite(x)) width = Math.max(width, x);
    if (typeof y === "number" && Number.isFinite(y)) {
      height = Math.max(height, y + GRID_SIZE * 2);
    }
  }

  width = snap(width);
  height = snap(height);

  return {
    width,
    height,
    titleX: width / 2,
    titleY: 13,
    titleEnabled: true,
  };
}

export async function generateElkLayout(
  components: CanonicalComponent[],
  nets: CanonicalNet[],
  instanceMap: Map<string, ComponentInstance>,
): Promise<CanonicalLayout> {
  const { graph, edgeInfo, junctions } = buildElkGraph(components, nets, instanceMap);

  const laidOut = await getElk().layout(graph);
  const layout: CanonicalLayout = {
    subcircuitSymbol: defaultSubcircuitSymbol(instanceMap),
  };

  const junctionIds = new Set(junctions.map((junction) => junction.id));
  const junctionPoints = new Map<string, ElkPoint>();

  for (const child of laidOut.children ?? []) {
    if (junctionIds.has(child.id)) {
      if (
        child.x === undefined ||
        child.y === undefined ||
        !Number.isFinite(child.x) ||
        !Number.isFinite(child.y)
      ) {
        throw new Error(`ELK did not position junction "${child.id}"`);
      }

      junctionPoints.set(child.id, {
        x: child.x,
        y: child.y,
      });

      continue;
    }

    const instance = instanceMap.get(child.id) as LayoutInstance | undefined;
    if (!instance) continue;

    if (
      child.x === undefined ||
      child.y === undefined ||
      !Number.isFinite(child.x) ||
      !Number.isFinite(child.y)
    ) {
      throw new Error(`ELK did not position component "${child.id}"`);
    }

    const bounds = getBounds(instance);

    layout[child.id] = {
      x: snap(child.x + bounds.left),
      y: snap(child.y + bounds.up),
      labelDirection: instance.labelDirection,
    };
  }

  const intermediateNodes = buildIntermediateNodes(laidOut.edges ?? [], edgeInfo, junctionPoints);
  if (Object.keys(intermediateNodes).length > 0) {
    layout.intermediateNodes = intermediateNodes;
  }

  return layout;
}
