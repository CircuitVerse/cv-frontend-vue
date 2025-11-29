import CircuitElement from '../circuitElement'
import Node, { findNode } from '../node'
import { simulationArea } from '../simulationArea'
import { correctWidth, rect2, fillText } from '../canvasApi'
import { colors } from '../themer/themer'

/**
 * @class
 * ClockDivider
 * @extends CircuitElement
 * @param {number} x - x coordinate of element.
 * @param {number} y - y coordinate of element.
 * @param {Scope=} scope - Circuit on which element is drawn
 * @param {number=} divideFactor - The factor to divide the clock by (default 2)
 * @category modules
 */
export default class ClockDivider extends CircuitElement {
    constructor(x, y, scope = globalScope, divideFactor = 2) {
        super(x, y, scope, 'RIGHT', 1)
        this.divideFactor = divideFactor || 2
        this.counter = 0
        this.prevClockState = undefined
        this.setDimensions(15, 15)
        this.rectangleObject = true

        this.clock = new Node(-15, 0, 0, this, 1, 'Clock')
        this.output = new Node(15, 0, 1, this, 1, 'Out')
        this.mutableProperties = {
            divideFactor: {
                name: 'Divide Factor',
                type: 'number',
                max: '100',
                min: '1',
                func: 'setDivideFactor',
            },
        }
    }

    setDivideFactor(value) {
        value = parseInt(value)
        if (!isNaN(value) && value > 0) {
            this.divideFactor = value
            this.counter = 0 // Reset counter when factor changes
        }
    }

    /**
     * @memberof ClockDivider
     * fn to create save Json Data of object
     * @return {JSON}
     */
    customSave() {
        const data = {
            constructorParamaters: [this.divideFactor],
            nodes: {
                clock: findNode(this.clock),
                output: findNode(this.output),
            },
        }
        return data
    }

    /**
     * @memberof ClockDivider
     * resolve output values based on inputData
     */
    resolve() {
        if (this.clock.value !== this.prevClockState && this.clock.value === 1) {
            this.counter++
        }
        this.prevClockState = this.clock.value

        if (this.counter >= this.divideFactor) {
            this.counter = 0
        }

        const outputValue = (this.counter % this.divideFactor) < (this.divideFactor / 2) ? 1 : 0

        if (this.output.value !== outputValue) {
            this.output.value = outputValue
            simulationArea.simulationQueue.add(this.output)
        }
    }

    /**
     * @memberof ClockDivider
     * function to draw element
     */
    customDraw() {
        var ctx = simulationArea.context
        var xx = this.x
        var yy = this.y

        ctx.strokeStyle = colors['stroke']
        ctx.fillStyle = colors['fill']
        ctx.lineWidth = correctWidth(3)

        ctx.beginPath()
        rect2(ctx, -15, -15, 30, 30, xx, yy, this.direction)
        ctx.fill()
        ctx.stroke()

        ctx.font = '14px Raleway'
        ctx.fillStyle = colors['input_text']
        ctx.textAlign = 'center'
        fillText(ctx, '÷' + this.divideFactor, xx, yy + 5)
    }
}

ClockDivider.prototype.tooltipText = 'Clock Divider: Divides the input clock frequency'
ClockDivider.prototype.helplink = 'https://docs.circuitverse.org/' // Placeholder as per instructions to not add extras
ClockDivider.prototype.objectType = 'ClockDivider'
