import { fillText4 } from '../canvasApi';
import CircuitElement from '../circuitElement';
import Node, { findNode } from '../node';
import simulationArea from '../simulationArea';


/**
 * @class
 * BitExtender
 * @extends CircuitElement
 * @param {number} x - X coordinate of the element
 * @param {number} y - Y coordinate of the element
 * @param {Scope=} scope - Circuit scope where the component is placed
 * @param {string=} dir - Direction of the component (default: RIGHT)
 * @param {number=} bitWidthIn - Input bit width (default: 4)
 * @param {number=} bitWidthOut - Output bit width (default: 8)
 * @param {string=} extensionType - Type of extension: 'Zero', 'One', 'Sign', 'Input'
 * @category modules
 */
export default class BitExtender extends CircuitElement {
    constructor(x, y, scope = globalScope, dir = 'RIGHT', bitWidthIn = 4, bitWidthOut = 8, extensionType = "Sign") {
        super(x, y, scope, dir, 1);

        this.fixedBitWidth = true;
        this.setDimensions(20, 20);
        this.extensionType = extensionType ?? "Sign";
        this.bitWidthIn = bitWidthIn;
        this.bitWidthOut = bitWidthOut;

        this.bIn = new Node(-20, 0, 0, this, this.bitWidthIn, 'Bit Width In');
        this.bOut = new Node(20, 0, 1, this, this.bitWidthOut, 'Bit Width Out');

        if (extensionType === "Input") {
            this.input = new Node(0, -20, 0, this, 1, 'input');
        }

    }

    /**
     * Save the component's custom data for JSON serialization
     * @returns {Object}
     */
    customSave() {
        const data = {
            constructorParamaters: [this.direction, this.bitWidthIn,this.bitWidthOut, this.extensionType],
            nodes: {
                bIn: findNode(this.bIn),
                bOut: findNode(this.bOut),
                ...(this.input && { input: findNode(this.input) })
            },
        };
        return data;
    }

    /**
     * Determines whether the component is ready to resolve
     * @returns {boolean}
     */
    isResolvable() {
        return true;
    }

    /**
     * Main logic to perform bit extension and assign output
    */
    resolve() {
        const a = this.bitWidthIn;
        const b = this.bitWidthOut;
        const inputVal = this.bIn.value;
        if (a > b) {
            this.bOut.value = inputVal & ((1 << b) - 1);
            simulationArea.simulationQueue.add(this.bOut);
            return;
        }
        //identify difference
        let diff = b - a;
        let extensionBit = 0;
        switch (this.extensionType) {
            case 'Zero':
                extensionBit = 0;
                break;
            case 'One':
                extensionBit = 1;
                break;
            case 'Sign':
                extensionBit = this.getBitAtPosition(this.bIn.value, a - 1);
                break;
            case 'Input':
                extensionBit = this.input?.value ?? 0;
                break;
            default:
                extensionBit = 0;
        }
        // Create the extended value
        const extension = extensionBit ? ((1 << diff) - 1) << a : 0;
        this.bOut.value = extension | (inputVal & ((1 << a) - 1));
        simulationArea.simulationQueue.add(this.bOut);

    }

    /**
     * Custom draw logic for displaying the BitExtender
    */
    customDraw() {
        const ctx = simulationArea.context;
        const xx = this.x;
        const yy = this.y;

        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        fillText4(ctx, this.bitWidthIn.toString(), -12, 0, xx, yy, this.direction, 12);
        fillText4(ctx, this.bitWidthOut.toString(), 12, 0, xx, yy, this.direction, 12);
    }

    /**
     * Get the bit at the specified position
     * @param {number} number - Number to read bit from
     * @param {number} position - Bit position (0-indexed)
     * @returns {0|1}
     */
    getBitAtPosition(number, position) {
        return (number >> position) & 1;

    }

    /**
    * Change the extension type property
    * @param {string} extensionType - New extension type
    */
    changeExtensionType(extensionType) {
        if (extensionType !== undefined && this.extensionType !== extensionType) {
            this.extensionType = extensionType;
            var obj = new BitExtender(this.x, this.y, this.scope, this.dir, this.bitWidthIn, this.bitWidthOut, this.extensionType);
            this.delete();
            simulationArea.lastSelected = obj;
            return obj;
        }

    }

    /**
     * Change the input bit width
     * @param {number} bitWidthIn - New input width
     */
    changeBitWidthIn(bitWidthIn) {
        if (bitWidthIn !== undefined && bitWidthIn !== NaN && this.bitWidthIn !== bitWidthIn) {
            this.bitWidthIn = bitWidthIn;
            var obj = new BitExtender(this.x, this.y, this.scope, this.dir, this.bitWidthIn, this.bitWidthOut, this.extensionType);
            this.delete();
            simulationArea.lastSelected = obj;
            return obj;
        }

    }

    /**
     * Change the output bit width
     * @param {number} bitWidthOut - New output width
     */
    changeBitWidthOut(bitWidthOut) {
        if (bitWidthOut !== undefined && bitWidthOut !== NaN && this.bitWidthOut !== bitWidthOut) {
            this.bitWidthOut = bitWidthOut;
            var obj = new BitExtender(this.x, this.y, this.scope, this.dir, this.bitWidthIn, this.bitWidthOut, this.extensionType);
            this.delete();
            simulationArea.lastSelected = obj;
            return obj;
        }

    }




}

BitExtender.prototype.mutableProperties = {
    extensionType: {
        name: 'Extension Type: ',
        type: 'dropdown',
        func: 'changeExtensionType',
        dropdownArray: ['Zero', 'One', 'Sign', 'Input']
    },
    bitWidthIn: {
        name: 'Bit Width In: ',
        type: 'number',
        func: 'changeBitWidthIn'
    },
    bitWidthOut: {
        name: 'Bit Width Out: ',
        type: 'number',
        func: 'changeBitWidthOut'
    }

}

BitExtender.prototype.tooltipText =
    'Bit Extender - Extends an input binary value to a larger bit width using configurable logic';
BitExtender.prototype.helplink =
    'https://docs.circuitverse.org/#/chapter4/<to be updated>';
BitExtender.prototype.objectType = 'BitExtender';
