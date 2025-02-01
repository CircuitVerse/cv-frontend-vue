export interface VerilogMetadata {
    code: string;
    subCircuitScopeIds: string[];
}

export interface GlobalScope {
    verilogMetadata: VerilogMetadata;
    id: string;
    root: CircuitElement;
    initialize(): void;
}

export interface CircuitElement {
    inputNodes: Node[];
    outputNodes: Node[];
    data: CircuitData;
}

export interface CircuitData {
    Input: { label: string }[];
    Output: { label: string }[];
}

export interface YosysDevice {
    type: string;
    celltype?: string;
}

export interface YosysConnector {
    from: { id: string; port: string };
    to: { id: string; port: string };
}

export interface YosysJSON {
    subcircuits: { [key: string]: YosysJSON };
    devices: { [key: string]: YosysDevice };
    connectors: { [key: string]: YosysConnector };
    name: string;
}

export interface SimulatorMobileStore {
    isVerilog: { value: boolean };
}

export interface Node {
    verilogLabel?: string;
    parent: {
        verilogLabel: string;
    };
    label?: string;
    connect(node: Node): void;
}