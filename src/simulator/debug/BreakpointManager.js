/* eslint-disable import/no-cycle */

/**
 * Manages breakpoints for debugging
 * @category debug
 */
export class BreakpointManager {
    constructor() {
        this.breakpoints = []
        this.nextId = 1
        this.triggeredBreakpoint = null
    }

    /**
     * Add a new breakpoint
     * @param {Object} config - Breakpoint configuration
     * @returns {Object} The created breakpoint
     */
    addBreakpoint(config) {
        const breakpoint = {
            id: this.nextId++,
            enabled: true,
            hitCount: 0,
            description: this.generateDescription(config),
            ...config
        }
        this.breakpoints.push(breakpoint)
        return breakpoint
    }

    /**
     * Generate human-readable description
     */
    generateDescription(config) {
        if (config.wireId) {
            const conditionText = {
                'equals': `= ${config.value}`,
                'changes': 'changes',
                'risingEdge': '0→1',
                'fallingEdge': '1→0'
            }[config.condition] || config.condition
            
            return `Wire ${config.wireId} ${conditionText}`
        }
        if (config.componentId) {
            return `Component ${config.componentId} ${config.condition}`
        }
        return 'Custom breakpoint'
    }

    /**
     * Remove a breakpoint by ID
     */
    removeBreakpoint(id) {
        this.breakpoints = this.breakpoints.filter(bp => bp.id !== id)
    }

    /**
     * Toggle breakpoint enabled/disabled
     */
    toggleBreakpoint(id) {
        const bp = this.breakpoints.find(bp => bp.id === id)
        if (bp) {
            bp.enabled = !bp.enabled
        }
    }

    /**
     * Check all breakpoints - returns triggered breakpoint or null
     * @param {Scope} scope - Circuit scope
     * @param {Object} previousState - Previous circuit state for change detection
     */
    checkBreakpoints(scope, previousState) {
        for (const bp of this.breakpoints) {
            if (!bp.enabled) continue

            if (this.evaluateBreakpoint(bp, scope, previousState)) {
                bp.hitCount++
                this.triggeredBreakpoint = bp
                return bp
            }
        }
        return null
    }

    /**
     * Evaluate a single breakpoint
     */
    evaluateBreakpoint(bp, scope, previousState) {
        // Wire-based breakpoints
        if (bp.wireId !== undefined) {
            return this.evaluateWireBreakpoint(bp, scope, previousState)
        }

        // Component-based breakpoints
        if (bp.componentId !== undefined) {
            return this.evaluateComponentBreakpoint(bp, scope)
        }

        // Custom function breakpoint
        if (bp.customCondition) {
            return bp.customCondition(scope)
        }

        return false
    }

    /**
     * Evaluate wire breakpoint
     */
    evaluateWireBreakpoint(bp, scope, previousState) {
        // Find the wire - check all nodes in the scope
        let currentValue = null
        let previousValue = null

        // Check all nodes to find matching wire/node
        if (scope.allNodes) {
            for (let i = 0; i < scope.allNodes.length; i++) {
                // Simple ID check - you might need to adjust based on your wire ID system
                if (i === bp.wireId || scope.allNodes[i].id === bp.wireId) {
                    currentValue = scope.allNodes[i].value
                    
                    // Get previous value from state
                    if (previousState && previousState.nodes && previousState.nodes[i]) {
                        previousValue = previousState.nodes[i].value
                    }
                    break
                }
            }
        }

        if (currentValue === null) return false

        // Evaluate condition
        switch (bp.condition) {
            case 'equals':
                return currentValue === bp.value

            case 'changes':
                return previousValue !== null && previousValue !== currentValue

            case 'risingEdge':
                return previousValue === 0 && currentValue === 1

            case 'fallingEdge':
                return previousValue === 1 && currentValue === 0

            case 'greaterThan':
                return currentValue > bp.value

            case 'lessThan':
                return currentValue < bp.value

            default:
                return false
        }
    }

    /**
     * Evaluate component breakpoint
     */
    evaluateComponentBreakpoint(bp, scope) {
        // Find component by ID
        // You'll need to adjust this based on how components are stored
        const moduleTypes = ['Input', 'Output', 'AndGate', 'OrGate', /* add more */]
        
        for (const moduleType of moduleTypes) {
            if (scope[moduleType]) {
                for (const component of scope[moduleType]) {
                    if (component.id === bp.componentId) {
                        // Check output value
                        if (bp.condition === 'outputEquals' && component.output) {
                            return component.output.value === bp.value
                        }
                    }
                }
            }
        }

        return false
    }

    /**
     * Get all breakpoints
     */
    getAllBreakpoints() {
        return this.breakpoints
    }

    /**
     * Clear all breakpoints
     */
    clear() {
        this.breakpoints = []
        this.triggeredBreakpoint = null
    }

    /**
     * Get the last triggered breakpoint
     */
    getTriggeredBreakpoint() {
        return this.triggeredBreakpoint
    }

    /**
     * Clear triggered state
     */
    clearTriggered() {
        this.triggeredBreakpoint = null
    }
}

// Export singleton instance
export const breakpointManager = new BreakpointManager()