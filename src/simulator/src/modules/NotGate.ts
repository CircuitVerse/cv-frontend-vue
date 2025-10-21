import CircuitElement from '../circuitElement'
import Node, { findNode } from '../node'
import { simulationArea } from '../simulationArea'
import { correctWidth, lineTo, moveTo, drawCircle2 } from '../canvasApi'
import { colors } from '../themer/themer'

declare const globalScope: any

declare global {
    interface Node {
        verilogLabel?: string
        value?: number
        queueProperties?: {
            inQueue: boolean
            time?: number
            index?: number
        }
    }
}

/**
 * @class
 * NotGate
 * @extends CircuitElement
 * @param {number} x - x coordinate of element.
 * @param {number} y - y coordinate of element.
 * @param {Scope=} scope - Cirucit on which element is drawn
 * @param {string=} dir - direction of element
 * @param {number=} bitWidth - bit width per node.
 * @category modules
 */
export default class NotGate extends CircuitElement {
    rectangleObject: boolean
    inp1: Node
    output1: Node

    constructor(
        x: number,
        y: number,
        scope: any = globalScope,
        dir: string = 'RIGHT',
        bitWidth: number = 1
    ) {
        super(x, y, scope, dir, bitWidth)
        this.rectangleObject = false
        this.setDimensions(15, 15)
        this.inp1 = new Node(-10, 0, 0, this)
        this.output1 = new Node(20, 0, 1, this)
    }

    /**
     * @memberof NotGate
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
     * @memberof NotGate
     * resolve output values based on inputData
     */
    resolve() {
        if (this.isResolvable() === false) {
            return
        }
        this.output1.value =
            ((~this.inp1.value >>> 0) << (32 - this.bitWidth)) >>>
            (32 - this.bitWidth)
        simulationArea.simulationQueue.add(this.output1 as any, 0)
    }

    /**
     * @memberof NotGate
     * function to draw element
     */
    customDraw() {
        const ctx = simulationArea.context
        if (ctx === null) return

        ctx.strokeStyle = colors['stroke']
        ctx.lineWidth = correctWidth(3)

        const xx = this.x
        const yy = this.y
        ctx.beginPath()
        ctx.fillStyle = colors['fill']
        moveTo(ctx, -10, -10, xx, yy, this.direction)
        lineTo(ctx, 10, 0, xx, yy, this.direction)
        lineTo(ctx, -10, 10, xx, yy, this.direction)
        ctx.closePath()
        if (
            (this.hover && !simulationArea.shiftDown) ||
            simulationArea.lastSelected === this ||
            simulationArea.multipleObjectSelections.includes(this)
        )
            ctx.fillStyle = colors['hover_select']
        ctx.fill()
        ctx.stroke()
        ctx.beginPath()
        drawCircle2(ctx, 15, 0, 5, xx, yy, this.direction)
        ctx.stroke()
    }

    generateVerilog() {
        return (
            'assign ' +
            (this.output1 as any).verilogLabel +
            ' = ~' +
            (this.inp1 as any).verilogLabel +
            ';'
        )
    }
}

Object.defineProperty(NotGate.prototype, 'tooltipText', {
    value: 'Not Gate ToolTip : Inverts the input digital signal.',
    writable: true,
})

Object.defineProperty(NotGate.prototype, 'helplink', {
    value: 'https://docs.circuitverse.org/#/chapter4/4gates?id=not-gate',
    writable: true,
})

Object.defineProperty(NotGate.prototype, 'objectType', {
    value: 'NotGate',
    writable: true,
})

Object.defineProperty(NotGate.prototype, 'verilogType', {
    value: 'not',
    writable: true,
})
