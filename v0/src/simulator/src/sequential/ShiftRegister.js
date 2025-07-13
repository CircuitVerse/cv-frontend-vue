/* eslint-disable no-bitwise */
import CircuitElement from '../circuitElement'
import Node, { findNode } from '../node'
import simulationArea from '../simulationArea'
import { correctWidth, lineTo, moveTo, fillText4 } from '../canvasApi'
import { colors } from '../themer/themer'

/**
 * @class
 * ShiftRegister
 * @extends CircuitElement
 * @param {number} x - x coordinate of the element
 * @param {number} y - y coordinate of the element
 * @param {Scope=} scope - Circuit scope where the element exists
 * @param {string=} dir - Direction of the element (default: DOWN)
 * @param {number=} bitWidth - Bit width per data node (default: 1)
 * @param {number=} noOfStages - Number of shift register stages (default: 4)
 * @param {string=} registerType - If parallel loading is enabled ("Yes" or "No")
 * @category modules
 */
export default class ShiftRegister extends CircuitElement {

    constructor(x, y, scope = globalScope, dir = 'DOWN', bitWidth = 1, noOfStages = 4, registerType = "PIPO") {
        super(x, y, scope, dir, bitWidth)

        this.message = 'ShiftRegister'

        this.width = 60;

        this.noOfStages = noOfStages || parseInt(prompt('Enter number of stages:'))


        this.registerType = registerType ?? "PIPO";

        const baseHeight = 230;
        const extraHeight = this.noOfStages * 20;
        this.height = baseHeight + extraHeight;

        // Set half-width, half-height for bounding box
        this.setDimensions(this.width / 2, baseHeight / 2)

        this.rectangleObject = false

        this.inp = []
        this.out = []

        this.firstInput = new Node(30, 0, 0, this, this.bitWidth, 'First Input')


        this.reset = new Node(30, -90, 0, this, 1, 'Reset')
        const labelText = (this.registerType === "PIPO" || this.registerType === "PISO") ? "Shift/Load" : "Shift";
        this.shiftLoad = new Node(30, -70, 0, this, 1, labelText);
        this.clk = new Node(30, -50, 0, this, 1, "Clock");

        let i = 0;

        while (i < this.noOfStages) {
            if (this.registerType == "PIPO") {
                const a = new Node(30, 20 * (i + 1), 0, this, this.bitWidth)
                this.inp.push(a)

                const b = new Node(-30, 20 * (i + 1), 1, this, this.bitWidth)
                b.value = 1;
                this.out.push(b)
            } else if (this.registerType == "PISO") {
                const a = new Node(30, 20 * (i + 1), 0, this, this.bitWidth)
                this.inp.push(a)
            } else if (this.registerType == "SIPO") {
                const b = new Node(-30, 20 * (i + 1), 1, this, this.bitWidth)
                b.value = 1;
                this.out.push(b)
            }
            ++i;
        }
        if (this.registerType !== "PIPO" && this.registerType != "SIPO") {
            const b = new Node(-30, 20 * i, 1, this, this.bitWidth)
            b.value = 1;
            this.out.push(b)
        }
        this.lastClk = 0
        this.cell = new Array(this.noOfStages)
    }

    /**
    * Draw the ShiftRegister component
    */
    customDraw() {
        const ctx = simulationArea.context
        const xx = this.x
        const yy = this.y

        const width = this.width
        const baseHeight = 230; // fixed top height
        const extraHeight = this.noOfStages * 20; // dynamic growth below

        const partitionY = -30

        // Draw main rectangle
        ctx.strokeStyle = colors['stroke']
        ctx.fillStyle = colors['fill']
        ctx.beginPath();

        // top-left
        moveTo(ctx, -width / 2, -baseHeight / 2, xx, yy, this.direction);

        // top-right
        lineTo(ctx, width / 2, -baseHeight / 2, xx, yy, this.direction);

        // bottom-right (extends with noOfStages)
        lineTo(ctx, width / 2, extraHeight + 20, xx, yy, this.direction);

        // bottom-left
        lineTo(ctx, -width / 2, extraHeight + 20, xx, yy, this.direction);

        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = colors['stroke']
        ctx.fillStyle = colors['fill']
        ctx.lineWidth = correctWidth(3)
        ctx.stroke();

        // Partition line
        ctx.beginPath()
        moveTo(ctx, -width / 2, partitionY, xx, yy, this.direction)
        lineTo(ctx, width / 2, partitionY, xx, yy, this.direction)

        ctx.setLineDash([4, 2])
        ctx.stroke()
        ctx.setLineDash([])

        // Section labels
        ctx.fillStyle = 'black'
        ctx.textAlign = 'center'
        fillText4(ctx, '>>>', 0, 0, xx, yy, this.direction, 10)

        // ==== Label control inputs (inside component) ====
        fillText4(ctx, 'Reset', 16, -90, xx, yy, this.direction, 6)
        const labelText = (this.registerType === "PIPO" || this.registerType === "PISO") ? "S/L" : "S";
        fillText4(ctx, labelText, 16, -70, xx, yy, this.direction, 6)
        fillText4(ctx, 'Clock', 16, -50, xx, yy, this.direction, 6)

        // ==== Label data i/o ====
        for (let i = 0; i < this.noOfStages; i++) {
            fillText4(ctx, `In${i}`, 20, 20 * (i + 1), xx, yy, this.direction, 6)
            fillText4(ctx, `Out${i}`, -20, 20 * (i + 1), xx, yy, this.direction, 6)
            fillText4(ctx, this.cell[i] == undefined ? 'x' : this.cell[i], 0, 20 * (i + 1), xx, yy, this.direction, 11)
        }

    }

    isResolvable() {
        return true;
    }

    /**
     * Resolve logic based on clock edge and shift/load/reset signals
     */
    resolve() {
        const clkValue = this.clk.value;
        let isShift = 0;
        let isLoad = 0;
        if (this.registerType == "SISO" || this.registerType == "SIPO") {
            isShift = this.shiftLoad.value;
        } else {
            isShift = +!this.shiftLoad.value;
            isLoad = this.shiftLoad.value;
        }
        // Rising edge detection
        if (this.lastClk === 0 && clkValue === 1) {
            if (this.reset.value === 1) {
                this.cell.fill(0);
            }
            else if (isLoad === 1) {
                for (let i = 0; i < this.noOfStages; i++) {
                    this.cell[i] = this.inp[i].value;
                }
            }
            else if (isShift === 1) {
                this.cell.unshift(this.firstInput.value)
                this.cell.length = this.noOfStages
            }
            if (this.registerType == 'SISO' || this.registerType == 'PISO') {
                this.out[0].value = this.cell[this.cell.length - 1];
                simulationArea.simulationQueue.add(this.out[0])
            } else {
                for (let i = 0; i < this.noOfStages; i++) {
                    this.out[i].value = this.cell[i];
                    simulationArea.simulationQueue.add(this.out[i])
                }
            }

        }
        this.lastClk = clkValue
    }

    /**
     * Change the bit width of all input/output nodes
     * @param {number} bitWidth - New bit width
     */
    newBitWidth(bitWidth) {
        for (let i = 0; i < this.noOfStages; i++) {
            this.inp[i].bitWidth = bitWidth;
            this.out[i].bitWidth = bitWidth;
        }
    }

    /**
     * Generate JSON save object for component
     * @returns {Object}
     */
    customSave() {
        const data = {
            nodes: {
                reset: findNode(this.reset),
                shiftLoad: findNode(this.shiftLoad),
                clk: findNode(this.clk),
                out: this.out.map(findNode),
            },
            values: {
                cell: this.cell,
            },
            constructorParamaters: [this.direction, this.bitWidth, this.noOfStages],
        }
        return data
    }

    /**
         * Update the number of stages in the register
         * @param {number} noOfStages - New number of stages (1–32)
         */
    changeNumberofStages(noOfStages) {
        if (noOfStages == undefined || noOfStages < 1 || noOfStages > 32) return;
        if (this.noOfStages == noOfStages) return;
        var obj = new ShiftRegister(this.x, this.y, this.scope, this.dir, this.bitWidth, noOfStages, this.registerType)
        this.delete()
        simulationArea.lastSelected = obj
        return obj
    }

    /**
    * Update the parallel load configuration
    * @param {string} registerType - "Yes" or "No"
    */
    changeRegisterType(registerType) {
        if (registerType !== undefined && this.registerType !== registerType) {
            this.registerType = registerType;
            var obj = new ShiftRegister(this.x, this.y, this.scope, this.dir, this.bitWidth, this.noOfStages, this.registerType)
            this.delete()
            simulationArea.lastSelected = obj
            return obj;
        }

    }

}


ShiftRegister.prototype.mutableProperties = {
    noOfStages: {
        name: 'Number of Stages: ',
        type: 'number',
        max: '32',
        min: '1',
        func: 'changeNumberofStages',
    },
    registerType: {
        name: 'Register Type: ',
        type: 'dropdown',
        func: 'changeRegisterType',
        dropdownArray: ['SISO', 'SIPO', "PISO", 'PIPO']
    }
}

ShiftRegister.prototype.helplink =
    'https://docs.circuitverse.org/#/chapter4/<to be updated>'

ShiftRegister.prototype.tooltipText = "ShiftRegister";

ShiftRegister.prototype.objectType = 'ShiftRegister'
