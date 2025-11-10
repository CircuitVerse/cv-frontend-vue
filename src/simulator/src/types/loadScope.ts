// Define a generic interface for circuit elements
export interface CircuitElement {
    x: number;
    y: number;
    label?: string;
    labelDirection?: string;
    propagationDelay?: number;
    fixDirection: () => void;
    subcircuitMetadata?: SubCircuitMetadata;
    layoutProperties?: { 
        x: number;
        y: number;
        id: string;
    };
}

// Define an interface for custom data of circuit elements
export interface CustomData {
    constructorParamaters?: unknown[];
    values?: Record<string, unknown>;
    nodes?: Record<string, NodeConnection | NodeConnection[]>;
}

// Define an interface for node connections
export interface NodeConnection {
    id: number;
    scopeId: string;
}

// Define an interface for module data
export interface ModuleData {
    objectType: string;
    x: number;
    y: number;
    label?: string;
    labelDirection?: string;
    propagationDelay?: number;
    customData: CustomData;
    subcircuitMetadata?: SubCircuitMetadata;
}

// Define an interface for subcircuit metadata
export interface SubCircuitMetadata {
    [key: string]: unknown;
}

// Define an interface for node data
interface NodeData extends Node {
    id: string;
    type: number;
    parent: { objectType: string };
    delete?: () => void;
}

// Define an interface for scope (circuit)
export interface Scope {
    id: string;
    name: string;
    allNodes: NodeData[];
    wires: { updateData: (scope: Scope) => void }[];
    restrictedCircuitElementsUsed?: string[];
    verilogMetadata?: VerilogMetadata;
    layout?: Layout;
    Input: CircuitElement[];
    Output: CircuitElement[];
    testbenchData?: TestbenchData;
    centerFocus(isCentered: boolean): void;
}

// Define an interface for Verilog metadata
export interface VerilogMetadata {
    isVerilogCircuit: boolean;
    isMainCircuit: boolean;
}



// Define an interface for layout data
export interface Layout {
    width: number;
    height: number;
    title_x: number;
    title_y: number;
    titleEnabled?: boolean;
} 

export interface TestbenchData {
    testData: any; // Define more specific type if you know the structure
    currentGroup: string;
    currentCase: string;
}

// Define an interface for the entire project data
export interface ProjectData {
    name: string;
    projectId?: string;
    scopes: Scope[];
    orderedTabs?: string[];
    focussedCircuit?: string;
    timePeriod?: number;
    clockEnabled?: boolean;
    allNodes: NodeData[];
    restrictedCircuitElementsUsed?: string[];
    verilogMetadata?: VerilogMetadata;
    testbenchData?: TestbenchData;
    layout?: Layout;
}
