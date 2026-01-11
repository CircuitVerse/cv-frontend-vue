import CircuitElement from '../circuitElement'
import Node from '../node'

export interface SubCircuit {
    removeConnections(): void
    makeConnections(): void
}

export interface Scope {
    id: number | string
    name: string
    root: CircuitElement
    timeStamp: number
    backups: string[]
    history: string[]
    layout: {
        width: number
        height: number
        title_x: number
        title_y: number
        titleEnabled: boolean
    }
    verilogMetadata: {
        isVerilogCircuit: boolean
        isMainCircuit: boolean
        code: string
        subCircuitScopeIds: string[]
    }
    restrictedCircuitElementsUsed: any[]
    CircuitElement: any[]
    nodes: Node[]
    allNodes: Node[]
    SubCircuit: SubCircuit[]
    testbenchData: any
    ox: number
    oy: number
    scale: number
    stack: any[]
    tunnelList?: Record<string, any>
    pending?: any[]
    [key: string]: any
}
