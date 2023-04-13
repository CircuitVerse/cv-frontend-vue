import CircuitElement from '../circuitElement'
import FANode, { findNode } from '../faNode'
import simulationArea from '../simulationArea'
import {
    correctWidth,
    fillText,
    drawCircle2,
    moveTo,
    lineTo,
} from '../canvasApi'
import { changeInputSize } from '../modules'
/**
 * @class
 * State
 * @extends CircuitElement
 * @param {number} x - x coordinate of element.
 * @param {number} y - y coordinate of element.
 * @param {Scope=} scope - Cirucit on which element is drawn
 * @param {string=} dir - direction of element

 * @category modules
 */
import { colors } from '../themer/themer'

const BASE_AZ_CHARSET = 'ABCDEFGHIKJLMNOPQRSTUVWXYZ'
function toBaseAZ(n) {
    let baseAz = ''
    do {
        baseAz = BASE_AZ_CHARSET[n % 26] + baseAz
        n = Math.floor(n / 26)
    } while (n > 0)

    return baseAz
}

let globalStateCounter = 0

export default class State extends CircuitElement {
    constructor(x, y, scope = globalScope, dir = 'RIGHT', bitWidth = 1) {
        super(x, y, scope, dir, bitWidth)
        /* this is done in this.baseSetup() now
        this.scope['State'].push(this);
        */
        this.rectangleObject = false
        this.directionFixed = true
        this.fixedBitWidth = true
        this.setDimensions(15, 15)

        this.isInitial = false
        this.isFinal = false
        this.output = ''

        this.label = toBaseAZ(globalStateCounter++)
        this.labelDirection = 'UP'
        this.inp1 = new FANode(-10, 0, 0, this, this.bitWidth, 'c0')
        this.output1 = new FANode(20, 0, 1, this, this.bitWidth, 'c1')
    }

    /**
     * @memberof State
     * fn to create save Json Data of object
     * @return {JSON}
     */
    customSave() {
        const data = {
            constructorParamaters: [this.direction, this.bitWidth],
            nodes: {
                output1: findNode(this.output1),
                inp1: findNode(this.inp1),
            },
        }
        return data
    }

    /**
     * @memberof State
     * resolve output values based on inputData
     */
    resolve() {
        if (this.isResolvable() === false) {
            return
        }
        let output =
            ((~this.inp1.value >>> 0) << (32 - this.bitWidth)) >>>
            (32 - this.bitWidth)
        output += 1
        this.output1.value =
            (output << (32 - this.bitWidth)) >>> (32 - this.bitWidth)
        simulationArea.simulationQueue.add(this.output1)
    }

    /**
     * @memberof State
     * function to draw element
     */
    customDraw() {
        var ctx = simulationArea.context
        ctx.strokeStyle = colors['stroke']
        ctx.lineWidth = correctWidth(1)
        const xx = this.x
        const yy = this.y
        ctx.beginPath()
        ctx.fillStyle = 'black'
        if (
            (this.hover && !simulationArea.shiftDown) ||
            simulationArea.lastSelected === this ||
            simulationArea.multipleObjectSelections.contains(this)
        )
            ctx.fillStyle = colors['hover_select']
        ctx.fill()
        ctx.beginPath()
        drawCircle2(ctx, 5, 0, 15, xx, yy, this.direction)
        ctx.stroke()

        if (this.isInitial) {
            ctx.beginPath()
            moveTo(ctx, -30, 0, xx, yy, this.direction)
            lineTo(ctx, -10, 0, xx, yy, this.direction)

            moveTo(ctx, -16, -4, xx, yy, this.direction)
            lineTo(ctx, -10, 0, xx, yy, this.direction)
            lineTo(ctx, -16, 4, xx, yy, this.direction)
            ctx.stroke()
        }
        if (this.isFinal) {
            ctx.beginPath()
            drawCircle2(ctx, 5, 0, 10, xx, yy, this.direction)
            ctx.stroke()
        }
    }

    setIsInitial(value) {
        this.isInitial = value
    }

    setIsFinal(value) {
        this.isFinal = value
    }

    setOutput(value) {
        this.output = value
    }

    getTransitionTable() {
        let inputSet = new Set()
        let stateTransitionMap = {}
        function addTransition(from, to, transition) {
            if (!(from in stateTransitionMap)) stateTransitionMap[from] = []
            inputSet.add(transition)
            stateTransitionMap[from].push([transition, to])
        }

        let visitedSet = new Set()
        let currentStates = [this]
        while (currentStates.length > 0) {
            let fromState = currentStates.shift()
            visitedSet.add(fromState.label)
            for (let n of fromState.nodeList) {
                let { state, transition } = findOtherEndOfWire(
                    n,
                    this.scope.wires
                )
                if (!state) continue

                if (!visitedSet.has(state.label)) currentStates.push(state)
                addTransition(fromState.label, state.label, transition)
            }
        }

        let orderedInputs = Array.from(inputSet).sort()
        let stateTable = []
        let stateTransitionMapEntries = Object.entries(stateTransitionMap).sort(
            ([a], [b]) => a.localeCompare(b)
        )
        for (let [state, transitions] of stateTransitionMapEntries) {
            let row = [state]
            for (let [input, nextState] of transitions)
                row[1 + orderedInputs.indexOf(input)] = nextState
            stateTable.push(row)
        }

        return [['State', ...orderedInputs], ...stateTable]
    }
}

// wires = [["node1", "tnode2"], ["tnode2", "node3"]]

function findOtherEndOfWire(start, wires) {
    let visitedSet = new Set()
    let node = start
    let transition = null
    while (true) {
        let nextNode = null
        for (let i = 0; i < wires.length; i++) {
            if (visitedSet.has(i)) continue
            let { node1, node2, label } = wires[i]
            if (node.id == node1.id) {
                nextNode = node2
                transition ||= label
                visitedSet.add(i)
            }
        }
        if (!nextNode) break

        node = nextNode
        if (node.parent instanceof State)
            return { state: node.parent, transition }
    }

    return { state: null, transition }
}

/**
 * @memberof State
 * Help Tip
 * @type {string}
 * @category modules
 */
State.prototype.mutableProperties = {
    isInitial: {
        name: 'Is Initial',
        type: 'checkbox',
        func: 'setIsInitial',
    },
    isFinal: {
        name: 'Is Final',
        type: 'checkbox',
        func: 'setIsFinal',
    },
    output: {
        name: 'Output',
        type: 'text',
        func: 'setOutput',
    },
    transitionTable: {
        name: 'Transition Table',
        type: 'table',
        func: 'getTransitionTable',
    },
}
State.prototype.propagationDelayFixed = true
State.prototype.tooltipText = 'Finite Automata State'
State.prototype.objectType = 'State'
