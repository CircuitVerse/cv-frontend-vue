import CircuitElement from '../circuitElement'
import Node, { findNode } from '../node'
import { simulationArea } from '../simulationArea'
import { correctWidth, lineTo, moveTo } from '../canvasApi'
import { colors } from '../themer/themer'

// Global scope declaration
declare const globalScope: any

/**
 * @class
 * Clock
 * Generates clock signal for sequential circuits
 * @extends CircuitElement
 * @param {number} x - x coord of element
 * @param {number} y - y coord of element
 * @param {Scope=} scope - the circuit in which we want the Element
 * @param {string=} dir - direction in which element has to be drawn
 * @category sequential
 */
export default class Clock extends CircuitElement {
    fixedBitWidth: boolean
    output1: Node
    state: number
    wasClicked: boolean
    interval: any

    constructor(
        x: number,
        y: number,
        scope: any = globalScope,
        dir: string = 'RIGHT'
    ) {
        super(x, y, scope, dir, 1)
        this.fixedBitWidth = true
        this.output1 = new Node(10, 0, 1, this)
        this.state = 0
        this.output1.value = this.state
        this.wasClicked = false
        this.interval = null
    }

    customSave(): { nodes: { output1: number }; constructorParamaters: string[] } {
        const data = {
            nodes: {
                output1: findNode(this.output1),
            },
            constructorParamaters: [this.direction],
        }
        return data
    }

    resolve(): void {
        this.output1.value = this.state
        // @ts-expect-error - simulationQueue types need updating
        simulationArea.simulationQueue.add(this.output1, 0)
    }

    toggleState(): void {
        // toggleState
        this.state = (this.state + 1) % 2
        this.output1.value = this.state
    }

    customDraw(): void {
        const ctx = simulationArea.context
        if (!ctx) return

        ctx.strokeStyle = colors['stroke']
        ctx.fillStyle = colors['fill']
        ctx.lineWidth = correctWidth(3)
        const xx = this.x
        const yy = this.y

        ctx.beginPath()
        ctx.strokeStyle = [colors['color_wire_con'], colors['color_wire_pow']][
            this.state
        ]
        ctx.lineWidth = correctWidth(2)
        if (this.state == 0) {
            moveTo(ctx, -6, 0, xx, yy, 'RIGHT')
            lineTo(ctx, -6, 5, xx, yy, 'RIGHT')
            lineTo(ctx, 0, 5, xx, yy, 'RIGHT')
            lineTo(ctx, 0, -5, xx, yy, 'RIGHT')
            lineTo(ctx, 6, -5, xx, yy, 'RIGHT')
            lineTo(ctx, 6, 0, xx, yy, 'RIGHT')
        } else {
            moveTo(ctx, -6, 0, xx, yy, 'RIGHT')
            lineTo(ctx, -6, -5, xx, yy, 'RIGHT')
            lineTo(ctx, 0, -5, xx, yy, 'RIGHT')
            lineTo(ctx, 0, 5, xx, yy, 'RIGHT')
            lineTo(ctx, 6, 5, xx, yy, 'RIGHT')
            lineTo(ctx, 6, 0, xx, yy, 'RIGHT')
        }
        ctx.stroke()
    }

    static verilogInstructions(): string {
        return 'Clock - Use a single global clock\\n'
    }
}

// @ts-expect-error - Prototype property assignments
Clock.prototype.tooltipText = 'Clock'
// @ts-expect-error - Prototype property assignments  
Clock.prototype.click = Clock.prototype.toggleState
// @ts-expect-error - Prototype property assignments
Clock.prototype.helplink =
    'https://docs.circuitverse.org/#/chapter4/6sequentialelements?id=clock'
Clock.prototype.objectType = 'Clock'
Clock.prototype.propagationDelay = 0
Clock.prototype.propagationDelayFixed = true
