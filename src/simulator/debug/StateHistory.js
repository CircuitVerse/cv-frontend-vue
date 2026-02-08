/* eslint-disable import/no-cycle */
import { simulationArea } from '../src/simulationArea'

/**
 * Manages simulation state history for time-travel debugging
 * @category debug
 */
export class StateHistory {
    constructor(maxSize = 1000) {
        this.states = []
        this.currentIndex = -1
        this.maxSize = maxSize
    }

    /**
     * Capture current circuit state from global scope
     * @param {Scope} scope - the circuit scope to capture
     * @returns {Object} The captured state
     */
    captureState(scope) {
        const state = {
            timestamp: Date.now(),
            timePeriod: simulationArea.timePeriod,
            clockState: simulationArea.clockState,
            scopeId: scope.id,
            scopeName: scope.name,
            // Capture all circuit elements
            elements: this.captureElements(scope),
            // Capture all nodes
            nodes: this.captureNodes(scope),
            // Capture all wires
            wires: this.captureWires(scope),
        }

        // If we're not at the end, remove future states (branching timeline)
        if (this.currentIndex < this.states.length - 1) {
            this.states = this.states.slice(0, this.currentIndex + 1)
        }

        this.states.push(state)

        // Maintain max size (circular buffer)
        if (this.states.length > this.maxSize) {
            this.states.shift()
        } else {
            this.currentIndex++
        }

        return state
    }

    /**
     * Capture all circuit elements (gates, components, etc.)
     */
    captureElements(scope) {
        const elements = {}
        
        // Iterate through all module types
        const moduleList = [
            'Input', 'Output', 'AndGate', 'OrGate', 'NotGate', 'XorGate',
            'NandGate', 'NorGate', 'XnorGate', 'Clock', 'Splitter',
            'SubCircuit', 'ConstantVal', 'BitSelector', 'Multiplexer',
            'Demultiplexer', 'TTY', 'Rom', 'Ram', 'Adder',
            // Add more as needed from your moduleList
        ]

        moduleList.forEach(moduleType => {
            if (scope[moduleType] && Array.isArray(scope[moduleType])) {
                elements[moduleType] = scope[moduleType].map(elem => ({
                    x: elem.x,
                    y: elem.y,
                    direction: elem.direction,
                    objectType: elem.objectType,
                    // Capture output values
                    output: elem.output ? elem.output.value : undefined,
                    // Capture input values
                    inp: elem.inp ? elem.inp.map(i => ({
                        value: i.value,
                        bitWidth: i.bitWidth
                    })) : [],
                    // Capture state for sequential elements
                    state: elem.state,
                    bitWidth: elem.bitWidth,
                    // For subcircuits
                    subcircuitId: elem.id,
                    // For special elements
                    data: elem.data, // ROM/RAM data
                    enable: elem.enable, // Clock enable
                }))
            }
        })

        return elements
    }

    /**
     * Capture all nodes (connection points)
     */
    captureNodes(scope) {
        if (!scope.allNodes) return []
        
        return scope.allNodes.map(node => ({
            x: node.x,
            y: node.y,
            value: node.value,
            bitWidth: node.bitWidth,
            type: node.type,
            highlighted: node.highlighted || false,
        }))
    }

    /**
     * Capture all wires
     */
    captureWires(scope) {
        if (!scope.wires) return []
        
        return scope.wires.map(wire => ({
            x1: wire.x1,
            y1: wire.y1,
            x2: wire.x2,
            y2: wire.y2,
            value: wire.node1 ? wire.node1.value : undefined,
            bitWidth: wire.node1 ? wire.node1.bitWidth : undefined,
        }))
    }

    /**
     * Restore a previously captured state
     */
    restoreState(scope, state) {
        if (!state) return

        // Restore clock state
        simulationArea.clockState = state.clockState

        // Restore elements
        this.restoreElements(scope, state.elements)

        // Restore nodes
        this.restoreNodes(scope, state.nodes)

        // Note: Wires are derived from nodes, so they update automatically
    }

    /**
     * Restore element states
     */
    restoreElements(scope, elementsState) {
        for (const moduleType in elementsState) {
            if (scope[moduleType] && Array.isArray(scope[moduleType])) {
                elementsState[moduleType].forEach((elemState, index) => {
                    if (scope[moduleType][index]) {
                        const elem = scope[moduleType][index]
                        
                        // Restore output
                        if (elem.output && elemState.output !== undefined) {
                            elem.output.value = elemState.output
                        }

                        // Restore inputs
                        if (elem.inp && elemState.inp) {
                            elemState.inp.forEach((inputState, i) => {
                                if (elem.inp[i]) {
                                    elem.inp[i].value = inputState.value
                                }
                            })
                        }

                        // Restore state for sequential elements
                        if (elemState.state !== undefined) {
                            elem.state = elemState.state
                        }

                        // Restore data for ROM/RAM
                        if (elemState.data !== undefined) {
                            elem.data = elemState.data
                        }
                    }
                })
            }
        }
    }

    /**
     * Restore node states
     */
    restoreNodes(scope, nodesState) {
        if (!scope.allNodes || !nodesState) return

        nodesState.forEach((nodeState, index) => {
            if (scope.allNodes[index]) {
                scope.allNodes[index].value = nodeState.value
                scope.allNodes[index].highlighted = nodeState.highlighted
            }
        })
    }

    stepBack() {
        if (this.canStepBack()) {
            this.currentIndex--
            return this.states[this.currentIndex]
        }
        return null
    }

    stepForward() {
        if (this.canStepForward()) {
            this.currentIndex++
            return this.states[this.currentIndex]
        }
        return null
    }

    canStepBack() {
        return this.currentIndex > 0
    }

    canStepForward() {
        return this.currentIndex < this.states.length - 1
    }

    getCurrentState() {
        return this.states[this.currentIndex]
    }

    getAllStates() {
        return this.states
    }

    clear() {
        this.states = []
        this.currentIndex = -1
    }

    jumpToState(index) {
        if (index >= 0 && index < this.states.length) {
            this.currentIndex = index
            return this.states[index]
        }
        return null
    }
}

// Export singleton instance
export const stateHistory = new StateHistory()