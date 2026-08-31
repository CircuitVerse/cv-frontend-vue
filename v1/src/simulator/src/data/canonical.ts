import { annotationList, circuitElementList } from "../metadata";
import type Scope from "../circuit";
import type Node from "../node";
import { SimulatorStore } from "#/store/SimulatorStore/SimulatorStore";
import { useProjectStore } from "#/store/projectStore";
import { simulationArea } from "../simulationArea";
import type {
  CanonicalScope,
  CanonicalAnnotation,
  CanonicalLayout,
  CanonicalComponent,
  CanonicalComponentPosition,
  CanonicalComponentProperties,
  IntermediateNet,
  CanonicalJsonValue,
  CanonicalNet,
  CanonicalProject,
  Direction,
  ComponentInstance,
  RoutingConnection,
  RoutingEndpoint,
} from "../types/canonical.types";

/** Maps live node objects to their position in Scope.allNodes */
type NodeIndexMap = Map<Node, number>;

/** Live component data read by the canonical exporter. */
type CVComponent = ComponentInstance & {
  objectType: string;
  bitWidth: number;
  customSave: () => {
    nodes: Record<string, number | number[]>;
    // Only components with saved state or identifiers emit values.
    values?: {
      state?: number;
      identifier?: string;
    };
    // RGBLed is the only built-in component which does not emit constructor parameters.
    constructorParamaters?: CanonicalJsonValue[];
  };
  direction: Direction;
  x: number;
  y: number;
  canShowInSubcircuit: boolean;
  subcircuitMetadata?: CanonicalComponentPosition["subcircuitMetadata"];
  // Port keys cannot be static: AndGate.inp is a node array while Flag.identifier is a string.
  [key: string]: unknown;
};

/** Live visual annotation data read by the canonical exporter. */
type CVAnnotation = ComponentInstance & {
  objectType: string;
  x: number;
  y: number;
  customSave: () => { constructorParamaters?: CanonicalJsonValue[] };
};

/** Component data collected before canonical IDs are assigned. */
type ComponentDraft = {
  id?: string; // Assigned after structural sorting.
  type: string;
  label: string;
  bitWidth: number;
  properties: CanonicalComponentProperties;
  _connections: Record<string, number>;
  _canonicalPortNames: string[]; // Used for Sorted canonical hashing, net IDs and WL signatures
  _state?: number; // Stateless components do not have an initial state.
  _labelDirection: Direction;
  _x: number;
  _y: number;
  _instance: CVComponent;
  _portNames: string[]; // Used for retrieving live nodes via comp._instance["inp"]
};

/** Component draft after its canonical ID has been assigned.
 * It contains live simulator references and temporary graph information.
 */
type FinalComponentDraft = ComponentDraft & { id: string };

type NetDraft = {
  bitWidth: number;
  connections: string[];
};

/** Hash-relevant properties and signature cached for one component. */
type StructuralComponentData = {
  properties: CanonicalComponentProperties;
  signature: string;
};

/** One component port connected to a Union-Find net root. */
type ConnectedPort = {
  componentIndex: number;
  portName: string;
  netRoot: number;
};

class UnionFind {
  private parent: number[];
  private rank: number[];

  constructor(size: number) {
    this.parent = Array.from({ length: size }, (_, index) => index);
    this.rank = Array.from({ length: size }, () => 0);
  }

  find(x: number): number {
    let root = x;
    while (this.parent[root] !== root) root = this.parent[root];
    while (this.parent[x] !== root) {
      const next = this.parent[x];
      this.parent[x] = root;
      x = next;
    }
    return root;
  }

  union(a: number, b: number) {
    let rootA = this.find(a);
    let rootB = this.find(b);

    if (rootA === rootB) return;

    if (this.rank[rootA] < this.rank[rootB]) {
      [rootA, rootB] = [rootB, rootA];
    }

    this.parent[rootB] = rootA;

    if (this.rank[rootA] === this.rank[rootB]) {
      this.rank[rootA]++;
    }
  }
}

export const STATEFUL_DEFAULT_STATE: Record<string, "state" | "slaveState" | "value"> = {
  Input: "state",
  Button: "state",
  DflipFlop: "slaveState",
  TflipFlop: "slaveState",
  SRflipFlop: "state",
  JKflipFlop: "slaveState",
  Dlatch: "state",
  Counter: "value",
  Stepper: "state",
};

/**
 * Creates a mapping from Node references to their numerical indices.
 */
function indexNodes(allNodes: Node[]) {
  const map = new Map<Node, number>();
  for (let i = 0; i < allNodes.length; i++) {
    map.set(allNodes[i], i);
  }
  return map;
}

/**
 * Groups interconnected nodes and records each final root's wiring and bit width.
 */
function discoverNets(allNodes: Node[], nodeIndexMap: NodeIndexMap) {
  const uf = new UnionFind(allNodes.length);
  const isWired = new Uint8Array(allNodes.length);

  for (let i = 0; i < allNodes.length; i++) {
    const node = allNodes[i];
    // Nodes enter Scope.allNodes only after the constructor creates connections.
    const connections = node.connections!;
    for (let j = 0; j < connections.length; j++) {
      const neighbourIdx = nodeIndexMap.get(connections[j]);
      if (neighbourIdx !== undefined) {
        isWired[i] = 1;
        isWired[neighbourIdx] = 1;
        uf.union(i, neighbourIdx);
      }
    }
  }

  const netMap = new Map<number, NetDraft>();
  for (let i = 0; i < allNodes.length; i++) {
    if (!isWired[i]) continue;

    const root = uf.find(i);
    const bitWidth = Number(allNodes[i].bitWidth);
    const net = netMap.get(root);
    if (net === undefined) {
      netMap.set(root, { bitWidth, connections: [] });
    } else if (bitWidth > net.bitWidth) {
      net.bitWidth = bitWidth;
    }
  }

  return { uf, netMap };
}

/**
 * Constructs initial drafts of components by extracting structural properties and default states.
 */
function buildComponentDrafts(scope: Scope, uf: UnionFind, nodeIndexMap: NodeIndexMap) {
  const components: ComponentDraft[] = [];

  for (let i = 0; i < circuitElementList.length; i++) {
    const typeName = circuitElementList[i];
    // Scope.initialize() writes component arrays onto the scope using dynamic string keys from moduleList
    // (e.g. this["AndGate"] = [], this["Input"] = []), so no static Scope property covers these 60+ arrays.
    // scope[typeName] would return "unknown" due to the index signature; Reflect.get returns "any",
    // which allows the CVComponent[] annotation without a cast. Both are equally unchecked at runtime —
    // Reflect.get is used here as an explicit marker of this dynamic boundary rather than a hidden "as" cast.
    const instances: CVComponent[] = Reflect.get(scope, typeName);
    if (instances.length === 0) continue;

    for (let j = 0; j < instances.length; j++) {
      const comp = instances[j];
      const saveData = comp.customSave();
      const portNames = Object.keys(saveData.nodes);

      const portRootIndices: Record<string, number> = {};

      for (const portName of portNames) {
        const port = comp[portName] as Node | Node[];

        if (Array.isArray(port)) {
          for (let offset = 0; offset < port.length; offset++) {
            const idx = nodeIndexMap.get(port[offset])!;
            portRootIndices[`${portName}_${offset}`] = uf.find(idx);
          }
        } else {
          portRootIndices[portName] = uf.find(nodeIndexMap.get(port)!);
        }
      }

      const properties: CanonicalComponentProperties = {
        propagationDelay: comp.propagationDelay,
      };

      if (saveData.constructorParamaters !== undefined) {
        properties.constructorParamaters = saveData.constructorParamaters;
      }

      if (typeName === "Flag" && saveData.values?.identifier !== undefined) {
        properties.constructorParamaters = [
          ...(properties.constructorParamaters ?? []),
          saveData.values.identifier,
        ];
      }

      const statePropKey = STATEFUL_DEFAULT_STATE[typeName];
      const defaultState =
        statePropKey !== undefined ? (comp[statePropKey] as number | undefined) : undefined;

      components.push({
        type: comp.objectType,
        label: comp.label || "",
        bitWidth: Number(comp.bitWidth),
        properties,
        _connections: portRootIndices,
        _canonicalPortNames: Object.keys(portRootIndices).sort(naturalCompare),
        _state: defaultState,
        _labelDirection: comp.labelDirection,
        _x: comp.x,
        _y: comp.y,
        _instance: comp,
        _portNames: portNames,
      });
    }
  }

  return components;
}

function buildAnnotations(scope: Scope): CanonicalAnnotation[] {
  const annotations: CanonicalAnnotation[] = [];

  for (const type of annotationList) {
    const instances: CVAnnotation[] = Reflect.get(scope, type);
    for (const ann of instances) {
      const data: CanonicalAnnotation = {
        type: ann.objectType,
        x: ann.x,
        y: ann.y,
        labelDirection: ann.labelDirection,
        propagationDelay: ann.propagationDelay,
        constructorParamaters: ann.customSave().constructorParamaters ?? [],
      };
      if (ann.label) data.label = ann.label;
      annotations.push(data);
    }
  }

  return annotations;
}

/**
 * A locale-free natural-order string comparator for stable canonical sorting.
 *
 * "inp_9" > "inp_10", [if we apply normal sort, which is wrong]
 * "Input_10" > "Input_2" [if we apply sort using the below function, Correct Sort]
 */
function naturalCompare(a: string, b: string): number {
  const prefix_a = /^(.*?)(\d+)$/.exec(a);
  const prefix_b = /^(.*?)(\d+)$/.exec(b);

  if (prefix_a && prefix_b && prefix_a[1] === prefix_b[1]) {
    const diff = Number(prefix_a[2]) - Number(prefix_b[2]);
    if (diff !== 0) {
      return diff;
    }
  }

  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Produces the hash-relevant property bag used for component ordering and hashing.
 * Visual direction/layout data is neutralised and SubCircuit IDs become child content hashes.
 */
function buildStructuralProperties(
  comp: ComponentDraft,
  childHashes?: Map<number, string>,
): CanonicalComponentProperties {
  const properties = { ...comp.properties };
  const constructorParams = properties.constructorParamaters;

  if (constructorParams !== undefined) {
    const params = [...constructorParams];
    if (params[0] === comp._instance.direction) {
      params[0] = null; // params[0] is the component's orientation on the canvas
    }
    if (comp.type === "Input" || comp.type === "Output") {
      params[2] = null; // params[2] holds layoutProperties
    }
    if (comp.type === "SubCircuit") {
      const childId = Number(params[0]);
      const childHash = childHashes?.get(childId);
      if (!childHash) {
        throw new Error(
          `[canonical] SubCircuit references scope ${String(params[0])}, but no child hash is available`,
        );
      }
      params[0] = childHash;
    }
    properties.constructorParamaters = params;
  }

  return properties;
}

/** Builds hash-relevant component data once for sorting, WL refinement, and hashing. */
function buildStructuralComponentData(
  components: ComponentDraft[],
  childHashes?: Map<number, string>,
): Map<ComponentDraft, StructuralComponentData> {
  const data = new Map<ComponentDraft, StructuralComponentData>();

  for (const comp of components) {
    const properties = buildStructuralProperties(comp, childHashes);
    const signature = JSON.stringify({
      type: comp.type,
      bitWidth: comp.bitWidth,
      ports: comp._canonicalPortNames.join(","),
      properties,
    });
    data.set(comp, { properties, signature });
  }

  return data;
}

/**
 * Compresses unique structural signatures into shorter colour representations.
 */
function compressColourSignatures(signatures: string[]): string[] {
  const unique = [...new Set(signatures)].sort();
  const signatureToColour = new Map(
    unique.map((signature, index) => [signature, index.toString(36)]),
  );

  return signatures.map((signature) => signatureToColour.get(signature)!);
}

function sameColours(a: string[], b: string[]): boolean {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }

  return true;
}

/** Builds the port-labelled component/net incidence graph used by WL refinement. */
function buildWLTopology(components: ComponentDraft[]) {
  // Maps each net root to all component ports connected to that electrical net.
  const portsByNet = new Map<number, ConnectedPort[]>();

  // Maps each component index to that component's connected ports.
  const portsByComponent: ConnectedPort[][] = components.map(() => []);

  for (let componentIndex = 0; componentIndex < components.length; componentIndex++) {
    for (const portName of components[componentIndex]._canonicalPortNames) {
      const endpoint = {
        componentIndex,
        portName,
        netRoot: components[componentIndex]._connections[portName],
      };
      portsByComponent[componentIndex].push(endpoint);
      const connectedPorts = portsByNet.get(endpoint.netRoot) ?? [];
      connectedPorts.push(endpoint);
      portsByNet.set(endpoint.netRoot, connectedPorts);
    }
  }

  return { portsByNet, portsByComponent };
}

/**
 * Computes a structural fingerprint for all components using the Weisfeiler-Lehman algorithm to handle symmetries.
 */
function wlFingerprint(
  components: ComponentDraft[],
  structuralData: Map<ComponentDraft, StructuralComponentData>,
): string[] {
  const initialSignatures = components.map((comp) => structuralData.get(comp)!.signature);

  let colours = compressColourSignatures(initialSignatures);
  const { portsByNet, portsByComponent } = buildWLTopology(components);

  for (let round = 0; round < components.length; round++) {
    const signatures: string[] = [];

    for (let i = 0; i < components.length; i++) {
      const incidentSignatures = portsByComponent[i].map((port) => {
        const connectedPorts: string[] = [];
        for (const otherPort of portsByNet.get(port.netRoot)!) {
          if (otherPort !== port) {
            connectedPorts.push(`${colours[otherPort.componentIndex]}@${otherPort.portName}`);
          }
        }
        connectedPorts.sort();
        return `${port.portName}=[${connectedPorts.join(",")}]`;
      });
      signatures[i] = `${colours[i]}|${incidentSignatures.join(";")}`;
    }

    const nextColours = compressColourSignatures(signatures);
    if (sameColours(colours, nextColours)) return nextColours;
    colours = nextColours;
  }

  return colours;
}

/**
 * Sorts components into a canonical order based on their properties, connections, and structural fingerprints.
 */
function canonicalSort(
  components: ComponentDraft[],
  structuralData: Map<ComponentDraft, StructuralComponentData>,
) {
  if (components.length < 2) return;

  const interfaceComponents: ComponentDraft[] = [];
  const nonInterfaceComponents: ComponentDraft[] = [];
  for (const comp of components) {
    if (comp.type === "Input" || comp.type === "Output") {
      interfaceComponents.push(comp);
    } else {
      nonInterfaceComponents.push(comp);
    }
  }

  const fpMap = new Map<ComponentDraft, string>();
  const wlColours = wlFingerprint(components, structuralData);
  for (let i = 0; i < components.length; i++) {
    const comp = components[i];
    if (comp.type !== "Input" && comp.type !== "Output") {
      fpMap.set(comp, `${structuralData.get(comp)!.signature}|${wlColours[i]}`);
    }
  }

  if (nonInterfaceComponents.length >= 2) {
    nonInterfaceComponents.sort((a, b) => {
      const aFp = fpMap.get(a)!;
      const bFp = fpMap.get(b)!;
      return aFp < bFp ? -1 : aFp > bFp ? 1 : 0;
    });
  }

  components.splice(0, components.length, ...interfaceComponents, ...nonInterfaceComponents);
}

/**
 * Assigns unique deterministic structural IDs to components after they have been canonically sorted.
 */
function assignComponentIds(
  components: ComponentDraft[],
): asserts components is FinalComponentDraft[] {
  const countByType: Record<string, number> = {};
  for (let i = 0; i < components.length; i++) {
    const comp = components[i];
    const count = countByType[comp.type] ?? 0;
    comp.id = `${comp.type}_${count}`;
    countByType[comp.type] = count + 1;
  }
}

/** Attaches component port references to nets already found from real wire topology. */
function attachComponentPorts(components: FinalComponentDraft[], netMap: Map<number, NetDraft>) {
  const portRoots: number[] = [];

  for (let componentIndex = 0; componentIndex < components.length; componentIndex++) {
    const comp = components[componentIndex];
    const portNames = comp._canonicalPortNames;

    for (let portIndex = 0; portIndex < portNames.length; portIndex++) {
      const portName = portNames[portIndex];
      const groupRoot = comp._connections[portName];
      const net = netMap.get(groupRoot);
      if (net === undefined) continue;

      // Add each net root once, when its first component port is attached.
      if (net.connections.length === 0) portRoots.push(groupRoot);
      net.connections.push(`${comp.id}.${portName}`);
    }
  }

  return portRoots;
}

/** Builds canonical nets, emitting structural nets before visual-only topology. */
function buildCanonicalNets(netMap: Map<number, NetDraft>, portRoots: number[]) {
  const nets: CanonicalNet[] = [];
  const finalNetIds = new Map<number, string>();

  // orderedRoots[0] : structural nets
  // orderedRoots[1] : dangling and standalone visual-only nets.
  const orderedRoots: number[][] = [[], []];
  for (const root of portRoots) {
    orderedRoots[netMap.get(root)!.connections.length >= 2 ? 0 : 1].push(root);
  }
  for (const [root, net] of netMap) {
    if (net.connections.length === 0) orderedRoots[1].push(root);
  }

  for (const roots of orderedRoots) {
    for (const root of roots) {
      const net = netMap.get(root)!;

      const netEntry: CanonicalNet = {
        id: `net_${nets.length}`,
        bitWidth: net.bitWidth,
        connections: net.connections,
      };

      finalNetIds.set(root, netEntry.id);
      nets.push(netEntry);
    }
  }

  return { nets, finalNetIds };
}

/**
 * Converts the live wire graph into routing data that can be saved and rebuilt later.
 * Component ports are stored by name, while wire junctions use numbers local to their net.
 */
function buildWireJunctions(
  allNodes: Node[],
  nodeIndexMap: NodeIndexMap,
  uf: UnionFind,
  composedNetMap: Map<number, string>,
  components: FinalComponentDraft[],
) {
  const endpoints = new Map<number, RoutingEndpoint>();

  for (const comp of components) {
    const instance = comp._instance;
    for (const portName of comp._portNames) {
      const port = instance[portName] as Node | Node[];

      if (Array.isArray(port)) {
        for (let portIndex = 0; portIndex < port.length; portIndex++) {
          endpoints.set(nodeIndexMap.get(port[portIndex])!, `${comp.id}.${portName}_${portIndex}`);
        }
      } else {
        endpoints.set(nodeIndexMap.get(port)!, `${comp.id}.${portName}`);
      }
    }
  }

  // Keeping track of how many component ports each net has.
  const portCountByNet = new Map<string, number>();
  for (const nodeIndex of endpoints.keys()) {
    const netId = composedNetMap.get(uf.find(nodeIndex));
    if (netId !== undefined) portCountByNet.set(netId, (portCountByNet.get(netId) ?? 0) + 1);
  }

  // Group the visible bend and junction nodes by the canonical net they belong to.
  const intermediatesByNet = new Map<string, Array<{ node: Node; idx: number }>>();
  for (let i = 0; i < allNodes.length; i++) {
    const node = allNodes[i];
    if (node.type !== 2) continue;

    const root = uf.find(i);
    const finalNetId = composedNetMap.get(root);
    if (finalNetId === undefined) continue;

    if (!intermediatesByNet.has(finalNetId)) intermediatesByNet.set(finalNetId, []);
    intermediatesByNet.get(finalNetId)!.push({ node, idx: i });
  }

  const result: Record<string, IntermediateNet> = {};

  // Number intermediate nodes from zero inside each net and keep their canvas positions.
  for (const [finalNetId, intermediates] of intermediatesByNet) {
    const nodes: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < intermediates.length; i++) {
      endpoints.set(intermediates[i].idx, i);
      nodes.push({ x: intermediates[i].node.x, y: intermediates[i].node.y });
    }
    result[finalNetId] = { nodes, connections: [] };
  }
  // Create an empty routing entry for a multi-port net that has no intermediate nodes.
  for (const [netId, portCount] of portCountByNet) {
    if (portCount > 2 && result[netId] === undefined) {
      result[netId] = { nodes: [], connections: [] };
    }
  }

  const endpointKey = (endpoint: RoutingEndpoint) =>
    typeof endpoint === "number" ? `node:${endpoint}` : `port:${endpoint}`;
  const seenConnections = new Set<string>();

  // Translate every live wire into a connection between named ports or numbered junctions.
  for (let i = 0; i < allNodes.length; i++) {
    const finalNetId = composedNetMap.get(uf.find(i));
    const routing = finalNetId === undefined ? undefined : result[finalNetId];
    if (!routing) continue;

    const from = endpoints.get(i);
    if (from === undefined) {
      throw new Error(`[canonical] Routed net ${finalNetId} contains an unmapped node`);
    }

    for (const neighbour of allNodes[i].connections!) {
      const neighbourIndex = nodeIndexMap.get(neighbour);
      // SubCircuit ports have wireless links into a child localScope; those nodes are not canvas routing.
      if (neighbourIndex === undefined) continue;

      const to = endpoints.get(neighbourIndex);
      if (to === undefined) {
        throw new Error(`[canonical] Routed net ${finalNetId} contains an unmapped connection`);
      }

      const fromKey = endpointKey(from);
      const toKey = endpointKey(to);
      const connection: RoutingConnection = fromKey <= toKey ? [from, to] : [to, from];
      const connectionKey = `${finalNetId}|${endpointKey(connection[0])}|${endpointKey(connection[1])}`;
      if (seenConnections.has(connectionKey)) continue;

      seenConnections.add(connectionKey);
      routing.connections.push(connection);
    }
  }

  return result;
}

/**
 * Extracts and maps component coordinates and visual intermediate routing into a complete canonical layout.
 */
function buildLayout(
  scope: Scope,
  allNodes: Node[],
  components: FinalComponentDraft[],
  nodeIndexMap: NodeIndexMap,
  uf: UnionFind,
  composedNetMap: Map<number, string>,
) {
  const layout: CanonicalLayout = {
    subcircuitSymbol: {
      width: scope.layout.width,
      height: scope.layout.height,
      titleX: scope.layout.title_x,
      titleY: scope.layout.title_y,
      titleEnabled: scope.layout.titleEnabled,
    },
  };

  const intermediateNodes = buildWireJunctions(
    allNodes,
    nodeIndexMap,
    uf,
    composedNetMap,
    components,
  );

  if (Object.keys(intermediateNodes).length > 0) {
    layout.intermediateNodes = intermediateNodes;
  }

  for (let i = 0; i < components.length; i++) {
    const comp = components[i];
    const position: CanonicalComponentPosition = {
      x: comp._x,
      y: comp._y,
      labelDirection: comp._labelDirection,
    };
    const portPositions: NonNullable<CanonicalComponentPosition["portPositions"]> = {};
    for (const portName of comp._portNames) {
      const port = comp._instance[portName] as Node | Node[];
      if (Array.isArray(port)) {
        for (let i = 0; i < port.length; i++) {
          portPositions[`${portName}_${i}`] = {
            x: port[i].leftx,
            y: port[i].lefty,
          };
        }
      } else {
        portPositions[portName] = { x: port.leftx, y: port.lefty };
      }
    }
    if (comp._portNames.length > 0) position.portPositions = portPositions;
    const subcircuitMetadata = comp._instance.subcircuitMetadata;
    if (
      comp._instance.canShowInSubcircuit &&
      subcircuitMetadata &&
      (subcircuitMetadata.showInSubcircuit ||
        !subcircuitMetadata.showLabelInSubcircuit ||
        subcircuitMetadata.labelDirection !== comp._labelDirection ||
        subcircuitMetadata.x !== 0 ||
        subcircuitMetadata.y !== 0)
    ) {
      position.subcircuitMetadata = { ...subcircuitMetadata };
    }
    layout[comp.id] = position;
  }

  const annotations = buildAnnotations(scope);
  if (annotations.length > 0) layout.annotations = annotations;

  return layout;
}

function buildVisual(scope: Scope) {
  return {
    canvas: {
      scale: scope.scale,
      ox: scope.ox,
      oy: scope.oy,
    },
  };
}

/**
 * Normalizes components into a standard format for the canonical JSON.
 */
function buildCanonicalComponents(components: FinalComponentDraft[]) {
  return components.map((component) => {
    const entry: CanonicalComponent = {
      id: component.id,
      type: component.type,
      bitWidth: component.bitWidth,
      properties: component.properties,
    };

    if (component.label) {
      entry.label = component.label;
    }

    if (component._state !== undefined) {
      entry.defaultState = component._state;
    }

    return entry;
  });
}

/**
 * Computes a SHA-256 hash for the given text.
 */
async function sha256(text: string): Promise<string> {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error("[canonical] crypto.subtle is unavailable");
  }

  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

// Put the below line in the console to get the json
// await (await import('/simulatorvue/v1/src/simulator/src/data/canonical.ts')).canonicaliseScope(globalScope)
export async function canonicaliseScope(
  scope: Scope,
  childHashes?: Map<number, string>,
): Promise<CanonicalScope> {
  const allNodes: Node[] = scope.allNodes!;
  const nodeIndexMap = indexNodes(allNodes);
  const { uf, netMap } = discoverNets(allNodes, nodeIndexMap);

  const components = buildComponentDrafts(scope, uf, nodeIndexMap);
  const structuralData = buildStructuralComponentData(components, childHashes);
  canonicalSort(components, structuralData);
  assignComponentIds(components);

  const portRoots = attachComponentPorts(components, netMap);
  const { nets, finalNetIds } = buildCanonicalNets(netMap, portRoots);

  const layout = buildLayout(scope, allNodes, components, nodeIndexMap, uf, finalNetIds);
  const visual = buildVisual(scope);
  const canonicalComponents = buildCanonicalComponents(components);

  const netlist = { components: canonicalComponents, nets };

  const canonicalHash = await sha256(
    JSON.stringify({
      netlist: {
        components: canonicalComponents.map((component, index) => ({
          id: component.id,
          type: component.type,
          bitWidth: component.bitWidth,
          properties: structuralData.get(components[index])!.properties,
        })),
        // Dangling and standalone wires are visual data and do not alter circuit behaviour.
        nets: nets.filter((net) => net.connections.length >= 2),
      },
    }),
  );

  console.log(`[canonical] Canonical hash for scope "${scope.name}": ${canonicalHash}`);

  const verilogMetadata = {
    isVerilogCircuit: scope.verilogMetadata.isVerilogCircuit,
    isMainCircuit: scope.verilogMetadata.isMainCircuit,
    code: scope.verilogMetadata.code,
    subCircuitScopeIds: [...scope.verilogMetadata.subCircuitScopeIds],
  };

  const projectMetadata = {
    name: scope.name || "Untitled",
    restrictedElementsUsed: [...scope.restrictedCircuitElementsUsed],
  };

  return {
    canonicalHash,
    projectMetadata,
    netlist,
    layout,
    visual,
    verilogMetadata,
  };
}

export function khansAlgorithm(
  indegreeMap: Map<number, number>,
  dependents: Map<number, number[]>,
): number[] | null {
  const queue: number[] = [];
  let head = 0;

  for (const [circuitId, indegree] of indegreeMap.entries()) {
    if (indegree === 0) queue.push(circuitId);
  }

  queue.sort((a, b) => a - b);

  const topologicalOrder: number[] = [];

  while (queue.length > head) {
    const dequeuedScope = queue[head++]!;
    topologicalOrder.push(dequeuedScope);

    for (const dep of dependents.get(dequeuedScope) ?? []) {
      const newIndegree = indegreeMap.get(dep)! - 1;
      indegreeMap.set(dep, newIndegree);
      if (newIndegree === 0) {
        queue.push(dep);
        const tail = queue.splice(head);
        tail.sort((a, b) => a - b);
        queue.push(...tail);
      }
    }
  }

  return topologicalOrder.length === indegreeMap.size ? topologicalOrder : null;
}

function buildProjectMetadata(scopes: Scope[], topologicalOrder: number[]) {
  const scopeIds = new Set(topologicalOrder.map(String));
  const orderedTabs: string[] = [];
  const seen = new Set<string>();

  for (const circuit of SimulatorStore().circuit_list) {
    const id = String(circuit.id);
    if (scopeIds.has(id) && !seen.has(id)) {
      seen.add(id);
      orderedTabs.push(id);
    }
  }
  // Fallback
  for (const id of topologicalOrder.map(String)) {
    if (!seen.has(id)) orderedTabs.push(id);
  }

  const activeId = String((window as Window & { globalScope?: Scope }).globalScope?.id ?? "");
  const focussedCircuit = scopeIds.has(activeId)
    ? activeId
    : String(
        scopes.find((scope) => scope.verilogMetadata.isMainCircuit)?.id ?? topologicalOrder.at(-1),
      );
  const projectStore = useProjectStore();

  return {
    name: projectStore.getProjectNameDefined ? projectStore.getProjectName : "Untitled",
    timePeriod: simulationArea.timePeriod,
    clockEnabled: simulationArea.clockEnabled,
    focussedCircuit,
    orderedTabs,
  };
}

// Put the below line in the console to get the json
// await (await import('/simulatorvue/v1/src/simulator/src/data/canonical.ts')).canonicaliseProject(Object.values((await import('/simulatorvue/v1/src/simulator/src/circuit.ts')).scopeList))
export async function canonicaliseProject(
  scopeOrScopes: Scope | Scope[],
): Promise<CanonicalProject> {
  const scopes = Array.isArray(scopeOrScopes) ? scopeOrScopes : [scopeOrScopes];
  const pairs = new Map<number, CanonicalScope>();
  const circuitHashes: string[] = [];
  const inDegreeMap = new Map<number, number>();
  const dependents = new Map<number, number[]>();
  const scopeById = new Map<number, Scope>();

  for (const scope of scopes) {
    const id = Number(scope.id);
    if (scopeById.has(id)) {
      throw new Error(`[canonical] Duplicate scope ID ${id}`);
    }
    inDegreeMap.set(id, 0);
    dependents.set(id, []);
    scopeById.set(id, scope);
  }

  for (const [id, scope] of scopeById) {
    const dependencies = new Set<number>();
    for (const sub of scope.SubCircuit ?? []) {
      const targetId = Number(sub.id);
      if (!inDegreeMap.has(targetId)) {
        throw new Error(
          `[canonical] Scope ${id} references missing SubCircuit scope ${String(sub.id)}`,
        );
      }
      dependencies.add(targetId);
    }
    for (const targetId of dependencies) {
      dependents.get(targetId)!.push(id);
    }
    inDegreeMap.set(id, dependencies.size);
  }

  const topologicalOrder = khansAlgorithm(inDegreeMap, dependents);
  if (!topologicalOrder) {
    throw new Error("A cyclic dependency was detected among the subcircuits!");
  }

  const childHashes = new Map<number, string>();
  for (const id of topologicalOrder) {
    const scope = scopeById.get(id)!;
    const circuit = await canonicaliseScope(scope, childHashes);
    pairs.set(id, circuit);
    childHashes.set(id, circuit.canonicalHash);
    circuitHashes.push(circuit.canonicalHash);
  }

  const circuits: Record<string, CanonicalScope> = {};
  for (const id of topologicalOrder) {
    circuits[String(id)] = pairs.get(id)!;
  }

  const projectHash = await sha256(JSON.stringify([...circuitHashes].sort()));
  const projectMetadata = buildProjectMetadata(scopes, topologicalOrder);
  console.log(`[canonical] Canonical hash for project: ${projectHash}`);

  return {
    formatVersion: "v1",
    canonicalHash: projectHash,
    projectMetadata,
    circuits,
  };
}

// Typed window extension — eliminates unsafe casting / implicit any on window
declare global {
  interface Window {
    canonicaliseProject?: typeof canonicaliseProject;
  }
}
if (typeof window !== "undefined") {
  window.canonicaliseProject = canonicaliseProject;
}
