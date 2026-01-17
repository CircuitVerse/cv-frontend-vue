/* eslint-disable no-bitwise */
import CircuitElement from '../circuitElement'
import Node, { findNode } from '../node'
import { simulationArea } from '../simulationArea'

/**
 * @class
 * verilogDivider
 * @extends CircuitElement
 * @param {number} x - x coordinate of element.
 * @param {number} y - y coordinate of element.
 * @param {Scope=} scope - Circuit on which element is drawn
 * @param {string=} dir - direction of element
 * @param {number=} bitWidth - bit width per node. modules
 * @category modules
 */
export default class verilogDivider extends CircuitElement {
    constructor(
        x,
        y,
        scope = globalScope,
        dir = 'RIGHT',
        bitWidth = 1,
        outputBitWidth = 1
    ) {
        super(x, y, scope, dir, bitWidth)
        this.setDimensions(20, 20)
        this.outputBitWidth = outputBitWidth

        this.inpA = new Node(-20, -10, 0, this, this.bitWidth, 'A')
        this.inpB = new Node(-20, 0, 0, this, this.bitWidth, 'B')

        this.quotient = new Node(
            20,
            -5,
            1,
            this,
            this.outputBitWidth,
            'Quotient'
        )
        this.remainder = new Node(
            20,
            5,
            1,
            this,
            this.outputBitWidth,
            'Remainder'
        )
    }

    /**
     * @memberof verilogDivider
     * fn to create save Json Data of object
     * @return {JSON}
     */
    customSave() {
        return {
            constructorParamaters: [
                this.direction,
                this.bitWidth,
                this.outputBitWidth,
            ],
            nodes: {
                inpA: findNode(this.inpA),
                inpB: findNode(this.inpB),
                quotient: findNode(this.quotient),
                remainder: findNode(this.remainder),
            },
        }
    }

    /**
     * @memberof verilogDivider
     * Checks if the element is resolvable
     * @return {boolean}
     */
    isResolvable() {
        return this.inpA.value !== undefined && this.inpB.value !== undefined
    }

    /**
     * @memberof verilogDivider
     * function to change bitwidth of the element
     * @param {number} bitWidth - new bitwidth
     */
    newBitWidth(bitWidth) {
        this.bitWidth = bitWidth
        this.inpA.bitWidth = bitWidth
        this.inpB.bitWidth = bitWidth
        this.quotient.bitWidth = this.outputBitWidth
        this.remainder.bitWidth = this.outputBitWidth
    }

    /**
     * @memberof verilogDivider
     * resolve output values based on inputData
     */
    resolve() {
        if (!this.isResolvable()) return

       
        if (this.inpB.value === 0) {
            this.quotient.value = 0
            this.remainder.value = 0
            simulationArea.simulationQueue.add(this.quotient)
            simulationArea.simulationQueue.add(this.remainder)
            return
        }

        const quotient = this.inpA.value / this.inpB.value
        const remainder = this.inpA.value % this.inpB.value

       
        const bw = Math.min(this.outputBitWidth, 32)

        this.quotient.value =
            (quotient << (32 - bw)) >>> (32 - bw)

        this.remainder.value =
            (remainder << (32 - bw)) >>> (32 - bw)

        simulationArea.simulationQueue.add(this.quotient)
        simulationArea.simulationQueue.add(this.remainder)
    }
}

/**
 * @memberof verilogDivider
 * Help Tip
 * @type {string}
 * @category modules
 */
verilogDivider.prototype.tooltipText =
    'verilogDivider ToolTip : Performs division and outputs quotient and remainder.'
verilogDivider.prototype.helplink =
    'https://docs.circuitverse.org/#/miscellaneous?id=verilogDivider'
verilogDivider.prototype.objectType = 'verilogDivider'
