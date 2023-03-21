import CircuitElement from '../circuitElement'
import FANode, { findNode } from '../faNode'
import simulationArea from '../simulationArea'
import { correctWidth, fillText, drawCircle2 } from '../canvasApi'
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
        this.inp1 = new FANode(-10, 0, 0, this, this.bitWidth, 'input stream')
        this.output1 = new FANode(20, 0, 1, this, this.bitWidth, "2's complement")
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
    }

    generateVerilog() {
        return `assign ${this.output1.verilogLabel} = ~${this.inp1.verilogLabel} + 1;`
    }
}

/**
 * @memberof State
 * Help Tip
 * @type {string}
 * @category modules
 */
State.prototype.mutableProperties = {
    isInitial: {
        name: 'Is Initial: ',
        type: 'checkbox',
        func: 'setIsInitial',
    },
    isFinal: {
        name: 'Is Final: ',
        type: 'checkbox',
        func: 'setIsFinal',
    },
    insertOutput: {
        name: 'Output: ',
        type: 'text',
        func: 'setInsertOutput',
    },
}
State.prototype.propagationDelayFixed = true
State.prototype.tooltipText =
    "Finite Automata State"
State.prototype.objectType = 'State'
