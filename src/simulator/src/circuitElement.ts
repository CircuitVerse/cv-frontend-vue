/* eslint-disable no-multi-assign */
/* eslint-disable no-bitwise */
/* eslint-disable */
import { scheduleUpdate } from './engine';
import { simulationArea } from './simulationArea';
import {
    fixDirection,
    fillText,
    correctWidth,
    rect2,
    oppositeDirection,
} from './canvasApi';
import { colors } from './themer/themer';
import { layoutModeGet, tempBuffer } from './layoutMode';
import { fillSubcircuitElements } from './ux';
import { generateNodeName } from './verilogHelpers';

/**
 * Base class for circuit elements.
 * @param {number} x - x coordinate of the element
 * @param {number} y - y coordinate of the element
 * @param {Scope} scope - The circuit on which circuit element is being drawn
 * @param {string} dir - The direction of circuit element
 * @param {number} bitWidth - the number of bits per node.
 * @category circuitElement
 */
export default class CircuitElement {
    x: number;
    y: number;
    hover: boolean;
    deleteNodesWhenDeleted: boolean;
    nodeList: any[];
    clicked: boolean;
    oldx: number;
    oldy: number;
    leftDimensionX: number;
    rightDimensionX: number;
    upDimensionY: number;
    downDimensionY: number;
    label: string;
    scope: any;
    bitWidth: number;
    direction: string;
    directionFixed: boolean;
    labelDirectionFixed: boolean;
    labelDirection: string;
    orientationFixed: boolean;
    fixedBitWidth: boolean;
    queueProperties: {
        inQueue: boolean,
        time: any,
        index: any,
    };
    subcircuitMetadata?: {
        showInSubcircuit: boolean,
        showLabelInSubcircuit: boolean,
        labelDirection: string,
        x: number,
        y: number,
    };

    constructor(x?: number, y?: number, scope?: any, dir?: string, bitWidth?: number) {
        // Data member initializations
        this.x = x || simulationArea.mouseX;
        this.y = y || simulationArea.mouseY;
        this.hover = false;
        this.deleteNodesWhenDeleted = true; // FOR NOW - TO CHECK LATER
        this.nodeList = [];
        this.clicked = false;

        this.oldx = x || 0;
        this.oldy = y || 0;

        // Dimensions from center
        this.leftDimensionX = 10;
        this.rightDimensionX = 10;
        this.upDimensionY = 10;
        this.downDimensionY = 10;

        this.label = '';
        this.scope = scope;

        this.baseSetup();

        this.bitWidth = bitWidth || parseInt(prompt('Enter bitWidth'), 10) || 1;
        this.direction = dir || '';
        this.directionFixed = false;
        this.labelDirectionFixed = false;
        this.labelDirection = oppositeDirection[dir || ''];
        this.orientationFixed = true;
        this.fixedBitWidth = false;

        scheduleUpdate();

        if (this.canShowInSubcircuit) {
            this.subcircuitMetadata = {
                showInSubcircuit: false,
                showLabelInSubcircuit: true,
                labelDirection: this.labelDirection,
                x: 0,
                y: 0,
            };
        }
    }

    /**
     * Function to flip bits
     * @param {number} val - the value of flipped bits
     * @returns {number} - The number of flipped bits
     */
    flipBits(val: number): number {
        return ((~val >>> 0) << (32 - this.bitWidth)) >>> (32 - this.bitWidth);
    }

    /**
     * Function to get absolute value of x coordinate of the element
     * @return {number} - absolute value of x
     */
    absX(): number {
        return this.x;
    }

    /**
     * Function to get absolute value of y coordinate of the element
     * @return {number} - absolute value of y
     */
    absY(): number {
        return this.y;
    }

    /**
     * adds the element to scopeList
     */
    baseSetup() {
        if (this.scope && this.objectType) {
            this.scope[this.objectType].push(this);
        }
    }

    /**
     * Function to copy the circuit element obj to a new circuit element
     * @param {CircuitElement} obj - element to be copied from
     */
    copyFrom(obj: CircuitElement) {
        const properties = ['label', 'labelDirection'];
        for (const prop of properties) {
            if (obj[prop] !== undefined) {
                this[prop] = obj[prop];
            }
        }
    }

   // ... Additional methods ...

   /**
     * Function to update the scope when a new element is added.
     * @param {Scope} scope - the circuit in which we add element
     */
   updateScope(scope: any) {
       this.scope = scope;
       for (const node of this.nodeList) {
           node.scope = scope;
       }
   }

   /**
     * To generate JSON-safe data that can be loaded
     * @memberof CircuitElement
     * @return {object} - the data to be saved
     */
   saveObject() {
       const data = {
           x: this.x,
           y: this.y,
           objectType: this.objectType,
           label: this.label,
           direction: this.direction,
           labelDirection: this.labelDirection,
           propagationDelay: this.propagationDelay,
           customData: this.customSave(),
       };

       if (this.canShowInSubcircuit) {
           data.subcircuitMetadata = this.subcircuitMetadata;
       }
       return data;
   }

   /**
     * Always overriden
     * @memberof CircuitElement
     * @return {object} - the data to be saved
     */
   customSave() {
       return {
           values: {},
           nodes: {},
           constructorParamaters: [],
       };
   }

   // ... Remaining methods ...
}
