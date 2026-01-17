/* eslint-disable no-multi-assign */
/* eslint-disable no-bitwise */
/* eslint-disable */
import { scheduleUpdate } from './engine'
import { simulationArea } from './simulationArea'
import {
    fixDirection,
    fillText,
    correctWidth,
    rect2,
    oppositeDirection,
} from './canvasApi'
import { colors } from './themer/themer'
import { layoutModeGet, tempBuffer } from './layoutMode'
import { fillSubcircuitElements } from './ux'
import { generateNodeName } from './verilogHelpers'

/**
 * Base class for circuit elements.
 * @param x - x coordinate of the element
 * @param y - y coordinate of the element
 * @param scope - The circuit on which circuit element is being drawn
 * @param dir - The direction of circuit element
 * @param bitWidth - the number of bits per node.
 * @category circuitElement
 */
export default class CircuitElement {
    x: number
    y: number
    hover: boolean
    newElement: boolean
    deleteNodesWhenDeleted: boolean
    nodeList: any[]
    clicked: boolean
    oldx: number
    oldy: number
    leftDimensionX: number
    rightDimensionX: number
    upDimensionY: number
    downDimensionY: number
    label: string
    scope: any
    bitWidth: number
    direction: string
    directionFixed: boolean
    labelDirectionFixed: boolean
    labelDirection: string
    orientationFixed: boolean
    fixedBitWidth: boolean
    queueProperties: {
        inQueue: boolean
        time: any
        index: any
    }
    subcircuitMetadata: any
    objectType: string
    wasClicked: boolean
    deleted: boolean
    canShowInSubcircuit: boolean
    alwaysResolve: boolean
    propagationDelay: number
    propagationDelayFixed: boolean
    rectangleObject: boolean
    verilogType: string
    verilogLabel: string
    centerElement: boolean
    layoutProperties: any
    overrideDirectionRotation: boolean

    constructor(x: number, y: number, scope: any, dir: string, bitWidth: number) {
        // Data member initializations
        this.x = x
        this.y = y
        this.hover = false
        if (this.x === undefined || this.y === undefined) {
            this.x = simulationArea.mouseX
            this.y = simulationArea.mouseY
            this.newElement = true
            this.hover = true
        }
        this.deleteNodesWhenDeleted = true // FOR NOW - TO CHECK LATER
        this.nodeList = []
        this.clicked = false

        this.oldx = x
        this.oldy = y

        // The following attributes help in setting the touch area bound. They are the distances from the center.
        // Note they are all positive distances from center. They will automatically be rotated when direction is changed.
        // To stop the rotation when direction is changed, check overrideDirectionRotation attribute.
        this.leftDimensionX = 10
        this.rightDimensionX = 10
        this.upDimensionY = 10
        this.downDimensionY = 10

        this.label = ''
        this.scope = scope
        this.baseSetup()

        this.bitWidth = bitWidth || parseInt(prompt('Enter bitWidth') || '1', 10) || 1
        this.direction = dir
        this.directionFixed = false
        this.labelDirectionFixed = false
        this.labelDirection = oppositeDirection[dir]
        this.orientationFixed = true
        this.fixedBitWidth = false

        scheduleUpdate()

        this.queueProperties = {
            inQueue: false,
            time: undefined,
            index: undefined,
        }

        if (this.canShowInSubcircuit) {
            this.subcircuitMetadata = {
                showInSubcircuit: false, // if canShowInSubcircuit == true, showInSubcircuit determines wheter the user has added the element in the subcircuit
                showLabelInSubcircuit: true, // determines whether the label of the element is to be showin the subcircuit
                labelDirection: this.labelDirection, // determines the direction of the label of the element in the subcircuit
                // coordinates of the element in the subcircuit relative to the subcircuit
                x: 0,
                y: 0,
            }
        }
    }

    /**
     * Function to flip bits
     * @param val - the value of flipped bits
     * @returns The number of flipped bits
     */
    flipBits(val: number): number {
        return ((~val >>> 0) << (32 - this.bitWidth)) >>> (32 - this.bitWidth)
    }

    /**
     * Function to get absolute value of x coordinate of the element
     * @return absolute value of x
     */
    absX(): number {
        return this.x
    }

    /**
     * Function to get absolute value of y coordinate of the element
     * @return absolute value of y
     */
    absY(): number {
        return this.y
    }

    /**
     * adds the element to scopeList
     */
    baseSetup(): void {
        this.scope[this.objectType].push(this)
    }

    /**
     * Function to copy the circuit element obj to a new circuit element
     * @param obj - element to be copied from
     */
    copyFrom(obj: any): void {
        const properties = ['label', 'labelDirection']
        for (let i = 0; i < properties.length; i++) {
            if (obj[properties[i]] !== undefined) {
                this[properties[i]] = obj[properties[i]]
            }
        }
    }

    /**
     * Function to update the scope when a new element is added.
     * @param scope - the circuit in which we add element
     */
    updateScope(scope: any): void {
        this.scope = scope
        for (let i = 0; i < this.nodeList.length; i++) {
            this.nodeList[i].scope = scope
        }
    }

    /**
     * To generate JSON-safe data that can be loaded
     * @return the data to be saved
     */
    saveObject(): any {
        const data: any = {
            x: this.x,
            y: this.y,
            objectType: this.objectType,
            label: this.label,
            direction: this.direction,
            labelDirection: this.labelDirection,
            propagationDelay: this.propagationDelay,
            customData: this.customSave(),
        }

        if (this.canShowInSubcircuit)
            data.subcircuitMetadata = this.subcircuitMetadata
        return data
    }

    /**
     * Always overriden
     * @return the data to be saved
     */
    customSave(): any {
        return {
            values: {},
            nodes: {},
            constructorParamaters: [],
        }
    }

    /**
     * check hover over the element
     * @return boolean
     */
    checkHover(): void {
        if (simulationArea.mouseDown) return
        for (let i = 0; i < this.nodeList.length; i++) {
            this.nodeList[i].checkHover()
        }
        if (!simulationArea.mouseDown) {
            if (simulationArea.hover === this) {
                this.hover = this.isHover()
                if (!this.hover) simulationArea.hover = undefined
            } else if (!simulationArea.hover) {
                this.hover = this.isHover()
                if (this.hover) simulationArea.hover = this
            } else {
                this.hover = false
            }
        }
    }

    /**
     * This sets the width and height of the element if its rectangular
     * @param width - width
     * @param height - height
     */
    setDimensions(width: number, height: number): void {
        this.leftDimensionX = this.rightDimensionX = width
        this.downDimensionY = this.upDimensionY = height
    }

    /**
     * @param width - width
     */
    setWidth(width: number): void {
        this.leftDimensionX = this.rightDimensionX = width
    }

    /**
     * @param height - height
     */
    setHeight(height: number): void {
        this.downDimensionY = this.upDimensionY = height
    }

    /**
     * Helper Function to drag element to a new position
     */
    startDragging(): void {
        if (!layoutModeGet()) {
            this.oldx = this.x
            this.oldy = this.y
        } else {
            this.oldx = this.subcircuitMetadata.x
            this.oldy = this.subcircuitMetadata.y
        }
    }

    /**
     * Helper Function to drag element to a new position
     */
    drag(): void {
        if (!layoutModeGet()) {
            this.x =
                this.oldx + simulationArea.mouseX - simulationArea.mouseDownX
            this.y =
                this.oldy + simulationArea.mouseY - simulationArea.mouseDownY
        } else {
            this.subcircuitMetadata.x =
                this.oldx + simulationArea.mouseX - simulationArea.mouseDownX
            this.subcircuitMetadata.y =
                this.oldy + simulationArea.mouseY - simulationArea.mouseDownY
        }
    }

    /**
     * The update method is used to change the parameters of the object on mouse click and hover.
     * Return Value: true if state has changed else false
     */
    update(): any {
        if (layoutModeGet()) {
            return this.layoutUpdate()
        }
        let update: any = false

        update |= this.newElement
        if (this.newElement) {
            if (this.centerElement) {
                this.x =
                    Math.round(
                        (simulationArea.mouseX -
                            (this.rightDimensionX - this.leftDimensionX) / 2) /
                            10
                    ) * 10
                this.y =
                    Math.round(
                        (simulationArea.mouseY -
                            (this.downDimensionY - this.upDimensionY) / 2) /
                            10
                    ) * 10
            } else {
                this.x = simulationArea.mouseX
                this.y = simulationArea.mouseY
            }

            if (simulationArea.mouseDown) {
                this.newElement = false
                simulationArea.lastSelected = this
            } else return update
        }

        for (let i = 0; i < this.nodeList.length; i++) {
            update |= this.nodeList[i].update()
        }

        if (!simulationArea.hover || simulationArea.hover === this) {
            this.hover = this.isHover()
        }

        if (!simulationArea.mouseDown) this.hover = false

        if ((this.clicked || !simulationArea.hover) && this.isHover()) {
            this.hover = true
            simulationArea.hover = this
        } else if (
            !simulationArea.mouseDown &&
            this.hover &&
            this.isHover() === false
        ) {
            if (this.hover) simulationArea.hover = undefined
            this.hover = false
        }

        if (simulationArea.mouseDown && this.clicked) {
            this.drag()
            if (
                !simulationArea.shiftDown &&
                simulationArea.multipleObjectSelections.includes(this)
            ) {
                for (
                    let i = 0;
                    i < simulationArea.multipleObjectSelections.length;
                    i++
                ) {
                    simulationArea.multipleObjectSelections[i].drag()
                }
            }

            update |= true
        } else if (simulationArea.mouseDown && !simulationArea.selected) {
            this.startDragging()
            if (
                !simulationArea.shiftDown &&
                simulationArea.multipleObjectSelections.includes(this)
            ) {
                for (
                    let i = 0;
                    i < simulationArea.multipleObjectSelections.length;
                    i++
                ) {
                    simulationArea.multipleObjectSelections[i].startDragging()
                }
            }
            simulationArea.selected = this.clicked = this.hover

            update |= this.clicked
        } else {
            if (this.clicked) simulationArea.selected = false
            this.clicked = false
            this.wasClicked = false
            // If this is SubCircuit, then call releaseClick to recursively release clicks on each subcircuit object
            if (this.objectType == 'SubCircuit') (this as any).releaseClick()
        }

        if (simulationArea.mouseDown && !this.wasClicked) {
            if (this.clicked) {
                this.wasClicked = true
                if ((this as any).click) (this as any).click()
                if (simulationArea.shiftDown) {
                    simulationArea.lastSelected = undefined
                    if (
                        simulationArea.multipleObjectSelections.includes(this)
                    ) {
                        simulationArea.multipleObjectSelections = simulationArea.multipleObjectSelections.filter(x => x !== this);
                    } else {
                        simulationArea.multipleObjectSelections.push(this)
                    }
                } else {
                    simulationArea.lastSelected = this
                }
            }
        }

        return update
    }

    /**
     * Used to update the state of the elements inside the subcircuit in layout mode
     */
    layoutUpdate(): any {
        let update: any = false
        update |= this.newElement
        if (this.newElement) {
            this.subcircuitMetadata.x = simulationArea.mouseX
            this.subcircuitMetadata.y = simulationArea.mouseY

            if (simulationArea.mouseDown) {
                this.newElement = false
                simulationArea.lastSelected = this
            } else return
        }

        if (!simulationArea.hover || simulationArea.hover == this)
            this.hover = this.isHover()

        if ((this.clicked || !simulationArea.hover) && this.isHover()) {
            this.hover = true
            simulationArea.hover = this
        } else if (
            !simulationArea.mouseDown &&
            this.hover &&
            this.isHover() == false
        ) {
            if (this.hover) simulationArea.hover = undefined
            this.hover = false
        }

        if (simulationArea.mouseDown && this.clicked) {
            this.drag()
            update |= true
        } else if (simulationArea.mouseDown && !simulationArea.selected) {
            this.startDragging()
            simulationArea.selected = this.clicked = this.hover
            update |= this.clicked
        } else {
            if (this.clicked) simulationArea.selected = false
            this.clicked = false
            this.wasClicked = false
        }

        if (simulationArea.mouseDown && !this.wasClicked) {
            if (this.clicked) {
                this.wasClicked = true
                simulationArea.lastSelected = this
            }
        }

        if (!this.clicked && !this.newElement) {
            const x = this.subcircuitMetadata.x
            const y = this.subcircuitMetadata.y
            const yy = tempBuffer.layout.height
            const xx = tempBuffer.layout.width

            const rX = this.layoutProperties.rightDimensionX
            const lX = this.layoutProperties.leftDimensionX
            const uY = this.layoutProperties.upDimensionY
            const dY = this.layoutProperties.downDimensionY

            if (lX <= x && x + rX <= xx && y >= uY && y + dY <= yy) return

            this.subcircuitMetadata.showInSubcircuit = false
            fillSubcircuitElements()
        }

        return update
    }

    /**
     * Helper Function to correct the direction of element
     */
    fixDirection(): void {
        this.direction = fixDirection[this.direction] || this.direction
        this.labelDirection =
            fixDirection[this.labelDirection] || this.labelDirection
    }

    /**
     * The isHover method is used to check if the mouse is hovering over the object.
     * Return Value: true if mouse is hovering over object else false
     */
    isHover(): boolean {
        let mX = simulationArea.touch ? simulationArea.mouseDownX - this.x : simulationArea.mouseXf - this.x;
        let mY = simulationArea.touch ? this.y - simulationArea.mouseDownY : this.y - simulationArea.mouseYf;

        let rX = this.rightDimensionX
        let lX = this.leftDimensionX
        let uY = this.upDimensionY
        let dY = this.downDimensionY

        if (layoutModeGet()) {
            mX = simulationArea.mouseXf - this.subcircuitMetadata.x
            mY = this.subcircuitMetadata.y - simulationArea.mouseYf

            rX = this.layoutProperties.rightDimensionX
            lX = this.layoutProperties.leftDimensionX
            uY = this.layoutProperties.upDimensionY
            dY = this.layoutProperties.downDimensionY
        }

        if (!this.directionFixed && !this.overrideDirectionRotation) {
            if (this.direction === 'LEFT') {
                lX = this.rightDimensionX
                rX = this.leftDimensionX
            } else if (this.direction === 'DOWN') {
                lX = this.downDimensionY
                rX = this.upDimensionY
                uY = this.leftDimensionX
                dY = this.rightDimensionX
            } else if (this.direction === 'UP') {
                lX = this.downDimensionY
                rX = this.upDimensionY
                dY = this.leftDimensionX
                uY = this.rightDimensionX
            }
        }

        return -lX <= mX && mX <= rX && -dY <= mY && mY <= uY
    }

    /**
     * Check if hovering over element in subcircuit
     */
    isSubcircuitHover(xoffset: number = 0, yoffset: number = 0): boolean {
        const mX = simulationArea.mouseXf - this.subcircuitMetadata.x - xoffset
        const mY = yoffset + this.subcircuitMetadata.y - simulationArea.mouseYf

        const rX = this.layoutProperties.rightDimensionX
        const lX = this.layoutProperties.leftDimensionX
        const uY = this.layoutProperties.upDimensionY
        const dY = this.layoutProperties.downDimensionY

        return -lX <= mX && mX <= rX && -dY <= mY && mY <= uY
    }

    /**
     * Helper Function to set label of an element.
     * @param label - the label for element
     */
    setLabel(label: string): void {
        this.label = label || ''
    }

    /**
     * Method that draws the outline of the module and calls draw function on module Nodes.
     */
    draw(): void {
        //
        const ctx = simulationArea.context
        this.checkHover()

        if (
            this.x * this.scope.scale + this.scope.ox <
                -this.rightDimensionX * this.scope.scale - 0 ||
            this.x * this.scope.scale + this.scope.ox >
                width + this.leftDimensionX * this.scope.scale + 0 ||
            this.y * this.scope.scale + this.scope.oy <
                -this.downDimensionY * this.scope.scale - 0 ||
            this.y * this.scope.scale + this.scope.oy >
                height + 0 + this.upDimensionY * this.scope.scale
        )
            return

        // Draws rectangle and highlights
        if (this.rectangleObject) {
            ctx.strokeStyle = colors['stroke']
            ctx.fillStyle = colors['fill']
            ctx.lineWidth = correctWidth(3)
            ctx.beginPath()
            rect2(
                ctx,
                -this.leftDimensionX,
                -this.upDimensionY,
                this.leftDimensionX + this.rightDimensionX,
                this.upDimensionY + this.downDimensionY,
                this.x,
                this.y,
                [this.direction, 'RIGHT'][+this.directionFixed]
            )
            if (
                (this.hover && !simulationArea.shiftDown) ||
                simulationArea.lastSelected === this ||
                simulationArea.multipleObjectSelections.includes(this)
            )
                ctx.fillStyle = colors['hover_select']
            ctx.fill()
            ctx.stroke()
        }
        if (this.label !== '') {
            let rX = this.rightDimensionX
            let lX = this.leftDimensionX
            let uY = this.upDimensionY
            let dY = this.downDimensionY
            if (!this.directionFixed) {
                if (this.direction === 'LEFT') {
                    lX = this.rightDimensionX
                    rX = this.leftDimensionX
                } else if (this.direction === 'DOWN') {
                    lX = this.downDimensionY
                    rX = this.upDimensionY
                    uY = this.leftDimensionX
                    dY = this.rightDimensionX
                } else if (this.direction === 'UP') {
                    lX = this.downDimensionY
                    rX = this.upDimensionY
                    dY = this.leftDimensionX
                    uY = this.rightDimensionX
                }
            }

            if (this.labelDirection === 'LEFT') {
                ctx.beginPath()
                ctx.textAlign = 'right'
                ctx.fillStyle = colors['text']
                fillText(ctx, this.label, this.x - lX - 10, this.y + 5, 14)
                ctx.fill()
            } else if (this.labelDirection === 'RIGHT') {
                ctx.beginPath()
                ctx.textAlign = 'left'
                ctx.fillStyle = colors['text']
                fillText(ctx, this.label, this.x + rX + 10, this.y + 5, 14)
                ctx.fill()
            } else if (this.labelDirection === 'UP') {
                ctx.beginPath()
                ctx.textAlign = 'center'
                ctx.fillStyle = colors['text']
                fillText(ctx, this.label, this.x, this.y + 5 - uY - 10, 14)
                ctx.fill()
            } else if (this.labelDirection === 'DOWN') {
                ctx.beginPath()
                ctx.textAlign = 'center'
                ctx.fillStyle = colors['text']
                fillText(ctx, this.label, this.x, this.y + 5 + dY + 10, 14)
                ctx.fill()
            }
        }

        // calls the custom circuit design
        if ((this as any).customDraw) {
            (this as any).customDraw()
        }

        // draws nodes - Moved to renderCanvas
        // for (let i = 0; i < this.nodeList.length; i++)
        //     this.nodeList[i].draw();
    }

    /**
     * Draws element in layout mode (inside the subcircuit)
     * @param xOffset - x position of the subcircuit
     * @param yOffset - y position of the subcircuit
     */
    drawLayoutMode(xOffset: number = 0, yOffset: number = 0): void {
        const ctx = simulationArea.context
        if (layoutModeGet()) {
            this.checkHover()
        }
        if (
            this.subcircuitMetadata.x * this.scope.scale + this.scope.ox <
                -this.layoutProperties.rightDimensionX * this.scope.scale ||
            this.subcircuitMetadata.x * this.scope.scale + this.scope.ox >
                width +
                    this.layoutProperties.leftDimensionX * this.scope.scale ||
            this.subcircuitMetadata.y * this.scope.scale + this.scope.oy <
                -this.layoutProperties.downDimensionY * this.scope.scale ||
            this.subcircuitMetadata.y * this.scope.scale + this.scope.oy >
                height + this.layoutProperties.upDimensionY * this.scope.scale
        )
            return

        if (this.subcircuitMetadata.showLabelInSubcircuit) {
            const rX = this.layoutProperties.rightDimensionX
            const lX = this.layoutProperties.leftDimensionX
            const uY = this.layoutProperties.upDimensionY
            const dY = this.layoutProperties.downDimensionY

            // this.subcircuitMetadata.labelDirection
            if (this.subcircuitMetadata.labelDirection == 'LEFT') {
                ctx.beginPath()
                ctx.textAlign = 'right'
                ctx.fillStyle = 'black'
                fillText(
                    ctx,
                    this.label,
                    this.subcircuitMetadata.x + xOffset - lX - 10,
                    this.subcircuitMetadata.y + yOffset + 5,
                    10
                )
                ctx.fill()
            } else if (this.subcircuitMetadata.labelDirection == 'RIGHT') {
                ctx.beginPath()
                ctx.textAlign = 'left'
                ctx.fillStyle = 'black'
                fillText(
                    ctx,
                    this.label,
                    this.subcircuitMetadata.x + xOffset + rX + 10,
                    this.subcircuitMetadata.y + yOffset + 5,
                    10
                )
                ctx.fill()
            } else if (this.subcircuitMetadata.labelDirection == 'UP') {
                ctx.beginPath()
                ctx.textAlign = 'center'
                ctx.fillStyle = 'black'
                fillText(
                    ctx,
                    this.label,
                    this.subcircuitMetadata.x + xOffset,
                    this.subcircuitMetadata.y + yOffset + 5 - uY - 10,
                    10
                )
                ctx.fill()
            } else if (this.subcircuitMetadata.labelDirection == 'DOWN') {
                ctx.beginPath()
                ctx.textAlign = 'center'
                ctx.fillStyle = 'black'
                fillText(
                    ctx,
                    this.label,
                    this.subcircuitMetadata.x + xOffset,
                    this.subcircuitMetadata.y + yOffset + 5 + dY + 10,
                    10
                )
                ctx.fill()
            }
        }
        // calls the subcircuitDraw function in the element to draw it to canvas
        (this as any).subcircuitDraw(xOffset, yOffset)
    }

    /**
     * method to delete object
     * OVERRIDE WITH CAUTION
     */
    delete(): void {
        simulationArea.lastSelected = undefined
        this.scope[this.objectType] = this.scope[this.objectType].filter(x => x !== this)
        if (this.deleteNodesWhenDeleted) {
            this.deleteNodes()
        } else {
            for (let i = 0; i < this.nodeList.length; i++) {
                if (this.nodeList[i].connections.length) {
                    this.nodeList[i].converToIntermediate()
                } else {
                    this.nodeList[i].delete()
                }
            }
        }
        this.deleted = true
    }

    /**
     * method to delete object
     * OVERRIDE WITH CAUTION
     */
    cleanDelete(): void {
        this.deleteNodesWhenDeleted = true
        this.delete()
    }

    /**
     * Helper Function to delete the element and all the node attached to it.
     */
    deleteNodes(): void {
        for (let i = 0; i < this.nodeList.length; i++) {
            this.nodeList[i].delete()
        }
    }

    /**
     * method to change direction
     * OVERRIDE WITH CAUTION
     * @param dir - new direction
     */
    newDirection(dir: string): void {
        if (this.direction === dir) return
        // Leave this for now
        if (this.directionFixed && this.orientationFixed) return
        if (this.directionFixed) {
            this.newOrientation(dir)
            return // Should it return ?
        }

        // if (obj.direction === undefined) return;
        this.direction = dir
        for (let i = 0; i < this.nodeList.length; i++) {
            this.nodeList[i].refresh()
        }
    }

    /**
     * Method to change orientation
     * @param dir - new direction
     */
    newOrientation(dir: string): void {
        // Override in subclass if needed
    }

    /**
     * Helper Function to change label direction of the element.
     * @param dir - new direction
     */
    newLabelDirection(dir: string): void {
        if (layoutModeGet()) this.subcircuitMetadata.labelDirection = dir
        else this.labelDirection = dir
    }

    /**
     * Method to check if object can be resolved
     * OVERRIDE if necessary
     * @return boolean
     */
    isResolvable(): boolean {
        if (this.alwaysResolve) return true
        for (let i = 0; i < this.nodeList.length; i++) {
            if (
                this.nodeList[i].type === 0 &&
                this.nodeList[i].value === undefined
            )
                return false
        }
        return true
    }

    /**
     * Method to change object Bitwidth
     * OVERRIDE if necessary
     * @param bitWidth - new bitwidth
     */
    newBitWidth(bitWidth: number): void {
        if (this.fixedBitWidth) return
        if (this.bitWidth === undefined) return
        if (this.bitWidth < 1) return
        this.bitWidth = bitWidth
        for (let i = 0; i < this.nodeList.length; i++) {
            this.nodeList[i].bitWidth = bitWidth
        }
    }

    /**
     * Method to change object delay
     * OVERRIDE if necessary
     * @param delay - new delay
     */
    changePropagationDelay(delay: any): void {
        if (this.propagationDelayFixed) return
        if (delay === undefined) return
        if (delay === '') return
        const tmpDelay = parseInt(delay, 10)
        if (tmpDelay < 0) return
        this.propagationDelay = tmpDelay
    }

    /**
     * Dummy resolve function
     * OVERRIDE if necessary
     */
    resolve(): void {}

    /**
     * Helper Function to process Verilog
     */
    processVerilog(): void {
        // Output count used to sanitize output
        let output_total = 0
        for (let i = 0; i < this.nodeList.length; i++) {
            if (
                this.nodeList[i].type == NODE_OUTPUT &&
                this.nodeList[i].connections.length > 0
            )
                output_total++
        }

        let output_count = 0
        for (let i = 0; i < this.nodeList.length; i++) {
            if (this.nodeList[i].type == NODE_OUTPUT) {
                if (
                    this.objectType != 'Input' &&
                    this.objectType != 'Clock' &&
                    this.nodeList[i].connections.length > 0
                ) {
                    this.nodeList[i].verilogLabel = generateNodeName(
                        this.nodeList[i],
                        output_count,
                        output_total
                    )

                    if (
                        !this.scope.verilogWireList[
                            this.nodeList[i].bitWidth
                        ].includes(this.nodeList[i].verilogLabel)
                    )
                        this.scope.verilogWireList[
                            this.nodeList[i].bitWidth
                        ].push(this.nodeList[i].verilogLabel)
                    output_count++
                }
                this.scope.stack.push(this.nodeList[i])
            }
        }
    }

    /**
     * Helper Function to check if verilog resolvable
     * @return boolean
     */
    isVerilogResolvable(): boolean {
        const backupValues: any[] = []
        for (let i = 0; i < this.nodeList.length; i++) {
            backupValues.push(this.nodeList[i].value)
            this.nodeList[i].value = undefined
        }

        for (let i = 0; i < this.nodeList.length; i++) {
            if (this.nodeList[i].verilogLabel) {
                this.nodeList[i].value = 1
            }
        }

        const res = this.isResolvable()

        for (let i = 0; i < this.nodeList.length; i++) {
            this.nodeList[i].value = backupValues[i]
        }

        return res
    }

    /**
     * Helper Function to remove proporgation.
     */
    removePropagation(): void {
        for (let i = 0; i < this.nodeList.length; i++) {
            if (this.nodeList[i].type === NODE_OUTPUT) {
                if (this.nodeList[i].value !== undefined) {
                    this.nodeList[i].value = undefined
                    simulationArea.simulationQueue.add(this.nodeList[i])
                }
            }
        }
    }

    /**
     * Helper Function to name the verilog.
     * @return string
     */
    verilogName(): string {
        return this.verilogType || this.objectType
    }

    /**
     * Returns base type for verilog
     */
    verilogBaseType(): string {
        return this.verilogName()
    }

    /**
     * Returns parametrized type for verilog
     */
    verilogParametrizedType(): string {
        let type = this.verilogBaseType()
        // Suffix bitwidth for multi-bit inputs
        // Example: DflipFlop #(2) DflipFlop_0
        if (this.bitWidth != undefined && this.bitWidth > 1)
            type += ' #(' + this.bitWidth + ')'
        return type
    }

    /**
     * Helper Function to generate Verilog.
     * @return string
     */
    generateVerilog(): string {
        // Example: and and_1(_out, _out, _Q[0]);
        const inputs: any[] = []
        const outputs: any[] = []

        for (let i = 0; i < this.nodeList.length; i++) {
            if (this.nodeList[i].type == NODE_INPUT) {
                inputs.push(this.nodeList[i])
            } else {
                if (this.nodeList[i].connections.length > 0)
                    outputs.push(this.nodeList[i])
                else outputs.push('') // Don't create a wire
            }
        }

        const list = outputs.concat(inputs)
        let res = this.verilogParametrizedType()
        const moduleParams = list.map((x) => x.verilogLabel).join(', ')
        res += ` ${this.verilogLabel}(${moduleParams});`
        return res
    }

    /**
     * Toggles the visibility of the labels of subcircuit elements.
     */
    toggleLabelInLayoutMode(): void {
        this.subcircuitMetadata.showLabelInSubcircuit =
            !this.subcircuitMetadata.showLabelInSubcircuit
    }
}

CircuitElement.prototype.alwaysResolve = false
CircuitElement.prototype.propagationDelay = 10
CircuitElement.prototype.tooltip = undefined
CircuitElement.prototype.propagationDelayFixed = false
CircuitElement.prototype.rectangleObject = true
CircuitElement.prototype.objectType = 'CircuitElement'
CircuitElement.prototype.canShowInSubcircuit = false // determines whether the element is supported to be shown inside a subcircuit
CircuitElement.prototype.subcircuitMetadata = {} // stores the coordinates and stuff for the elements in the subcircuit
CircuitElement.prototype.layoutProperties = {
    rightDimensionX: 5,
    leftDimensionX: 5,
    upDimensionY: 5,
    downDimensionY: 5,
}
CircuitElement.prototype.subcircuitMutableProperties = {
    label: {
        name: 'label: ',
        type: 'text',
        func: 'setLabel',
    },
    'show label': {
        name: 'show label ',
        type: 'checkbox',
        func: 'toggleLabelInLayoutMode',
    },
}
