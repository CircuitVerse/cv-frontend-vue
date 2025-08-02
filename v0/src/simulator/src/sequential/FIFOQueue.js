import { fillText4 } from '../canvasApi';
import CircuitElement from '../circuitElement';
import Node, { findNode } from '../node';
import simulationArea from '../simulationArea';
import { colors } from '../themer/themer';

/**
 * @class
 * FIFOQueue
 * @extends CircuitElement
 * A FIFO (First-In-First-Out) queue circuit component that stores incoming values
 * and outputs them in order based on enqueue (ENQ) and dequeue (DEQ) signals.
 *
 * @param {number} x - X coordinate of the element
 * @param {number} y - Y coordinate of the element
 * @param {Scope=} scope - Circuit scope where the component is placed
 * @param {string=} dir - Direction of the component (default: RIGHT)
 * @param {number=} bitWidth - Bit width of input and output (default: 1)
 * @param {number=} depth - Maximum number of entries in the queue (default: 8)
 * @category modules
 */
export default class FIFOQueue extends CircuitElement {
    constructor(x, y, scope = globalScope, dir = 'RIGHT', bitWidth = 1, depth = 8) {
        super(x, y, scope, dir, bitWidth);

        this.bitWidth = bitWidth;
        this.depth = depth;
        this.queue = [];
        this.lastClk = 0;
        this.rectangleObject = true;
        this.setDimensions(60, 30);

        // Input nodes
        this.dataIn = new Node(-60, 0, 0, this, bitWidth, 'D');
        this.enq = new Node(-30, -30, 0, this, 1, 'ENQ');
        this.deq = new Node(+30, -30, 0, this, 1, 'DEQ');
        this.reset = new Node(0, -30, 0, this, 1, 'RST');
        this.clk = new Node(0, +30, 0, this, 1, "CLK");

        // Output nodes
        this.dataOut = new Node(+60, 0, 1, this, bitWidth, 'Q');
        this.empty = new Node(-30, +30, 1, this, 1, 'EMP');
        this.full = new Node(+30, +30, 1, this, 1, 'FULL');
    }

    /**
     * Save the component's custom data for JSON serialization
     * @returns {Object}
     */
    customSave() {
        return {
            constructorParamaters: [this.direction, this.bitWidth, this.depth],
            nodes: {
                dataIn: findNode(this.dataIn),
                enq: findNode(this.enq),
                deq: findNode(this.deq),
                reset: findNode(this.reset),
                dataOut: findNode(this.dataOut),
                empty: findNode(this.empty),
                full: findNode(this.full),
            },
        };
    }

    /**
     * Determines whether the component is ready to resolve
     * @returns {boolean}
     */
    isResolvable() {
        return true;
    }

    /**
     * Main logic to simulate enqueue, dequeue, and reset behavior
     */
    resolve() {
        const clkValue = this.clk.value;

        // Rising edge detection
        if (this.lastClk === 0 && clkValue === 1) {
            if (this.reset.value === 1) {
                this.queue = [];
            } else if (this.enq.value === 1 && this.queue.length < this.depth) {
                this.queue.push(this.dataIn.value);
            } else if (this.deq.value === 1 && this.queue.length > 0) {
                this.dataOut.value = this.queue.shift();
            }

            // Update status outputs
            this.empty.value = this.queue.length === 0 ? 1 : 0;
            this.full.value = this.queue.length === this.depth ? 1 : 0;

            // Enqueue simulation updates
            simulationArea.simulationQueue.add(this.dataOut);
            simulationArea.simulationQueue.add(this.empty);
            simulationArea.simulationQueue.add(this.full);
        }

        this.lastClk = clkValue;
    }

    /**
     * Custom drawing logic for the FIFOQueue component
     */
    customDraw() {
        const ctx = simulationArea.context;
        const xx = this.x;
        const yy = this.y;

        ctx.beginPath();
        ctx.fillStyle = colors['text'];
        ctx.textAlign = 'center';

        fillText4(ctx, "FIFO Queue", 0, 0, xx, yy, this.direction, 10);
        fillText4(ctx, "ENQ", -30, -20, xx, yy, this.direction, 8);
        fillText4(ctx, "DEQ", +30, -20, xx, yy, this.direction, 8);
        fillText4(ctx, "RST", 0, -20, xx, yy, this.direction, 8);
        fillText4(ctx, "CLK", 0, +20, xx, yy, this.direction, 8);
        fillText4(ctx, "In", -52, 0, xx, yy, this.direction, 8);
        fillText4(ctx, "Out", 48, 0, xx, yy, this.direction, 8);
        fillText4(ctx, "EMP", -30, +20, xx, yy, this.direction, 8);
        fillText4(ctx, "FULL", +30, +20, xx, yy, this.direction, 8);

        ctx.fill();
    }

    /**
     * Change the queue depth
     * @param {number} depth - New depth value
     */
    changeDepth(depth) {
        if (depth !== undefined && !isNaN(depth) && this.depth !== depth) {
            const obj = new FIFOQueue(this.x, this.y, this.scope, this.dir, this.bitWidth, depth);
            this.delete();
            simulationArea.lastSelected = obj;
            return obj;
        }
    }

    /**
     * Change the input/output bit width
     * @param {number} bitWidth - New bit width
     */
    newBitWidth(bitWidth) {
        if (bitWidth >= 1 && this.bitWidth !== bitWidth) {
            this.bitWidth = bitWidth;
            this.dataIn.bitWidth = bitWidth;
            this.dataOut.bitWidth = bitWidth;
        }
    }
}

FIFOQueue.prototype.mutableProperties = {
    depth: {
        name: 'Depth: ',
        type: 'number',
        func: 'changeDepth'
    },
};

FIFOQueue.prototype.tooltipText = 'FIFO Queue - Stores and forwards data in first-in, first-out order';
FIFOQueue.prototype.helplink = 'https://docs.circuitverse.org/#/chapter4/<to-be-updated>';
FIFOQueue.prototype.objectType = 'FIFOQueue';
