import { fillText4 } from '../canvasApi'
import CircuitElement from '../circuitElement'
import Node, { findNode } from '../node'
import simulationArea from '../simulationArea'

export default class Comparator extends CircuitElement {
    constructor(x, y, scope = globalScope, dir = 'RIGHT', bitWidth = 1) {
        super(x, y, scope, dir, bitWidth)

        this.fixedBitWidth = false;
        this.setDimensions(20, 20)

        this.inpA = new Node(-20, -10, 0, this, this.bitWidth, 'A')
        this.inpB = new Node(-20, +10, 0, this, this.bitWidth, 'B')

        this.less = new Node(20, 10, 1, this, 1, 'less')
        this.equal = new Node(20, 0, 1, this, 1, 'equal')
        this.greater = new Node(20, -10, 1, this, 1, 'greater')

    }

    customSave() {
        const data = {
            constructorParamaters: [this.direction, this.bitWidth],
            nodes: {
                inpA: findNode(this.inpA),
                inpB: findNode(this.inpB),
                greater: findNode(this.greater),
                equal: findNode(this.equal),
                less: findNode(this.less),
            },
        }
        return data
    }

    isResolvable() {
        return this.inpA.value != undefined && this.inpB.value != undefined;
    }

    newBitWidth(bitWidth) {
        this.inpA.bitWidth = bitWidth
        this.inpB.bitWidth = bitWidth
    }

    resolve() {

        const a = this.inpA.value;
        const b = this.inpB.value;

        if (a === b) {
            this.greater.value = 0;
            this.equal.value = 1;
            this.less.value = 0;
        } else if (a > b) {
            this.greater.value = 1;
            this.equal.value = 0;
            this.less.value = 0;
        } else {
            this.greater.value = 0;
            this.equal.value = 0;
            this.less.value = 1;
        }
        simulationArea.simulationQueue.add(this.greater)
        simulationArea.simulationQueue.add(this.equal)
        simulationArea.simulationQueue.add(this.less)
    }

    customDraw() {
        const ctx = simulationArea.context
        const xx = this.x
        const yy = this.y

        ctx.fillStyle = 'black'
        ctx.textAlign = 'center'
        fillText4(ctx, '>', 12, -10, xx, yy, this.direction, 12)
        fillText4(ctx, '=', 12, 0, xx, yy, this.direction, 12)
        fillText4(ctx, '<', 12, 10, xx, yy, this.direction, 12)
    }



}

Comparator.prototype.tooltipText =
    'Comparator'
Comparator.prototype.helplink =
    'https://docs.circuitverse.org/#/chapter4/<to be updated>'
Comparator.prototype.objectType = 'Comparator'
