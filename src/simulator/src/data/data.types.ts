export interface LayoutData {
    width: number;
    height: number;
}

export interface VerilogMetadata {
    code: string;
}

export interface TestbenchData {
    testCases: TestCase[];
}

interface TestCase {
    inputs: Record<string, boolean>;
    outputs: Record<string, boolean>;
}

export interface RestrictedCircuitElements {
    [elementName: string]: boolean;
}

export interface Scope {
    layout: LayoutData;
    verilogMetadata: VerilogMetadata;
    allNodes: Node[];
    testbenchData: TestbenchData;
    id: string;
    name: string;
    SubCircuit: SubCircuit[];
    nodes: Node[];
    backups: string[];
    history: unknown[];
    timeStamp: number;
    restrictedCircuitElementsUsed: RestrictedCircuitElements;
    [key: string]: unknown;
}

interface SubCircuit {
    removeConnections(): void;
    makeConnections(): void;
    saveObject(): SavedSubCircuit;
}

interface SavedSubCircuit {
    id: string;
}

export interface SaveableObject {
    saveObject(): unknown;
}
interface Node extends SaveableObject {
   id: string;
   connections: string[];
}