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
  nodeList: Node[];
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

/** Returns component bounds after accounting for its rotation. */
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

  // Include ports that extend beyond the component body.
  for (const node of instance.nodeList) {
    left = Math.max(left, -node.x);
    right = Math.max(right, node.x);
    up = Math.max(up, -node.y);
    down = Math.max(down, node.y);
  }

  return { left, right, up, down };
}

/** Chooses the ELK side nearest to a component-relative port. */
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

/** Converts canonical nets into direct ELK edges or synthetic fan-out junctions. */
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

/** Groups each canonical port reference by its component ID. */
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

/** Reuses or creates a canonical routing point without snapping it again. */
function getOrAddNode(
  routing: IntermediateNet,
  nodeMap: Map<string, number>,
  point: ElkPoint,
): number {
  const { x, y } = point;
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

  return getOrAddNode(routing, nodeMap, {
    x: snap(junctionPoint.x),
    y: snap(junctionPoint.y),
  });
}

/** Returns how far an endpoint moves when its owner is snapped to the grid. */
function getEndpointSnapDelta(
  endpoint: EdgeEndpoint,
  componentSnapDeltas: Map<string, ElkPoint>,
  junctionPoints: Map<string, ElkPoint>,
): ElkPoint {
  if (endpoint.kind === "port") {
    const componentId = endpoint.id.slice(0, endpoint.id.indexOf("."));
    return componentSnapDeltas.get(componentId) ?? { x: 0, y: 0 };
  }

  const point = junctionPoints.get(endpoint.id);
  if (!point) return { x: 0, y: 0 };

  return {
    x: snap(point.x) - point.x,
    y: snap(point.y) - point.y,
  };
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

/** Treats nearly equal ELK coordinates as aligned. */
function sameCoordinate(first: number, second: number): boolean {
  return Math.abs(first - second) < 0.001;
}

/** Converts ELK routes into canonical orthogonal routing. */
export function buildIntermediateNodes(
  edges: ElkExtendedEdge[],
  edgeInfo: Map<string, EdgeInfo>,
  junctionPoints: Map<string, ElkPoint>,
  componentSnapDeltas: Map<string, ElkPoint> = new Map(),
): Record<string, IntermediateNet> {
  const result: Record<string, IntermediateNet> = {};

  const routingStateByNet = new Map<string, RoutingState>();

  // Build the actual canonical routing for each ELK edge.
  for (const edge of edges) {
    const info = edgeInfo.get(edge.id);
    if (!info) continue;

    const hasJunction = info.source.kind === "junction" || info.target.kind === "junction";
    const section = edge.sections?.[0];
    const sourceDelta = getEndpointSnapDelta(info.source, componentSnapDeltas, junctionPoints);
    const targetDelta = getEndpointSnapDelta(info.target, componentSnapDeltas, junctionPoints);
    const rawBendPoints = section?.bendPoints ?? [];
    let bendPoints = rawBendPoints.map((point) => ({
      x: snap(point.x),
      y: snap(point.y),
    }));

    // ELK may omit route data, so only adjust edges with a section.
    if (section) {
      if (bendPoints.length > 0) {
        const first = rawBendPoints[0];
        const last = rawBendPoints[rawBendPoints.length - 1];

        if (sameCoordinate(section.startPoint.x, first.x)) {
          bendPoints[0].x = section.startPoint.x + sourceDelta.x;
        } else if (sameCoordinate(section.startPoint.y, first.y)) {
          bendPoints[0].y = section.startPoint.y + sourceDelta.y;
        }

        if (sameCoordinate(section.endPoint.x, last.x)) {
          bendPoints[bendPoints.length - 1].x = section.endPoint.x + targetDelta.x;
        } else if (sameCoordinate(section.endPoint.y, last.y)) {
          bendPoints[bendPoints.length - 1].y = section.endPoint.y + targetDelta.y;
        }
      } else {
        // A straight ELK edge can become diagonal when its endpoints snap differently.
        const sourcePoint = {
          x: section.startPoint.x + sourceDelta.x,
          y: section.startPoint.y + sourceDelta.y,
        };
        const targetPoint = {
          x: section.endPoint.x + targetDelta.x,
          y: section.endPoint.y + targetDelta.y,
        };

        // Add bends only when the snapped endpoints no longer share an axis.
        if (
          !sameCoordinate(sourcePoint.x, targetPoint.x) &&
          !sameCoordinate(sourcePoint.y, targetPoint.y)
        ) {
          if (sameCoordinate(section.startPoint.y, section.endPoint.y)) {
            const x = snap((sourcePoint.x + targetPoint.x) / 2);
            bendPoints = [
              { x, y: sourcePoint.y },
              { x, y: targetPoint.y },
            ];
          } else if (sameCoordinate(section.startPoint.x, section.endPoint.x)) {
            const y = snap((sourcePoint.y + targetPoint.y) / 2);
            bendPoints = [
              { x: sourcePoint.x, y },
              { x: targetPoint.x, y },
            ];
          }
        }
      }
    }

    if (!hasJunction && bendPoints.length === 0) continue;

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
      ...bendPoints.map((point) => getOrAddNode(routing, nodeMap, point)),
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

/** Generates component positions and canonical routing for a layoutless scope. */
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
  const componentSnapDeltas = new Map<string, ElkPoint>();

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
    const x = child.x + bounds.left;
    const y = child.y + bounds.up;
    const X = snap(x);
    const Y = snap(y);

    layout[child.id] = {
      x: X,
      y: Y,
      labelDirection: instance.labelDirection,
    };
    componentSnapDeltas.set(child.id, {
      x: X - x,
      y: Y - y,
    });
  }

  const intermediateNodes = buildIntermediateNodes(
    laidOut.edges ?? [],
    edgeInfo,
    junctionPoints,
    componentSnapDeltas,
  );
  if (Object.keys(intermediateNodes).length > 0) {
    layout.intermediateNodes = intermediateNodes;
  }

  return layout;
}
