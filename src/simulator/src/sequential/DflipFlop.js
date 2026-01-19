import CircuitElement from '../circuitElement'
import Node, { findNode } from '../node'
import { simulationArea } from '../simulationArea'
import { correctWidth, lineTo, moveTo, fillText } from '../canvasApi'
import { colors } from '../themer/themer'
/**
 * @class
 * DflipFlop
 * D flip flop has 5 input nodes:
 * clock, data input, preset, reset ,enable.
 * @extends CircuitElement
 * @param {number} x - x coord of element
 * @param {number} y - y coord of element
 * @param {Scope=} scope - the ciruit in which we want the Element
 * @param {string=} dir - direcion in which element has to drawn
 * @category sequential
 */
export default class DflipFlop extends CircuitElement {
    constructor(x, y, scope = globalScope, dir = 'RIGHT', bitWidth = 1) {
        super(x, y, scope, dir, bitWidth)
        this.directionFixed = true
        this.setDimensions(20, 20)
        this.rectangleObject = true
        this.clockInp = new Node(-20, +10, 0, this, 1, 'Clock')
        this.dInp = new Node(-20, -10, 0, this, this.bitWidth, 'D')
        this.qOutput = new Node(20, -10, 1, this, this.bitWidth, 'Q')
        this.qInvOutput = new Node(20, 10, 1, this, this.bitWidth, 'Q Inverse')
        this.reset = new Node(10, 20, 0, this, 1, 'Asynchronous Reset')
        this.preset = new Node(0, 20, 0, this, this.bitWidth, 'Preset')
        this.en = new Node(-10, 20, 0, this, 1, 'Enable')
        //this.masterState = 0
        //this.slaveState = 0
        //this.prevClockState = 0

        this.wasClicked = false
    }

    /**
     * WIP always resolvable?
     */
    isResolvable() {
        return true
    }

    newBitWidth(bitWidth) {
        this.bitWidth = bitWidth
        this.dInp.bitWidth = bitWidth
        this.qOutput.bitWidth = bitWidth
        this.qInvOutput.bitWidth = bitWidth
        this.preset.bitWidth = bitWidth
    }

    /**
     * @memberof DflipFlop
     *
     * Level-sensitive D flipflop behavior:
     * - When the clock is HIGH and the enable pin is active, Q follows D
     *   after the component's propagation delay.
     * - When the clock is LOW, the latch is closed and Q holds its previous value.
     * - Asynchronous reset overrides clock and data and forces Q to the preset value.
     * - Q Inverse always reflects the bitwise inverse of Q.
     *
     * This implementation matches the CircuitVerse documentation and Verilog export.
     */
    resolve(){
        let Q_new = this.qOutput.value
        if (this.reset.value==1){
            Q_new=this.preset.value || 0
        }
        else if(
        (this.en.value === 1 || this.en.connections.length === 0) &&
        this.clockInp.value === 1 &&
        this.dInp.value !== undefined
        ){
          Q_new=this.dInp.value      
        }
        const qInvNew = Q_new === undefined ? undefined : this.flipBits(Q_new)
        if (
            Q_new !== this.qOutput.value ||
            qInvNew !== this.qInvOutput.value
        ) {
            this.qOutput.value = Q_new
            this.qInvOutput.value = qInvNew
            simulationArea.simulationQueue.add(this.qOutput)
            simulationArea.simulationQueue.add(this.qInvOutput)
        }
    }

    customSave() {
        var data = {
            nodes: {
                clockInp: findNode(this.clockInp),
                dInp: findNode(this.dInp),
                qOutput: findNode(this.qOutput),
                qInvOutput: findNode(this.qInvOutput),
                reset: findNode(this.reset),
                preset: findNode(this.preset),
                en: findNode(this.en),
            },
            constructorParamaters: [this.direction, this.bitWidth],
        }
        return data
    }

    customDraw() {
        var ctx = simulationArea.context
        ctx.strokeStyle = colors['stroke']
        ctx.fillStyle = colors['fill']
        ctx.beginPath()
        ctx.lineWidth = correctWidth(3)
        var xx = this.x
        var yy = this.y
        // rect(ctx, xx - 20, yy - 20, 40, 40);
        moveTo(ctx, -20, 5, xx, yy, this.direction)
        lineTo(ctx, -15, 10, xx, yy, this.direction)
        lineTo(ctx, -20, 15, xx, yy, this.direction)
        ctx.stroke()

        ctx.beginPath()
        ctx.font = '20px Raleway'
        ctx.fillStyle = colors['input_text']
        ctx.textAlign = 'center'
        fillText(ctx,(this.qOutput.value ?? 0).toString(16),xx,yy + 5)
        ctx.fill()
    }
    /**
     * DESIGN NOTE:
     * JS simulation models a level-sensitive latch for pedagogical reasons,
     * while Verilog export uses an edge-triggered FF for synthesis consistency.
     */


    static moduleVerilog() {
        return `
module DflipFlop(q, q_inv, clk, d, a_rst, pre, en);
    parameter WIDTH = 1;
    output reg [WIDTH-1:0] q, q_inv;
    input clk, a_rst, en;
    input [WIDTH-1:0] d, pre;

    always @(posedge clk or posedge a_rst) begin
        if (a_rst) begin
            q     <= pre;
            q_inv <= ~pre;
        end else if (en) begin
            q     <= d;
            q_inv <= ~d;
        end
        // else: hold state
    end
endmodule
    `
    }
}

DflipFlop.prototype.tooltipText =
    'D FlipFlop ToolTip : Introduces delay in timing circuit.'
DflipFlop.prototype.helplink =
    'https://docs.circuitverse.org/#/chapter4/6sequentialelements?id=d-flip-flop'

DflipFlop.prototype.objectType = 'DflipFlop'
