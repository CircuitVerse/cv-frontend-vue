import modules from "../modules";
import { newCircuit, resetScopeList, switchCircuit } from "../circuit";
import type Scope from "../circuit";
import { SimulatorStore } from "#/store/SimulatorStore/SimulatorStore";
import {
  canonicaliseScope,
  canonicaliseProject,
  khansAlgorithm,
  STATEFUL_DEFAULT_STATE,
} from "./canonical";
import type {
  CanonicalScope,
  CanonicalAnnotation,
  CanonicalLayout,
  CanonicalComponent,
  CanonicalComponentPosition,
  IntermediateNet,
  CanonicalJsonValue,
  CanonicalNet,
  CanonicalProject,
  ComponentInstance,
  RoutingEndpoint,
} from "../types/canonical.types";
import { updateSimulationSet, updateCanvasSet, gridUpdateSet, scheduleUpdate } from "../engine";
import Node from "../node";
import SubCircuit from "../subcircuit";
import plotArea from "../plotArea";
import { simulationArea } from "../simulationArea";
import { useProjectStore } from "#/store/projectStore";

/** Constructor shared by component classes registered in modules.js. */
type ComponentConstructor = new (
  x: number,
  y: number,
  scope: Scope,
  ...rest: CanonicalJsonValue[]
) => ComponentInstance;

type ValidationResult = { valid: true; errors: [] } | { valid: false; errors: string[] };

export type ImportResult = {
  success: boolean;
  imported: number;
  errors: string[];
};

// TODO: Replace with JSON Schema validation (deferred).
/** Validates a canonical circuit JSON against the expected schema. Currently a no-op stub. */
export function validateCanonicalJson(_circuitData: CanonicalScope): ValidationResult {
  return { valid: true, errors: [] };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Returns constructor parameters emitted by customSave(). */
function getConstructorParams(properties: CanonicalComponent["properties"]): CanonicalJsonValue[] {
  const params = properties.constructorParamaters;
  return Array.isArray(params) ? params : [];
}

/** Constructs all component instances from the canonical JSON and returns them in a map keyed by component ID. */
function buildComponents(
  scope: Scope,
  components: CanonicalComponent[],
  layout: CanonicalLayout,
  scopeMap: Map<number, Scope>,
): { instanceMap: Map<string, ComponentInstance>; errors: string[] } {
  const instanceMap = new Map<string, ComponentInstance>();
  const errors: string[] = [];
  // modules.js is untyped and stores constructors by component name.
  const registry = modules as Record<string, ComponentConstructor | undefined>;

  for (let i = 0; i < components.length; i++) {
    const { id, type, label, properties } = components[i];
    const position = layout[id] as CanonicalComponentPosition;

    let instance: ComponentInstance;

    if (type === "SubCircuit") {
      const subcircuitId = Number(getConstructorParams(properties)[0]);
      if (!scopeMap.has(subcircuitId)) {
        errors.push(`SubCircuit "${id}": scope ${subcircuitId} not found`);
        continue;
      }

      try {
        instance = new SubCircuit(
          position.x,
          position.y,
          scope,
          String(subcircuitId),
        ) as ComponentInstance;
      } catch (err) {
        errors.push(`SubCircuit "${id}": ${errorMessage(err)}`);
        continue;
      }
    } else {
      const Constructor = registry[type];
      if (typeof Constructor !== "function") {
        errors.push(`"${id}": unknown type "${type}"`);
        continue;
      }

      const constructorArgs = getConstructorParams(properties);

      try {
        instance = new Constructor(position.x, position.y, scope, ...constructorArgs);
      } catch (err) {
        errors.push(`"${id}" (${type}): ${errorMessage(err)}`);
        continue;
      }
    }

    instance.label = label ?? "";

    instance.propagationDelay = properties.propagationDelay;

    instance.labelDirection = position.labelDirection;

    const metadata = position.subcircuitMetadata;
    if (metadata) {
      Reflect.set(instance, "subcircuitMetadata", { ...metadata });
    } else if (Reflect.get(instance, "canShowInSubcircuit")) {
      Reflect.get(instance, "subcircuitMetadata").labelDirection = position.labelDirection;
    }

    instanceMap.set(id, instance);
  }

  for (const comp of components) {
    const positions = (layout[comp.id] as CanonicalComponentPosition).portPositions;
    if (positions === undefined) continue;
    for (const [portName, point] of Object.entries(positions)) {
      const node = resolvePortNode(`${comp.id}.${portName}`, instanceMap);
      if (!node) {
        errors.push(`"${comp.id}.${portName}": port not found`);
        continue;
      }
      node.leftx = point.x;
      node.lefty = point.y;
      node.updateRotation();
    }
  }

  return { instanceMap, errors };
}

function buildAnnotations(scope: Scope, annotations?: CanonicalAnnotation[]): string[] {
  const errors: string[] = [];
  if (annotations === undefined) return errors;

  const registry = modules as Record<string, ComponentConstructor | undefined>;

  for (let i = 0; i < annotations.length; i++) {
    const annotation = annotations[i];
    const Constructor = registry[annotation.type];
    if (typeof Constructor !== "function") {
      errors.push(`Annotation at index ${i}: unknown type "${annotation.type}"`);
      continue;
    }

    try {
      const instance = new Constructor(
        annotation.x,
        annotation.y,
        scope,
        ...annotation.constructorParamaters,
      );
      instance.label = annotation.label ?? "";
      instance.labelDirection = annotation.labelDirection;
      instance.propagationDelay = annotation.propagationDelay;
    } catch (err) {
      errors.push(`Annotation at index ${i} (${annotation.type}): ${errorMessage(err)}`);
    }
  }

  return errors;
}

/** Resolves a "ComponentId.portName" reference string to a live Node on the constructed instance. */
function resolvePortNode(
  portRef: string,
  instanceMap: Map<string, ComponentInstance>,
): Node | null {
  const dotIdx = portRef.indexOf(".");
  if (dotIdx === -1) return null;

  const compId = portRef.substring(0, dotIdx);
  const portName = portRef.substring(dotIdx + 1);

  const instance = instanceMap.get(compId);
  if (!instance) {
    console.warn(`[importCanonical] resolvePortNode: no instance for "${compId}"`);
    return null;
  }

  // Try array port (e.g. "inp_2" → instance["inp"][2])
  const lastUnderscoreIdx = portName.lastIndexOf("_");
  if (lastUnderscoreIdx > 0) {
    const base = portName.substring(0, lastUnderscoreIdx);
    const idx = Number(portName.substring(lastUnderscoreIdx + 1));
    const ports = Reflect.get(instance, base);

    if (Array.isArray(ports)) {
      return (ports[idx] as Node | undefined) ?? null;
    }
  }

  return (Reflect.get(instance, portName) as Node | undefined) ?? null;
}

function routingEndpointLabel(endpoint: RoutingEndpoint): string {
  return typeof endpoint === "number" ? `node ${endpoint}` : `port "${endpoint}"`;
}

function resolveRoutingEndpoint(
  endpoint: RoutingEndpoint,
  junctionNodes: Node[],
  instanceMap: Map<string, ComponentInstance>,
): Node | null {
  if (typeof endpoint === "number") {
    return junctionNodes[endpoint] ?? null;
  }
  return resolvePortNode(endpoint, instanceMap);
}

/** Wires simple nets as port chains; explicit routing is always authoritative when present. */
function wireComponents(
  instanceMap: Map<string, ComponentInstance>,
  nets: CanonicalNet[],
  intermediateNodesByNet?: Record<string, IntermediateNet>,
): string[] {
  const errors: string[] = [];

  for (let i = 0; i < nets.length; i++) {
    const net = nets[i];
    if (intermediateNodesByNet?.[net.id]) continue;

    const portNodes: Node[] = [];
    for (let j = 0; j < net.connections.length; j++) {
      const node = resolvePortNode(net.connections[j], instanceMap);
      if (node === null) {
        errors.push(`net "${net.id}": cannot resolve "${net.connections[j]}"`);
      } else {
        portNodes.push(node);
      }
    }

    if (portNodes.length < 2) continue;

    // Chain: port[0]↔port[1]↔port[2]…
    for (let j = 1; j < portNodes.length; j++) {
      try {
        portNodes[j - 1].connect(portNodes[j]);
      } catch {
        errors.push(
          `Wire failed on net "${net.id}": ` + `${net.connections[j - 1]} ↔ ${net.connections[j]}`,
        );
      }
    }
  }
  return errors;
}

/** Restores saved default state values (e.g. FlipFlop initial value) from the canonical JSON onto constructed instances. */
function restoreDefaultState(
  instanceMap: Map<string, ComponentInstance>,
  components: CanonicalComponent[],
): string[] {
  const errors: string[] = [];

  for (const comp of components) {
    if (comp.defaultState === undefined) continue;

    const instance = instanceMap.get(comp.id);
    if (instance === undefined) {
      errors.push(`"${comp.id}" component was not built`);
      continue;
    }

    const stateProp = STATEFUL_DEFAULT_STATE[comp.type];
    if (stateProp === undefined) {
      errors.push(`"${comp.id}" (${comp.type}): defaultState is not supported`);
      continue;
    }

    Reflect.set(instance, stateProp, comp.defaultState);
  }

  return errors;
}

/** Creates junction nodes and restores intermediate routing nodes from the canonical layout data. */
function restoreIntermediateNodes(
  scope: Scope,
  intermediateNodes: Record<string, IntermediateNet>,
  instanceMap: Map<string, ComponentInstance>,
  nets: CanonicalNet[],
): string[] {
  const errors: string[] = [];

  const netMap = new Map(nets.map((net) => [net.id, net]));

  for (const [netId, routing] of Object.entries(intermediateNodes)) {
    const { nodes: junctionPoints } = routing;
    const net = netMap.get(netId);

    if (!net) {
      errors.push(`intermediateNodes references unknown net "${netId}"`);
      continue;
    }
    const junctionNodes: Node[] = [];

    for (let i = 0; i < junctionPoints.length; i++) {
      const point = junctionPoints[i];
      // node.js makes TypeScript infer bitWidth as undefined even though its JSDoc and runtime accept a number.
      const node = Reflect.construct(Node, [point.x, point.y, 2, scope.root, net.bitWidth]) as Node;
      junctionNodes.push(node);
    }

    const { connections } = routing;
    for (let i = 0; i < connections.length; i++) {
      const [firstEndpoint, secondEndpoint] = connections[i];

      const firstNode = resolveRoutingEndpoint(firstEndpoint, junctionNodes, instanceMap);
      if (!firstNode) {
        errors.push(
          `Routing for net "${netId}" cannot resolve first endpoint ${routingEndpointLabel(firstEndpoint)}`,
        );
        continue;
      }

      const secondNode = resolveRoutingEndpoint(secondEndpoint, junctionNodes, instanceMap);
      if (!secondNode) {
        errors.push(
          `Routing for net "${netId}" cannot resolve second endpoint ${routingEndpointLabel(secondEndpoint)}`,
        );
        continue;
      }

      try {
        firstNode.connect(secondNode);
      } catch {
        errors.push(
          `Routing connection failed for net "${netId}" ` +
            `(${routingEndpointLabel(firstEndpoint)} ↔ ${routingEndpointLabel(secondEndpoint)})`,
        );
      }
    }
  }
  return errors;
}

/** Copies visual metadata from the canonical JSON back onto the scope object. */
function restoreScopeMetadata(scope: Scope, circuitData: CanonicalScope): void {
  scope.name = circuitData.projectMetadata.name;
  scope.restrictedCircuitElementsUsed = [...circuitData.projectMetadata.restrictedElementsUsed];

  const canvas = circuitData.visual?.canvas;
  if (canvas) {
    const { scale, ox, oy } = canvas;
    scope.scale = scale;
    scope.ox = ox;
    scope.oy = oy;
  } else {
    scope.centerFocus(false);
  }

  const sym = circuitData.layout.subcircuitSymbol;
  scope.layout = {
    width: sym.width,
    height: sym.height,
    title_x: sym.titleX,
    title_y: sym.titleY,
    titleEnabled: sym.titleEnabled,
  };

  scope.verilogMetadata = {
    ...circuitData.verilogMetadata,
    subCircuitScopeIds: [...circuitData.verilogMetadata.subCircuitScopeIds],
  };
}

/** Re-exports the imported scope and compares its canonical hash to the original */
async function verifyRoundTrip(
  scope: Scope,
  expectedScope: CanonicalScope,
  originalChildHashes?: Map<number, string>,
): Promise<boolean> {
  const reExported = await canonicaliseScope(scope, originalChildHashes);
  const match = reExported.canonicalHash === expectedScope.canonicalHash;

  const header =
    "[importCanonical] Round-trip check\n" +
    `  scopeId:       ${String(scope.id)}\n` +
    `  expected hash: ${expectedScope.canonicalHash}\n` +
    `  actual hash:   ${reExported.canonicalHash}\n` +
    `  result:        ${match ? "PASS" : "FAIL"}`;

  console.log(header);
  return match;
}

/** Imports a single circuit's components, wiring, default state, and metadata into the given scope. */
async function importSingleScope(
  circuitData: CanonicalScope,
  scope: Scope,
  scopeMap: Map<number, Scope>,
  originalChildHashes?: Map<number, string>,
): Promise<string[]> {
  const { components, nets } = circuitData.netlist;
  const { layout } = circuitData;

  const { instanceMap, errors: buildErrors } = buildComponents(scope, components, layout, scopeMap);

  if (buildErrors.length > 0) {
    return buildErrors;
  }

  const annotationErrors = buildAnnotations(scope, layout.annotations);

  const wireErrors = wireComponents(instanceMap, nets, layout.intermediateNodes);
  const stateErrors = restoreDefaultState(instanceMap, components);

  const routingErrors = layout.intermediateNodes
    ? restoreIntermediateNodes(scope, layout.intermediateNodes, instanceMap, nets)
    : [];

  restoreScopeMetadata(scope, circuitData);

  const allErrors = [...annotationErrors, ...wireErrors, ...stateErrors, ...routingErrors];

  if (allErrors.length === 0) {
    const hashMatch = await verifyRoundTrip(scope, circuitData, originalChildHashes);
    if (!hashMatch) {
      allErrors.push(`Round-trip hash mismatch for scope ${String(scope.id)}`);
    }
  }

  return allErrors;
}

function computeImportOrder(circuits: Record<string, CanonicalScope>): number[] {
  const inDegreeMap = new Map<number, number>();
  const dependents = new Map<number, number[]>();
  const scopeIds = new Set<number>();

  for (const id of Object.keys(circuits)) {
    const circuitId = Number(id);
    scopeIds.add(circuitId);
    dependents.set(circuitId, []);
  }

  for (const [idStr, circuit] of Object.entries(circuits)) {
    const circuitId = Number(idStr);

    const subcircuitRefs = new Set<number>();
    for (const comp of circuit.netlist.components) {
      if (comp.type !== "SubCircuit") continue;
      const targetId = Number(getConstructorParams(comp.properties)[0]);
      if (!scopeIds.has(targetId)) {
        throw new Error(
          `Circuit ${circuitId} references missing SubCircuit scope ${String(targetId)}`,
        );
      }
      subcircuitRefs.add(targetId);
    }

    for (const targetId of subcircuitRefs) {
      dependents.get(targetId)!.push(circuitId);
    }

    inDegreeMap.set(circuitId, subcircuitRefs.size);
  }

  const topologicalOrder = khansAlgorithm(inDegreeMap, dependents);
  if (!topologicalOrder) {
    throw new Error("A cyclic dependency was detected among the subcircuits!");
  }
  return topologicalOrder;
}

export async function importCanonical(json: CanonicalProject): Promise<ImportResult> {
  const results: ImportResult = { success: false, imported: 0, errors: [] };

  if (!json.circuits || typeof json.circuits !== "object") {
    results.errors.push("Missing circuits object in JSON");
    return results;
  }

  if (Object.keys(json.circuits).length === 0) {
    results.errors.push("No circuits found in JSON");
    return results;
  }

  let topologicalOrder: number[];
  try {
    topologicalOrder = computeImportOrder(json.circuits);
  } catch (err) {
    results.errors.push(errorMessage(err));
    return results;
  }

  const hostCircuitId = json.projectMetadata.focussedCircuit;
  if (!json.circuits[hostCircuitId]) {
    results.errors.push(`Focused circuit "${hostCircuitId}" was not found`);
    return results;
  }

  resetScopeList();
  const scopeMap = new Map<number, Scope>();

  const originalChildHashes = new Map<number, string>();
  for (const cid of topologicalOrder) {
    originalChildHashes.set(cid, json.circuits[String(cid)].canonicalHash);
  }

  for (const canonicalId of topologicalOrder) {
    const circuitData = json.circuits[String(canonicalId)];

    const validation = validateCanonicalJson(circuitData);
    if (!validation.valid) {
      results.errors.push(`[${canonicalId}] validation: ${validation.errors.join(", ")}`);
      continue;
    }

    const currentScope = newCircuit(
      circuitData.projectMetadata.name,
      String(canonicalId),
      circuitData.verilogMetadata.isVerilogCircuit,
      circuitData.verilogMetadata.isMainCircuit,
    );
    if (!currentScope) {
      results.errors.push(`[${canonicalId}] Failed to create scope`);
      continue;
    }

    scopeMap.set(canonicalId, currentScope);

    const importErrors = await importSingleScope(
      circuitData,
      currentScope,
      scopeMap,
      originalChildHashes,
    );
    if (importErrors.length === 0) {
      results.imported++;
    }
    for (const err of importErrors) {
      results.errors.push(`[${canonicalId}] ${err}`);
    }
  }
  results.success = results.errors.length === 0;

  if (results.success) {
    try {
      const projectResult = await canonicaliseProject(Array.from(scopeMap.values()));
      const match = projectResult.canonicalHash === json.canonicalHash;
      console.log(
        `[importCanonical] Project Round-trip check\n` +
          `  Expected project hash: ${json.canonicalHash}\n` +
          `  Actual project hash:   ${projectResult.canonicalHash}\n` +
          `  Result:                ${match ? "PASS" : "FAIL"}`,
      );
      if (!match) {
        results.errors.push(
          `Project round-trip hash mismatch. Expected: ${json.canonicalHash}, got: ${projectResult.canonicalHash}`,
        );
        results.success = false;
      }
    } catch {
      results.errors.push("Project round-trip check failed: could not re-export");
      results.success = false;
    }
  }

  if (results.success) {
    const order = new Map(json.projectMetadata.orderedTabs.map((id, index) => [id, index]));
    const rank = (id: string | number) => order.get(String(id)) ?? Number.MAX_SAFE_INTEGER;
    const circuitList = SimulatorStore().circuit_list as Array<{ id: string | number }>;
    circuitList.sort((a, b) => rank(a.id) - rank(b.id));
    useProjectStore().setProjectName(json.projectMetadata.name);
    simulationArea.changeClockTime(json.projectMetadata.timePeriod);
    simulationArea.clockEnabled = json.projectMetadata.clockEnabled;

    switchCircuit(hostCircuitId);
    updateSimulationSet(true);
    updateCanvasSet(true);
    gridUpdateSet(true);
    if (!embed) plotArea.reset();
    scheduleUpdate(1);
  }

  return results;
}

declare global {
  interface Window {
    importCanonical?: typeof importCanonical;
    validateCanonicalJson?: typeof validateCanonicalJson;
  }
}

window.importCanonical = importCanonical;
window.validateCanonicalJson = validateCanonicalJson;
