import CircuitElement from '../circuitElement'
import Node, { findNode } from '../node'
import { simulationArea } from '../simulationArea'
import { correctWidth, lineTo, moveTo, drawCircle2, arc } from '../canvasApi'
import { changeInputSize } from '../modules'
import { colors } from '../themer/themer'
import { gateGenerateVerilog } from '../utils'

// Import or declare globalScope
declare const globalScope: any

// Extend Node interface to include missing properties
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
 * NandGate
 * @extends CircuitElement
 * @param {number} x - x coordinate of nand Gate.
 * @param {number} y - y coordinate of nand Gate.
 * @param {Scope=} scope - Cirucit on which nand gate is drawn
 * @param {string=} dir - direction of nand Gate
 * @param {number=} inputLength - number of input nodes
 * @param {number=} bitWidth - bit width per node.
 * @category modules
 */
export default class NandGate extends CircuitElement {
    rectangleObject: boolean
    inputSize: number
    inp: Node[]
    output1: Node
    changeInputSize!: (size: number) => void

    constructor(
        x: number,
        y: number,
        scope: any = globalScope,
        dir: string = 'RIGHT',
        inputLength: number = 2,
        bitWidth: number = 1
    ) {
        super(x, y, scope, dir, bitWidth)
        this.rectangleObject = false
        this.setDimensions(15, 20)
        this.inp = []
        this.inputSize = inputLength

        // variable inputLength , node creation
        if (inputLength % 2 === 1) {
            for (let i = 0; i < inputLength / 2 - 1; i++) {
                const a = new Node(-10, -10 * (i + 1), 0, this)
                this.inp.push(a)
            }
            let a = new Node(-10, 0, 0, this)
            this.inp.push(a)
            for (let i = inputLength / 2 + 1; i < inputLength; i++) {
                a = new Node(-10, 10 * (i + 1 - inputLength / 2 - 1), 0, this)
                this.inp.push(a)
            }
        } else {
            for (let i = 0; i < inputLength / 2; i++) {
                const a = new Node(-10, -10 * (i + 1), 0, this)
                this.inp.push(a)
            }
            for (let i = inputLength / 2; i < inputLength; i++) {
                const a = new Node(-10, 10 * (i + 1 - inputLength / 2), 0, this)
                this.inp.push(a)
            }
        }
        this.output1 = new Node(30, 0, 1, this)
    }

    /**
     * @memberof NandGate
     * fn to create save Json Data of object
     * @return {JSON}
     */
    customSave() {
        const data = {
            constructorParamaters: [
                this.direction,
                this.inputSize,
                this.bitWidth,
            ],
            nodes: {
                inp: this.inp.map(findNode),
                output1: findNode(this.output1),
            },
        }
        return data
    }

    /**
     * @memberof NandGate
     * resolve output values based on inputData
     */
    resolve() {
        let result = this.inp[0].value || 0
        if (this.isResolvable() === false) {
            return
        }
        for (let i = 1; i < this.inputSize; i++)
            result &= this.inp[i].value || 0
        result =
            ((~result >>> 0) << (32 - this.bitWidth)) >>> (32 - this.bitWidth)
        this.output1.value = result
        simulationArea.simulationQueue.add(this.output1 as any, 0)
    }

    /**
     * @memberof NandGate
     * function to draw nand Gate
     */
    customDraw() {
        const ctx = simulationArea.context
        if (ctx === null) return

        ctx.beginPath()
        ctx.lineWidth = correctWidth(3)
        ctx.strokeStyle = colors['stroke']
        ctx.fillStyle = colors['fill']
        const xx = this.x
        const yy = this.y
        moveTo(ctx, -10, -20, xx, yy, this.direction)
        lineTo(ctx, 0, -20, xx, yy, this.direction)
        arc(ctx, 0, 0, 20, -Math.PI / 2, Math.PI / 2, xx, yy, this.direction)
        lineTo(ctx, -10, 20, xx, yy, this.direction)
        lineTo(ctx, -10, -20, xx, yy, this.direction)
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
        drawCircle2(ctx, 25, 0, 5, xx, yy, this.direction)
        ctx.stroke()
    }

    generateVerilog() {
        return gateGenerateVerilog.call(this, '&', true)
    }
}

// Define static properties using Object.defineProperty
Object.defineProperty(NandGate.prototype, 'tooltipText', {
    value: 'Nand Gate ToolTip : Combination of AND and NOT gates',
    writable: true,
})

Object.defineProperty(NandGate.prototype, 'alwaysResolve', {
    value: true,
    writable: true,
})

Object.defineProperty(NandGate.prototype, 'verilogType', {
    value: 'nand',
    writable: true,
})

Object.defineProperty(NandGate.prototype, 'helplink', {
    value: 'https://docs.circuitverse.org/#/chapter4/4gates?id=nand-gate',
    writable: true,
})

Object.defineProperty(NandGate.prototype, 'objectType', {
    value: 'NandGate',
    writable: true,
})

// Set the changeInputSize function
NandGate.prototype.changeInputSize = changeInputSize
