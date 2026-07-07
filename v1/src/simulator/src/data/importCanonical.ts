import modules from "../modules";
import { newCircuit, switchCircuit, scopeList } from "../circuit";
import { SimulatorStore } from "#/store/SimulatorStore/SimulatorStore";
import {
  canonicaliseScope,
  canonicaliseProject,
  khansAlgorithm,
  STATEFUL_DEFAULT_STATE,
} from "./canonical";
import type {
  CanonicalComponent,
  CanonicalNet,
  IntermediateNet,
  CanonicalLayout,
  CanonicalScope,
  CanonicalProject,
} from "./canonical";
import { resetup } from "../setup";
import {
  updateSimulationSet,
  updateCanvasSet,
  updateSubcircuitSet,
  forceResetNodesSet,
  gridUpdateSet,
  scheduleUpdate,
  renderCanvas,
  update,
} from "../engine";
import Node from "../node";
import SubCircuit from "../subcircuit";

type ScopeLike = {
  id?: string | number;
  name?: string;
  timeStamp?: string | number | null;
  allNodes: unknown[];
  scale?: number;
  ox?: number;
  oy?: number;
  layout?: {
    width?: number;
    height?: number;
    titleX?: number;
    titleY?: number;
    title_x?: number;
    title_y?: number;
    titleEnabled?: boolean;
  };
  root: unknown;
  initialize: () => void;
  [key: string]: unknown;
};

type PortNode = {
  connect(other: PortNode): void;
};

type ComponentConstructor = new (
  x: number,
  y: number,
  scope: ScopeLike,
  ...rest: unknown[]
) => ComponentInstance;

type ComponentInstance = {
  label: string;
  propagationDelay?: number;
  labelDirection?: "LEFT" | "RIGHT" | "UP" | "DOWN";
  state?: unknown;
  [key: string]: unknown;
};

type NodeConstructor = new (
  x: number,
  y: number,
  type: number,
  parent: unknown,
  bitWidth?: number,
) => PortNode;

type ValidationResult = { valid: true; errors: [] } | { valid: false; errors: string[] };

type ImportResult = {
  success: boolean;
  imported: number;
  errors: string[];
};

// TODO: Replace with JSON Schema validation (deferred).
/** Validates a canonical circuit JSON against the expected schema. Currently a no-op stub. */
export function validateCanonicalJson(_circuitData: CanonicalScope): ValidationResult {
  return { valid: true, errors: [] };
}

type ComponentLayout = {
  x: number;
  y: number;
  labelDirection?: "LEFT" | "RIGHT" | "UP" | "DOWN";
  layoutProperties?: unknown;
};

/** Extracts component position and layout properties from the CanonicalLayout, or null if absent. */
function getComponentLayout(
  layout: CanonicalLayout | undefined,
  id: string,
): ComponentLayout | null {
  if (id === "intermediateNodes" || id === "subcircuitSymbol") {
    return { x: 0, y: 0 };
  }
  const pos = layout?.[id];
  if (
    pos != null &&
    typeof pos === "object" &&
    !Array.isArray(pos) &&
    !("width" in pos && "height" in pos && "titleEnabled" in pos) &&
    !("nodes" in pos)
  ) {
    const p = pos as Record<string, unknown>;
    return {
      x: (p.x as number) ?? 0,
      y: (p.y as number) ?? 0,
      labelDirection: p.labelDirection as "LEFT" | "RIGHT" | "UP" | "DOWN" | undefined,
      layoutProperties: p.layoutProperties,
    };
  }
  return null;
}

/** Constructs all component instances from the canonical JSON and returns them in a map keyed by component ID. */
function buildComponents(
  scope: ScopeLike,
  components: CanonicalComponent[],
  layout: CanonicalLayout | undefined,
  scopeMap: Map<number, ScopeLike>,
): { instanceMap: Map<string, ComponentInstance>; errors: string[] } {
  const instanceMap = new Map<string, ComponentInstance>();
  const errors: string[] = [];

  for (let i = 0; i < components.length; i++) {
    const { id, type, bitWidth, label, properties, connections } = components[i];
    let pos = getComponentLayout(layout, id);
    if (!pos) {
      // No layout entry for this component.
      // ELK.js auto-layout (planned) will assign positions later
      // For now default to the origin.
      pos = { x: 0, y: 0 };
    }

    let instance: ComponentInstance;

    if (type === "SubCircuit") {
      const subcircuitId = Number((properties?.constructorParamaters as unknown[])?.[0]);
      if (!scopeMap.has(subcircuitId)) {
        errors.push(`SubCircuit "${id}": scope ${subcircuitId} not found`);
        continue;
      }

      const Constructor =
        (modules as Record<string, ComponentConstructor | undefined>)["SubCircuit"] ||
        (SubCircuit as unknown as ComponentConstructor);
      try {
        instance = new Constructor(pos.x, pos.y, scope, String(subcircuitId));
      } catch (err) {
        errors.push(`SubCircuit "${id}": ${err instanceof Error ? err.message : String(err)}`);
        continue;
      }
    } else {
      const Constructor = (modules as Record<string, ComponentConstructor | undefined>)[type];
      if (typeof Constructor !== "function") {
        errors.push(`"${id}": unknown type "${type}"`);
        continue;
      }

      const constructorArgs: unknown[] = Array.isArray(properties?.constructorParamaters)
        ? [...(properties.constructorParamaters as unknown[])]
        : ["RIGHT", bitWidth];

      if (
        (type === "Input" || type === "Output") &&
        pos.layoutProperties !== undefined &&
        constructorArgs.length < 3
      ) {
        constructorArgs.push(pos.layoutProperties);
      }

      try {
        instance = new Constructor(pos.x, pos.y, scope, ...constructorArgs);
      } catch (err) {
        errors.push(`"${id}" (${type}): ${err instanceof Error ? err.message : String(err)}`);
        continue;
      }
    }

    instance.label = label;

    if (typeof properties?.propagationDelay === "number") {
      instance.propagationDelay = properties.propagationDelay;
    }

    if (pos.labelDirection !== undefined) {
      instance.labelDirection = pos.labelDirection;
    }

    // Restore extra component data (Flag.name, Tunnel.id, etc.) from JSON "properties" onto the live instance object.
    if (properties) {
      const portBaseNames = new Set<string>();

      for (const portKey of Object.keys(connections)) {
        portBaseNames.add(portKey);
        const underIdx = portKey.lastIndexOf("_");
        if (underIdx > 0 && !isNaN(Number(portKey.substring(underIdx + 1)))) {
          portBaseNames.add(portKey.substring(0, underIdx));
        }
      }

      for (const [key, value] of Object.entries(properties)) {
        if (key === "constructorParamaters" || key === "propagationDelay") continue;
        if (portBaseNames.has(key)) continue;
        if (value !== undefined) {
          (instance as Record<string, unknown>)[key] = value;
        }
      }
    }

    instanceMap.set(id, instance);
  }

  return { instanceMap, errors };
}

/** Resolves a "ComponentId.portName" reference string to a live PortNode on the constructed instance. */
function resolvePortNode(
  portRef: string,
  instanceMap: Map<string, ComponentInstance>,
): PortNode | null {
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
    const idx = parseInt(portName.substring(lastUnderscoreIdx + 1), 10);

    if (!isNaN(idx) && idx >= 0 && Array.isArray(instance[base])) {
      const node = (instance[base] as PortNode[])[idx];
      if (node) return node;
      console.warn(`[importCanonical] Array port "${portRef}" index out of range`);
      return null;
    }
  }

  // Scalar port fallback
  const node = instance[portName] as PortNode | undefined;
  if (node) return node;

  console.warn(`[importCanonical] Port not found: "${portName}" on "${compId}"`);
  return null;
}

/** Wires component ports together by connecting them through shared nets. Skips nets that have intermediate routing. */
function wireComponents(
  instanceMap: Map<string, ComponentInstance>,
  nets: CanonicalNet[],
  intermediateNodesByNet?: Record<string, IntermediateNet>,
): string[] {
  const errors: string[] = [];
  // Nets with intermediate nodes are wired separately
  const graphRoutedNetIds = new Set<string>();
  if (intermediateNodesByNet) {
    for (const netId of Object.keys(intermediateNodesByNet)) {
      const routing = intermediateNodesByNet[netId];
      if (routing && Array.isArray(routing.nodes) && routing.nodes.length > 0) {
        graphRoutedNetIds.add(netId);
      }
    }
  }

  for (let i = 0; i < nets.length; i++) {
    const net = nets[i];
    if (graphRoutedNetIds.has(net.id)) continue;

    const portNodes: PortNode[] = [];
    for (let j = 0; j < net.connections.length; j++) {
      const node = resolvePortNode(net.connections[j], instanceMap);
      if (node !== null) portNodes.push(node);
    }

    if (portNodes.length < 2) {
      if (portNodes.length === 1) {
        errors.push(`net "${net.id}": only 1 node resolved, skipping`);
      }
      continue;
    }

    // Chain: port[0]↔port[1]↔port[2]…
    for (let j = 1; j < portNodes.length; j++) {
      try {
        portNodes[j - 1].connect(portNodes[j]);
      } catch {
        errors.push(
          `Wire failed on net "${net.id}": ` +
            `${net.connections[j - 1]} ↔ ${net.connections[j]}`,
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
): void {
  for (let i = 0; i < components.length; i++) {
    const compData = components[i];
    if (compData.defaultState === undefined) continue;

    const instance = instanceMap.get(compData.id);
    if (!instance) continue;

    const stateProp = STATEFUL_DEFAULT_STATE[compData.type];
    if (stateProp) {
      (instance as Record<string, unknown>)[stateProp] = compData.defaultState;
    }
  }
}

/** Creates junction nodes and restores intermediate routing nodes from the canonical layout data. */
function restoreIntermediateNodes(
  scope: ScopeLike,
  intermediateNodes: Record<string, IntermediateNet>,
  instanceMap: Map<string, ComponentInstance>,
  nets: CanonicalNet[],
): string[] {
  const errors: string[] = [];
  if (!intermediateNodes || Object.keys(intermediateNodes).length === 0) return errors;

  const netBitWidthMap = new Map<string, number>();
  for (let i = 0; i < nets.length; i++) {
    netBitWidthMap.set(nets[i].id, nets[i].bitWidth);
  }

  const NodeCon = Node as unknown as NodeConstructor;

  for (const [netId, routing] of Object.entries(intermediateNodes)) {
    const { nodes: junctionPoints, edges, portConnections } = routing;
    if (!junctionPoints || junctionPoints.length === 0) continue;

    const netBitWidth = netBitWidthMap.get(netId);
    const junctionNodes: (PortNode | null)[] = [];

    for (let i = 0; i < junctionPoints.length; i++) {
      const point = junctionPoints[i];
      try {
        const node: PortNode =
          netBitWidth !== undefined
            ? new NodeCon(point.x, point.y, 2, scope.root, netBitWidth)
            : new NodeCon(point.x, point.y, 2, scope.root);
        junctionNodes.push(node);
      } catch {
        errors.push(`Failed to create junction at (${point.x},${point.y}) for ${netId}`);
        junctionNodes.push(null);
      }
    }

    // Junction-to-junction connections
    for (let i = 0; i < edges.length; i++) {
      const [fromId, toId] = edges[i];
      const fromNode = junctionNodes[fromId];
      const toNode = junctionNodes[toId];
      if (fromNode && toNode) {
        try {
          fromNode.connect(toNode);
        } catch {
          errors.push(`Junction-to-junction failed for net "${netId}" (${fromId} → ${toId})`);
        }
      }
    }

    // Port-to-junction connections
    for (let i = 0; i < portConnections.length; i++) {
      const { portRef, nodeId } = portConnections[i];
      const junctionNode = junctionNodes[nodeId];
      if (!junctionNode) continue;

      const portNode = resolvePortNode(portRef, instanceMap);
      if (!portNode) {
        errors.push(`portConnection: cannot resolve "${portRef}"`);
        continue;
      }

      try {
        portNode.connect(junctionNode);
      } catch {
        errors.push(`Port-to-junction failed for net "${netId}" ("${portRef}" → node ${nodeId})`);
      }
    }
  }
  return errors;
}

/** Copies visual metadata from the canonical JSON back onto the scope object. */
function restoreScopeMetadata(scope: ScopeLike, circuitData: CanonicalScope): void {
  if (circuitData.projectMetadata.name) {
    scope.name = circuitData.projectMetadata.name;
  }

  const { scale, ox, oy } = circuitData.visual.canvas;
  scope.scale = scale;
  scope.ox = ox;
  scope.oy = oy;

  if (circuitData.layout.subcircuitSymbol) {
    const sym = circuitData.layout.subcircuitSymbol;
    scope.layout = {
      width: sym.width,
      height: sym.height,
      titleX: sym.titleX,
      titleY: sym.titleY,
      title_x: sym.titleX,
      title_y: sym.titleY,
      titleEnabled: sym.titleEnabled,
    };
  }

  if (circuitData.verilogMetadata) {
    scope.verilogMetadata = circuitData.verilogMetadata;
  }
}

/** Resets the setup pipeline and triggers a full canvas redraw for the given scope. */
function refreshCanvas(scope: ScopeLike): void {
  resetup();
  renderCanvas(scope);
}

/** Re-exports the imported scope and compares its canonical hash to the original */
async function verifyRoundTrip(
  scope: ScopeLike,
  expectedScope: CanonicalScope,
  originalChildHashes?: Map<number, string>,
): Promise<boolean> {
  const reExported = await canonicaliseScope(
    scope as Parameters<typeof canonicaliseScope>[0],
    originalChildHashes,
  );
  const match = reExported.canonicalHash === expectedScope.canonicalHash;

  const header =
    "[importCanonical] Round-trip check\n" +
    `  scopeId:       ${String(scope?.id)}\n` +
    `  expected hash: ${expectedScope.canonicalHash}\n` +
    `  actual hash:   ${reExported.canonicalHash}\n` +
    `  result:        ${match ? "PASS" : "FAIL"}`;

  console.log(header);
  return match;
}

/** Imports a single circuit's components, wiring, default state, and metadata into the given scope. */
async function importSingleScope(
  circuitData: CanonicalScope,
  scope: ScopeLike,
  scopeMap: Map<number, ScopeLike>,
  originalChildHashes?: Map<number, string>,
): Promise<{ success: boolean; error?: string; buildErrors: string[] }> {
  const { components, nets } = circuitData.netlist;
  const { layout } = circuitData;

  const { instanceMap, errors: buildErrors } = buildComponents(scope, components, layout, scopeMap);

  if (components.length > 0 && instanceMap.size === 0) {
    const msg =
      buildErrors.length > 0
        ? `all components failed: ${buildErrors.join("; ")}`
        : "no components could be constructed";
    return { success: false, error: msg, buildErrors };
  }

  const wireErrors = wireComponents(instanceMap, nets, layout.intermediateNodes);
  restoreDefaultState(instanceMap, components);

  const routingErrors = layout.intermediateNodes
    ? restoreIntermediateNodes(scope, layout.intermediateNodes, instanceMap, nets)
    : [];

  restoreScopeMetadata(scope, circuitData);

  const allErrors = [...buildErrors, ...wireErrors, ...routingErrors];

  if (circuitData.canonicalHash) {
    const hashMatch = await verifyRoundTrip(scope, circuitData, originalChildHashes);
    if (!hashMatch) {
      allErrors.push(`Round-trip hash mismatch for scope ${scope.id ?? "unknown"}`);
    }
  }

  return { success: true, buildErrors: allErrors };
}

function computeImportOrder(circuits: Record<number, CanonicalScope>): number[] {
  const inDegreeMap = new Map<number, number>();
  const dependents = new Map<number, number[]>();
  const scopeIds = new Set(
    Object.keys(circuits)
      .map(Number)
      .filter((id) => !isNaN(id)),
  );

  for (const [idStr, circuit] of Object.entries(circuits)) {
    const circuitId = Number(idStr);
    if (!dependents.has(circuitId)) dependents.set(circuitId, []);

    const subcircuitRefs = [
      ...new Set(
        circuit.netlist.components
          .filter((c) => c.type === "SubCircuit")
          .map((c) => Number((c.properties.constructorParamaters as unknown[])?.[0]))
          .filter((id) => !isNaN(id) && scopeIds.has(id) && id !== circuitId),
      ),
    ];

    for (const targetId of subcircuitRefs) {
      if (!dependents.has(targetId)) dependents.set(targetId, []);
      dependents.get(targetId)!.push(circuitId);
    }

    inDegreeMap.set(circuitId, subcircuitRefs.length);
  }

  const topologicalOrder = khansAlgorithm(inDegreeMap, dependents);
  if (!topologicalOrder) {
    throw new Error("A cyclic dependency was detected among the subcircuits!");
  }
  return topologicalOrder;
}

export async function importCanonical(
  json: CanonicalProject,
  targetScope: ScopeLike | null | undefined,
): Promise<ImportResult> {
  const results: ImportResult = { success: false, imported: 0, errors: [] };

  if (!json.circuits || typeof json.circuits !== "object") {
    results.errors.push("Missing circuits object in JSON");
    return results;
  }

  if (Object.keys(json.circuits).length === 0) {
    results.errors.push("No circuits found in JSON");
    return results;
  }

  if (!targetScope) {
    results.errors.push("No target scope provided");
    return results;
  }

  let topologicalOrder: number[];
  try {
    topologicalOrder = computeImportOrder(json.circuits);
  } catch (err) {
    results.errors.push(err instanceof Error ? err.message : String(err));
    return results;
  }

  let hostCircuitId = topologicalOrder[topologicalOrder.length - 1];
  for (const canonicalId of topologicalOrder) {
    const circuit = json.circuits[canonicalId];
    const name = circuit.projectMetadata?.name;
    if (
      (name && name.toLowerCase() === "main") ||
      circuit.verilogMetadata?.isMainCircuit === true
    ) {
      hostCircuitId = canonicalId;
      break;
    }
  }

  targetScope.initialize();

  const oldTargetScopeId = targetScope.id;
  const newTargetScopeId = hostCircuitId;

  if (oldTargetScopeId !== newTargetScopeId) {
    targetScope.id = newTargetScopeId;
    (scopeList as Record<string, unknown>)[String(newTargetScopeId)] = targetScope;
  }

  const keepScopeId = String(targetScope.id);
  for (const sid of Object.keys(scopeList)) {
    if (sid !== keepScopeId) {
      delete (scopeList as Record<string, unknown>)[sid];
    }
  }
  {
    const store = SimulatorStore();
    store.circuit_list.splice(0, store.circuit_list.length);
    store.circuit_list.push({
      id: targetScope.id,
      name: targetScope.name,
    });
    if (store.activeCircuit) {
      store.activeCircuit.id = targetScope.id;
      store.activeCircuit.name = targetScope.name;
    }
  }

  const scopeMap = new Map<number, ScopeLike>();

  const originalChildHashes = new Map<number, string>();
  for (const cid of topologicalOrder) {
    const ch = json.circuits[cid]?.canonicalHash;
    if (ch) originalChildHashes.set(cid, ch);
  }

  for (const canonicalId of topologicalOrder) {
    const circuitData = json.circuits[canonicalId];

    const validation = validateCanonicalJson(circuitData);
    if (!validation.valid) {
      results.errors.push(`[${canonicalId}] validation: ${validation.errors.join(", ")}`);
      continue;
    }

    let currentScope: ScopeLike;
    if (canonicalId === hostCircuitId) {
      currentScope = targetScope;
    } else {
      const newScope = newCircuit(
        circuitData.projectMetadata.name || "Untitled",
        canonicalId as unknown as string,
        circuitData.verilogMetadata?.isVerilogCircuit ?? false,
        circuitData.verilogMetadata?.isMainCircuit ?? false,
      );
      if (!newScope) {
        results.errors.push(`[${canonicalId}] Failed to create scope — name may be empty`);
        continue;
      }
      currentScope = newScope as unknown as ScopeLike;
    }

    scopeMap.set(canonicalId, currentScope);

    const outcome = await importSingleScope(
      circuitData,
      currentScope,
      scopeMap,
      originalChildHashes,
    );
    if (!outcome.success) {
      results.errors.push(`[${canonicalId}] ${outcome.error ?? "unknown error"}`);
    } else {
      results.imported++;
    }
    for (const buildErr of outcome.buildErrors) {
      results.errors.push(`[${canonicalId}] ${buildErr}`);
    }
  }

  results.success = results.imported > 0;

  {
    const store = SimulatorStore();
    const hostIdx = store.circuit_list.findIndex(
      (c: { id: string | number; name?: string }) => String(c.id) === String(targetScope.id),
    );
    if (hostIdx !== -1) {
      store.circuit_list[hostIdx].name = targetScope.name;
    }
  }

  if (results.imported === topologicalOrder.length && json.canonicalHash) {
    try {
      const projectResult = await canonicaliseProject(
        Array.from(scopeMap.values()) as Parameters<typeof canonicaliseProject>[0],
      );
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
      }
    } catch {
      results.errors.push("Project round-trip check failed: could not re-export");
    }
  }

  if (results.success) {
    refreshCanvas(targetScope);
    switchCircuit(String(targetScope.id));
    updateSimulationSet(true);
    updateSubcircuitSet(true);
    forceResetNodesSet(true);
    updateCanvasSet(true);
    gridUpdateSet(true);
    update(targetScope, true);
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
