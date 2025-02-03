//Contains the interfaces to be exported in the src/simulator/src/data folder

export interface Scope {
    layout: any;
    verilogMetadata: any;
    allNodes: any[];
    testbenchData: any;
    id: string;
    name: string;
    SubCircuit: any[];
    nodes: any[];
    backups: string[];
    history: any[];
    timeStamp: number;
    restrictedCircuitElementsUsed: any;
    [key: string]: any; 
}

export interface SaveableObject {
    saveObject(): any;
}