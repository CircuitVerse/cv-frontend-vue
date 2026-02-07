import CircuitElement from '../circuitElement'
import Node, { findNode } from '../node'
import { simulationArea } from '../simulationArea'
import { fillText } from '../canvasApi'
import { changeInputSize } from '../modules'
import { gateGenerateVerilog } from '../utils'
import { colors } from '../themer/themer'

export default class ParityGenerator extends CircuitElement {
    constructor(
        x,
        y,
        scope = globalScope,
        dir = 'RIGHT',
        inputs = 3,
        bitWidth = 1
    ) {
        super(x, y, scope, dir, bitWidth)
        this.rectangleObject = true
        this.setDimensions(20, 20)
        this.inp = []
        this.inputSize = inputs
        if (inputs % 2 === 1) {
            for (let i = 0; i < inputs / 2 - 1; i++) {
                const a = new Node(-20, -10 * (i + 1), 0, this)
                this.inp.push(a)
            }
            let a = new Node(-20, 0, 0, this)
            this.inp.push(a)
            for (let i = inputs / 2 + 1; i < inputs; i++) {
                a = new Node(-20, 10 * (i + 1 - inputs / 2 - 1), 0, this)
                this.inp.push(a)
            }
        } else {
            for (let i = 0; i < inputs / 2; i++) {
                const a = new Node(-20, -10 * (i + 1), 0, this)
                this.inp.push(a)
            }
            for (let i = inputs / 2; i < inputs; i++) {
                const a = new Node(-20, 10 * (i + 1 - inputs / 2), 0, this)
                this.inp.push(a)
            }
        }
        this.output1 = new Node(20, 0, 1, this)
    }

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

    resolve() {
        let result = this.inp[0].value || 0
        if (this.isResolvable() === false) {
            return
        }
        for (let i = 1; i < this.inputSize; i++)
            result ^= this.inp[i].value || 0
        this.output1.value = result
        simulationArea.simulationQueue.add(this.output1)
    }

    customDraw() {
        var ctx = simulationArea.context
        ctx.beginPath()
        ctx.fillStyle = colors['text']
        ctx.textAlign = 'center'
        fillText(ctx, 'Parity', this.x, this.y + 2, 10)
        ctx.fill()
    }

    generateVerilog() {
        return gateGenerateVerilog.call(this, '^')
    }
}

ParityGenerator.prototype.tooltipText = 'Parity Generator: Outputs 1 if odd number of 1s.'
ParityGenerator.prototype.alwaysResolve = true
ParityGenerator.prototype.changeInputSize = changeInputSize
ParityGenerator.prototype.verilogType = 'xor'
ParityGenerator.prototype.objectType = 'ParityGenerator'
