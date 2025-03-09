/* eslint-disable no-bitwise */
import CircuitElement from '../circuitElement';
import Node, { findNode } from '../node';
import simulationArea from '../simulationArea';

/**
 * @class
 * Subtractor
 * @extends CircuitElement
 * @param {number} x - x coordinate of element.
 * @param {number} y - y coordinate of element.
 * @param {Scope=} scope - Cirucit on which element is drawn
 * @param {string=} dir - direction of element
 * @param {number=} bitWidth - bit width per node.
 * @category modules
 */
export default class Subtractor extends CircuitElement {
    constructor(x, y, scope = globalScope, dir = 'RIGHT', bitWidth = 1) {
        super(x, y, scope, dir, bitWidth);
        /* this is done in this.baseSetup() now
        this.scope['Subtractor'].push(this);
        */
        this.setDimensions(20, 20);

        this.inpA = new Node(-20, -10, 0, this, this.bitWidth, 'A');
        this.inpB = new Node(-20, 0, 0, this, this.bitWidth, 'B');
        this.borrowIn = new Node(-20, 10, 0, this, 1, 'Bin');
        this.diff = new Node(20, 0, 1, this, this.bitWidth, 'Diff');
        this.borrowOut = new Node(20, 10, 1, this, 1, 'Bout');
    }

    /**
     * @memberof Subtractor
     * fn to create save Json Data of object
     * @return {JSON}
     */
    customSave() {
        const data = {
            constructorParamaters: [this.direction, this.bitWidth],
            nodes: {
                inpA: findNode(this.inpA),
                inpB: findNode(this.inpB),
                borrowIn: findNode(this.borrowIn),
                borrowOut: findNode(this.borrowOut),
                diff: findNode(this.diff),
            },
        };
        return data;
    }

    /**
     * @memberof Subtractor
     * Checks if the element is resolvable
     * @return {boolean}
     */
    isResolvable() {
        return this.inpA.value !== undefined && this.inpB.value !== undefined;
    }

    /**
     * @memberof Subtractor
     * function to change bitwidth of the element
     * @param {number} bitWidth - new bitwidth
     */
    newBitWidth(bitWidth) {
        this.bitWidth = bitWidth;
        this.inpA.bitWidth = bitWidth;
        this.inpB.bitWidth = bitWidth;
        this.diff.bitWidth = bitWidth;
    }

    /**
     * @memberof Subtractor
     * resolve output values based on inputData
     */
    resolve() {
        if (this.isResolvable() === false) {
            return;
        }
        let borrowIn = this.borrowIn.value;
        if (borrowIn === undefined) borrowIn = 0;

        // Calculate difference
        let diff = this.inpA.value - this.inpB.value - borrowIn;
        
        // Handle borrow out
        this.borrowOut.value = +(diff < 0);
        
        // Ensure the result fits within bitWidth
        this.diff.value = ((diff) << (32 - this.bitWidth)) >>> (32 - this.bitWidth);
        simulationArea.simulationQueue.add(this.borrowOut);
        simulationArea.simulationQueue.add(this.diff);
    }

    generateVerilog() {
        if (this.borrowIn.verilogLabel) {
            return `assign ${this.diff.verilogLabel} = ${this.inpA.verilogLabel} - ${this.inpB.verilogLabel} - ${this.borrowIn.verilogLabel};`;
        }
        return `assign ${this.diff.verilogLabel} = ${this.inpA.verilogLabel} - ${this.inpB.verilogLabel};`;
    }
}

/**
 * @memberof Subtractor
 * Help Tip
 * @type {string}
 * @category modules
 */
Subtractor.prototype.tooltipText = 'Subtractor ToolTip : Performs subtraction of numbers.';
Subtractor.prototype.helplink = 'https://docs.circuitverse.org/#/chapter4/8misc?id=subtractor';
Subtractor.prototype.objectType = 'Subtractor';