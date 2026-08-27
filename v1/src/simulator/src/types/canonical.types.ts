/** Directions supported by simulator components and labels. */
export type Direction = "LEFT" | "RIGHT" | "UP" | "DOWN";

/** Values supported inside canonical component properties. */
export type CanonicalJsonValue =
  | string
  | number
  | boolean
  | null // Neutralises visual-only constructor parameters in the structural hash.
  | CanonicalJsonValue[]
  | { [key: string]: CanonicalJsonValue };

/** Properties shared by every live component used by this pipeline. */
export interface ComponentInstance {
  label: string;
  propagationDelay: number;
  labelDirection: Direction;
}

/** Constructor and component-specific values required to rebuild a component. */
export type CanonicalComponentProperties = {
  constructorParamaters?: CanonicalJsonValue[]; // RGBLed has no constructor parameters.
  propagationDelay: number; // Zero is the simulator default and is not emitted.
};

/** Canonical data required to rebuild and hash one component. */
export interface CanonicalComponent {
  id: string;
  type: string;
  label?: string; // Restores visible text; absent when the label is blank.
  bitWidth: number;
  properties: CanonicalComponentProperties;
  defaultState?: number; // Restores stateful components; absent for stateless components.
}

/** Canonical connectivity and width data; visual-only nets may have fewer than two ports. */
export interface CanonicalNet {
  id: string;
  bitWidth: number;
  connections: string[];
}

/** One endpoint in a visual routing graph. */
export type RoutingEndpoint = number | string;

/** One undirected edge in a visual routing graph. */
export type RoutingConnection = [RoutingEndpoint, RoutingEndpoint];

/** Visual routing data for one net with intermediate nodes. */
export interface IntermediateNet {
  nodes: Array<{ x: number; y: number }>;
  connections: RoutingConnection[];
}

/** Visual size and title position of a scope used as a subcircuit. */
export interface SubcircuitSymbol {
  width: number;
  height: number;
  titleX: number;
  titleY: number;
  titleEnabled: boolean;
}

/** Visual position of one component. */
export interface CanonicalComponentPosition {
  x: number;
  y: number;
  labelDirection: Direction;
  portPositions?: Record<string, { x: number; y: number }>;
  subcircuitMetadata?: {
    showInSubcircuit: boolean;
    showLabelInSubcircuit: boolean;
    labelDirection: Direction;
    x: number;
    y: number;
  };
}

/** Visual-only simulator annotation excluded from the structural hash. */
export interface CanonicalAnnotation {
  type: string;
  label?: string;
  x: number;
  y: number;
  labelDirection: Direction;
  propagationDelay: number;
  constructorParamaters: CanonicalJsonValue[];
}

/** Visual component and wire layout excluded from the structural hash. */
export interface CanonicalLayout {
  [componentId: string]:
    | CanonicalComponentPosition
    | CanonicalAnnotation[]
    | Record<string, IntermediateNet>
    | SubcircuitSymbol
    | undefined;
  intermediateNodes?: Record<string, IntermediateNet>;
  annotations?: CanonicalAnnotation[];
  subcircuitSymbol: SubcircuitSymbol;
}

/** Canonical serialized data for one simulator scope. */
export interface CanonicalScope {
  canonicalHash: string;
  projectMetadata: {
    name: string;
    restrictedElementsUsed: string[];
  };
  netlist: {
    components: CanonicalComponent[];
    nets: CanonicalNet[];
  };
  layout: CanonicalLayout;
  visual?: {
    canvas?: {
      scale: number;
      ox: number;
      oy: number;
    };
  };
  verilogMetadata: {
    isVerilogCircuit: boolean;
    isMainCircuit: boolean;
    code: string;
    subCircuitScopeIds: string[];
  };
}

/** Canonical serialized data for a complete simulator project. */
export interface CanonicalProject {
  formatVersion: "v1";
  canonicalHash: string;
  projectMetadata: {
    name: string;
    timePeriod: number;
    clockEnabled: boolean;
    focussedCircuit: string;
    orderedTabs: string[];
  };
  circuits: Record<string, CanonicalScope>;
}
