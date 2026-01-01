/* eslint-disable import/no-cycle */
import { drawCircle, drawLine, arc } from './canvasApi';
import { simulationArea } from './simulationArea';
import { distance, showError } from './utils';
import {
    renderCanvas,
    scheduleUpdate,
    wireToBeCheckedSet,
    updateSimulationSet,
    updateCanvasSet,
    forceResetNodesSet,
    canvasMessageData,
} from './engine';
import Wire from './wire';
import { colors } from './themer/themer';
import ContentionMeta from './contention'

/** Node type constants */
export const NODE_INPUT = 0;
export const NODE_OUTPUT = 1;
export const NODE_INTERMEDIATE = 2;

type NodeType = 0 | 1 | 2;
type Direction = 'LEFT' | 'RIGHT' | 'UP' | 'DOWN';
type DragState = 'a' | 'x' | 'y';

interface QueueProperties {
    inQueue: boolean;
    time: number | undefined;
    index: number | undefined;
}

interface NodeSaveData {
    x: number;
    y: number;
    type: NodeType;
    bitWidth: number;
    label: string;
    connections: number[];
}

/**
 * Workaround interface for CircuitElement (JS dependency)
 * TODO: Replace with actual CircuitElement type when circuitElement.js is migrated
 */
interface CircuitElementLike {
    objectType: string;
    scope: ScopeLike;
    x: number;
    y: number;
    direction: Direction;
    bitWidth: number;
    nodeList?: Node[];
    isResolvable?: () => boolean;
    removePropagation?: () => void;
    isVerilogResolvable?: () => boolean;
    state?: { value: number | undefined };
    queueProperties?: QueueProperties;
}

/**
 * Workaround interface for Scope (JS dependency)
 * TODO: Replace with actual Scope type when fully defined
 */
interface ScopeLike {
    allNodes: Node[];
    nodes: Node[];
    wires: Wire[];
    root: CircuitElementLike;
    timeStamp: number;
    stack: (Node | CircuitElementLike)[];
}

// Global declarations for JS dependencies
declare const globalScope: ScopeLike;
declare const embed: boolean;

// Backward compatibility: maintain window properties
declare global {
    interface Window {
        NODE_INPUT: number;
        NODE_OUTPUT: number;
        NODE_INTERMEDIATE: number;
    }
}

if (typeof window !== 'undefined') {
    window.NODE_INPUT = NODE_INPUT;
    window.NODE_OUTPUT = NODE_OUTPUT;
    window.NODE_INTERMEDIATE = NODE_INTERMEDIATE;
}


/**
 * Used to give id to a node.
 * @category node
 */
let uniqueIdCounter = 10;


function rotate(x1: number, y1: number, dir: Direction): [number, number] {
    if (dir === 'LEFT') {
        return [-x1, y1];
    }
    if (dir === 'DOWN') {
        return [y1, x1];
    }
    if (dir === 'UP') {
        return [y1, -x1];
    }
    return [x1, y1];
}

export function extractBits(num: number, start: number, end: number): number {
    return (num << (32 - end)) >>> (32 - (end - start + 1));
}

export function bin2dec(binString: string): number {
    return parseInt(binString, 2);
}

export function dec2bin(dec: number, bitWidth?: number): string {
    // only for positive nos
    const bin = dec.toString(2);
    if (bitWidth === undefined) return bin;
    return '0'.repeat(bitWidth - bin.length) + bin;
}

/**
 * Constructs all the connections of Node node
 * @param node - node to be constructed
 * @param data - the saved data which is used to load
 * @category node
 */
export function constructNodeConnections(node: Node, data: NodeSaveData): void {
    for (let i = 0; i < data.connections.length; i++) {
        if (
            !node.connections.includes(node.scope.allNodes[data.connections[i]])
        )
            node.connect(node.scope.allNodes[data.connections[i]]);
    }
}

/**
 * Fn to replace node by node @ index in global Node List - used when loading
 * @param node - node to be replaced
 * @param index - index of node to be replaced
 * @category node
 */
export function replace(node: Node, index: number): Node {
    if (index === -1) {
        return node;
    }
    const { scope } = node;
    const { parent } = node;
    parent.nodeList = parent.nodeList?.filter(x => x !== node) ?? [];
    node.delete();
    const replacementNode = scope.allNodes[index];
    replacementNode.parent = parent;
    parent.nodeList?.push(replacementNode);
    replacementNode.updateRotation();
    replacementNode.scope.timeStamp = new Date().getTime();
    return replacementNode;
}

/**
 * Find Index of a node
 * @param x - Node to be found
 * @category node
 */
export function findNode(x: Node): number {
    return x.scope.allNodes.indexOf(x);
}

/**
 * Function makes a node according to data provided
 * @param data - the data used to load a Project
 * @param scope - scope to which node has to be loaded
 * @category node
 */
export function loadNode(data: NodeSaveData, scope: ScopeLike): Node {
    return new Node(
        data.x,
        data.y,
        data.type,
        scope.root,
        data.bitWidth,
        data.label
    );
}

/**
 * Get Node in index x in scope and set parent
 * @param x - the desired node index
 * @param scope - the scope
 * @param parent - The parent of node
 * @category node
 */
function extractNode(x: number, scope: ScopeLike, parent: CircuitElementLike): Node {
    const n = scope.allNodes[x];
    n.parent = parent;
    return n;
}


/**
 * This class is responsible for all the Nodes. Nodes are connected using Wires.
 * Nodes are of 3 types:
 * NODE_INPUT = 0
 * NODE_OUTPUT = 1
 * NODE_INTERMEDIATE = 2
 * Input and output nodes belong to some CircuitElement (it's parent)
 * @category node
 */
export default class Node {
    objectType: 'Node' = 'Node';
    subcircuitOverride: boolean = false;
    id!: string;
    parent!: CircuitElementLike;
    bitWidth!: number;
    label!: string;
    prevx: number | undefined;
    prevy: number | undefined;
    leftx!: number;
    lefty!: number;
    x!: number;
    y!: number;
    type!: NodeType;
    connections!: Node[];
    value: number | undefined;
    radius: number = 5;
    clicked: boolean = false;
    hover: boolean = false;
    wasClicked: boolean = false;
    scope!: ScopeLike;
    /**
     * Value of this.prev:
     * 'a' : whenever a node is not being dragged this.prev is 'a'
     * 'x' : when node is being dragged horizontally
     * 'y' : when node is being dragged vertically
     */
    prev: DragState = 'a';
    count: number = 0;
    highlighted: boolean = false;
    oldx?: number;
    oldy?: number;
    deleted?: boolean;
    showHover?: boolean;
    verilogLabel?: string;
    queueProperties!: QueueProperties;
    propagationDelay: number = 0;

    constructor(
        x: number,
        y: number,
        type: NodeType,
        parent: CircuitElementLike,
        bitWidth?: number,
        label: string = ''
    ) {
        // Should never raise, but just in case
        if (isNaN(x) || isNaN(y)) {
            this.delete();
            showError('Fatal error occurred');
            return;
        }

        forceResetNodesSet(true);

        this.id = `node${uniqueIdCounter}`;
        uniqueIdCounter++;
        this.parent = parent;
        if (type !== NODE_INTERMEDIATE && this.parent.nodeList !== undefined) {
            this.parent.nodeList.push(this);
        }

        if (bitWidth === undefined) {
            this.bitWidth = parent.bitWidth;
        } else {
            this.bitWidth = bitWidth;
        }
        this.label = label;
        this.prevx = undefined;
        this.prevy = undefined;
        this.leftx = x;
        this.lefty = y;
        this.x = x;
        this.y = y;

        this.type = type;
        this.connections = [];
        this.value = undefined;
        this.scope = this.parent.scope;
        this.scope.timeStamp = new Date().getTime();

        // This fn is called during rotations and setup
        this.refresh();

        if (this.type === NODE_INTERMEDIATE) {
            this.parent.scope.nodes.push(this);
        }

        this.parent.scope.allNodes.push(this);

        this.queueProperties = {
            inQueue: false,
            time: undefined,
            index: undefined,
        };
    }

    /**
     * Function to set label
     * @param label - new label
     */
    setLabel(label: string): void {
        this.label = label;
    }

    /**
     * Function to convert a node to intermediate node
     */
    converToIntermediate(): void {
        this.type = NODE_INTERMEDIATE;
        this.x = this.absX();
        this.y = this.absY();
        this.parent = this.scope.root;
        this.scope.nodes.push(this);
    }

    /**
     * Helper function to move a node. Sets up some variable which help in changing node.
     */
    startDragging(): void {
        this.oldx = this.x;
        this.oldy = this.y;
    }

    /**
     * Helper function to move a node.
     */
    drag(): void {
        this.x = (this.oldx ?? 0) + simulationArea.mouseX - simulationArea.mouseDownX;
        this.y = (this.oldy ?? 0) + simulationArea.mouseY - simulationArea.mouseDownY;
    }

    /**
     * Function for saving a node
     */
    saveObject(): NodeSaveData {
        if (this.type === NODE_INTERMEDIATE) {
            this.leftx = this.x;
            this.lefty = this.y;
        }
        const data: NodeSaveData = {
            x: this.leftx,
            y: this.lefty,
            type: this.type,
            bitWidth: this.bitWidth,
            label: this.label,
            connections: [],
        };
        for (let i = 0; i < this.connections.length; i++) {
            data.connections.push(findNode(this.connections[i]));
        }
        return data;
    }

    /**
     * Helper function to help rotating parent
     */
    updateRotation(): void {
        const [x, y] = rotate(this.leftx, this.lefty, this.parent.direction);
        this.x = x;
        this.y = y;
    }

    /**
     * Refreshes a node after rotation of parent
     */
    refresh(): void {
        this.updateRotation();
        for (let i = 0; i < this.connections.length; i++) {
            this.connections[i].connections = this.connections[i].connections.filter(x => x !== this);
        }
        this.scope.timeStamp = new Date().getTime();
        this.connections = [];
    }

    /**
     * Gives absolute x position of the node
     */
    absX(): number {
        return this.x + this.parent.x;
    }

    /**
     * Gives absolute y position of the node
     */
    absY(): number {
        return this.y + this.parent.y;
    }

    /**
     * Update the scope of a node
     */
    updateScope(scope: ScopeLike): void {
        this.scope = scope;
        if (this.type === NODE_INTERMEDIATE) this.parent = scope.root;
    }

    /**
     * Return true if node is connected or not connected but false if undefined.
     */
    isResolvable(): boolean {
        return this.value !== undefined;
    }

    /**
     * Function used to reset the nodes
     */
    reset(): void {
        this.value = undefined;
        this.highlighted = false;
    }

    /**
     * Function to connect two nodes.
     */
    connect(n: Node): void {
        if (n === this) return;
        if (n.connections.includes(this)) {
            return;
        }
        new Wire(this, n, this.parent.scope as any);
        this.connections.push(n);
        n.connections.push(this);

        this.scope.timeStamp = new Date().getTime();

        updateCanvasSet(true);
        updateSimulationSet(true);
        scheduleUpdate();
    }

    /**
     * Connects but doesn't draw the wire between nodes
     */
    connectWireLess(n: Node): void {
        if (n === this) return;
        if (n.connections.includes(this)) return;
        this.connections.push(n);
        n.connections.push(this);

        this.scope.timeStamp = new Date().getTime();

        updateSimulationSet(true);
        scheduleUpdate();
    }

    /**
     * Disconnecting two nodes connected wirelessly
     */
    disconnectWireLess(n: Node): void {
        this.connections = this.connections.filter(x => x !== n);
        n.connections = n.connections.filter(x => x !== this);

        this.scope.timeStamp = new Date().getTime();
    }

    /**
     * Function to resolve a node
     */
    resolve(): void {
        // Type assertion for simulationArea with contentionPending
        const simArea = simulationArea as any;

        if (this.type === NODE_OUTPUT) {
            // Since output node forces its value on its neighbours, remove its contentions.
            // An existing contention will now trickle to the other output node that was causing
            // the contention.
            simArea.contentionPending?.removeAllContentionsForNode(this);
        }

        // Remove Propagation of values (TriState)
        if (this.value === undefined) {
            for (let i = 0; i < this.connections.length; i++) {
                if (this.connections[i].value !== undefined) {
                    this.connections[i].value = undefined;
                    // TODO: Remove 'any' cast when EventQueue.add() signature is properly typed
                    (simulationArea.simulationQueue as any).add(this.connections[i]);
                }
            }

            if (this.type === NODE_INPUT) {
                if (this.parent.objectType === 'Splitter') {
                    this.parent.removePropagation?.();
                } else if (this.parent.isResolvable?.()) {
                    // TODO: Remove 'any' cast when EventQueue.add() signature is properly typed
                    (simulationArea.simulationQueue as any).add(this.parent);
                } else {
                    this.parent.removePropagation?.();
                }
            }

            if (this.type === NODE_OUTPUT && !this.subcircuitOverride) {
                if (
                    this.parent.isResolvable?.() &&
                    !this.parent.queueProperties?.inQueue
                ) {
                    if (this.parent.objectType === 'TriState' || this.parent.objectType === 'ControlledInverter') {
                        if (this.parent.state?.value) {
                            // TODO: Remove 'any' cast when EventQueue.add() signature is properly typed
                            (simulationArea.simulationQueue as any).add(this.parent);
                        }
                    } else {
                        // TODO: Remove 'any' cast when EventQueue.add() signature is properly typed
                        (simulationArea.simulationQueue as any).add(this.parent);
                    }
                }
            }

            return;
        }

        // For input nodes, resolve its parents if they are resolvable at this point.
        if (this.type === NODE_INPUT) {
            if (this.parent.isResolvable?.()) {
                // TODO: Remove 'any' cast when EventQueue.add() signature is properly typed
                (simulationArea.simulationQueue as any).add(this.parent);
            }
        } else if (this.type === NODE_OUTPUT) {
            // Since output node forces its value on its neighbours, remove its contentions.
            // An existing contention will now trickle to the other output node that was causing
            // the contention.
            simArea.contentionPending?.removeAllContentionsForNode(this);
        }

        for (let i = 0; i < this.connections.length; i++) {
            const node = this.connections[i];

            switch (node.type) {
                // TODO: For an output node, a downstream value (value given by elements other than the parent)
                // should be overwritten in contention check and should not cause contention.
                case NODE_OUTPUT:
                    if (node.value !== this.value || node.bitWidth !== this.bitWidth) {
                        // Check contentions
                        if (node.value !== undefined && node.parent.objectType !== 'SubCircuit'
                            && !(node.subcircuitOverride && node.scope !== this.scope)) {
                            // Tristate has always been a pain in the ass.
                            if ((node.parent.objectType === 'TriState' || node.parent.objectType === 'ControlledInverter') && node.value !== undefined) {
                                if (node.parent.state?.value) {
                                    simArea.contentionPending?.add(node, this);
                                    break;
                                }
                            } else {
                                simArea.contentionPending?.add(node, this);
                                break;
                            }
                        }
                    } else {
                        // Output node was given an agreeing value, so remove any contention
                        // entry between these two nodes if it exists.
                        simArea.contentionPending?.remove(node, this);
                    }

                // Fallthrough intentional: NODE_OUTPUT propagates like a contention checked NODE_INPUT
                // falls through
                case NODE_INPUT:
                    // Check bitwidths
                    if (this.bitWidth !== node.bitWidth) {
                        this.highlighted = true;
                        node.highlighted = true;
                        showError(`BitWidth Error: ${this.bitWidth} and ${node.bitWidth}`);
                        break;
                    }

                // Fallthrough intentional: NODE_INPUT propagates like a bitwidth checked NODE_INTERMEDIATE
                // falls through
                case NODE_INTERMEDIATE:
                    if (node.value !== this.value || node.bitWidth !== this.bitWidth) {
                        // Propagate
                        node.bitWidth = this.bitWidth;
                        node.value = this.value;
                        // TODO: Remove 'any' cast when EventQueue.add() signature is properly typed
                        (simulationArea.simulationQueue as any).add(node);
                    }
                    break;

                default:
                    break;
            }
        }
    }

    /**
     * This function checks if hover over the node
     */
    checkHover(): void {
        const simArea = simulationArea as any;
        if (!simulationArea.mouseDown) {
            if (simArea.hover === this) {
                this.hover = this.isHover();
                if (!this.hover) {
                    simArea.hover = undefined;
                    this.showHover = false;
                }
            } else if (!simArea.hover) {
                this.hover = this.isHover();
                if (this.hover) {
                    simArea.hover = this;
                } else {
                    this.showHover = false;
                }
            } else {
                this.hover = false;
                this.showHover = false;
            }
        }
    }

    /**
     * This function draws a node
     */
    draw(): void {
        const ctx = simulationArea.context;
        if (!ctx) return;

        const simArea = simulationArea as any;
        const color = colors['color_wire_draw'];

        if (this.clicked) {
            if (this.prev === 'x') {
                drawLine(
                    ctx,
                    this.absX(),
                    this.absY(),
                    simulationArea.mouseX,
                    this.absY(),
                    color,
                    3
                );
                drawLine(
                    ctx,
                    simulationArea.mouseX,
                    this.absY(),
                    simulationArea.mouseX,
                    simulationArea.mouseY,
                    color,
                    3
                );
            } else if (this.prev === 'y') {
                drawLine(
                    ctx,
                    this.absX(),
                    this.absY(),
                    this.absX(),
                    simulationArea.mouseY,
                    color,
                    3
                );
                drawLine(
                    ctx,
                    this.absX(),
                    simulationArea.mouseY,
                    simulationArea.mouseX,
                    simulationArea.mouseY,
                    color,
                    3
                );
            } else if (
                Math.abs(this.x + this.parent.x - simulationArea.mouseX) >
                Math.abs(this.y + this.parent.y - simulationArea.mouseY)
            ) {
                drawLine(
                    ctx,
                    this.absX(),
                    this.absY(),
                    simulationArea.mouseX,
                    this.absY(),
                    color,
                    3
                );
            } else {
                drawLine(
                    ctx,
                    this.absX(),
                    this.absY(),
                    this.absX(),
                    simulationArea.mouseY,
                    color,
                    3
                );
            }
        }

        let colorNode = colors['stroke'];
        const colorNodeConnect = colors['color_wire_con'];
        const colorNodePow = colors['color_wire_pow'];
        const colorNodeLose = colors['color_wire_lose'];
        const colorNodeSelected = colors['node'];

        if (this.bitWidth === 1) {
            colorNode = [colorNodeConnect, colorNodePow][this.value as number];
        }
        if (this.value === undefined) colorNode = colorNodeLose;
        if (this.type === NODE_INTERMEDIATE) this.checkHover();
        if (this.type === NODE_INTERMEDIATE) {
            drawCircle(ctx, this.absX(), this.absY(), 3, colorNode);
        } else {
            drawCircle(ctx, this.absX(), this.absY(), 3, colorNodeSelected);
        }

        if (
            this.highlighted ||
            simulationArea.lastSelected === this ||
            (this.isHover() &&
                !simulationArea.selected &&
                !simulationArea.shiftDown) ||
            simArea.multipleObjectSelections.includes(this)
        ) {
            ctx.strokeStyle = colorNodeSelected;
            ctx.beginPath();
            ctx.lineWidth = 3;
            arc(
                ctx,
                this.x,
                this.y,
                8,
                0,
                Math.PI * 2,
                this.parent.x,
                this.parent.y,
                'RIGHT'
            );
            ctx.closePath();
            ctx.stroke();
        }

        if (this.hover || simulationArea.lastSelected === this) {
            if (this.showHover || simulationArea.lastSelected === this) {
                // TODO: Remove 'any' casts when engine.js canvasMessageData is properly typed
                (canvasMessageData as any).x = this.absX();
                (canvasMessageData as any).y = this.absY() - 15;
                if (this.type === NODE_INTERMEDIATE) {
                    let v = 'X';
                    if (this.value !== undefined) {
                        v = this.value.toString(16);
                    }
                    if (this.label.length) {
                        (canvasMessageData as any).string = `${this.label} : ${v}`;
                    } else {
                        (canvasMessageData as any).string = v;
                    }
                } else if (this.label.length) {
                    (canvasMessageData as any).string = this.label;
                }
            } else {
                setTimeout(() => {
                    if (simArea.hover) {
                        simArea.hover.showHover = true;
                    }
                    updateCanvasSet(true);
                    renderCanvas(globalScope);
                }, 400);
            }
        }
    }

    /**
     * Checks if a node has been deleted
     */
    checkDeleted(): void {
        if (this.deleted) this.delete();
        if (this.connections.length === 0 && this.type === NODE_INTERMEDIATE) this.delete();
    }

    /**
     * Used to update nodes if there is an event like click or hover on the node.
     * Many booleans are used to check if certain properties are to be updated.
     */
    update(): void {
        if (embed) return;

        const simArea = simulationArea as any;

        if (this === simArea.hover) simArea.hover = undefined;
        this.hover = this.isHover();

        if (!simulationArea.mouseDown) {
            if (this.absX() !== this.prevx || this.absY() !== this.prevy) {
                // Connect to any node
                this.prevx = this.absX();
                this.prevy = this.absY();
                this.nodeConnect();
            }
        }

        if (this.hover) {
            simArea.hover = this;
        }

        if (
            simulationArea.mouseDown &&
            ((this.hover && !simulationArea.selected) ||
                simulationArea.lastSelected === this)
        ) {
            simulationArea.selected = true;
            simulationArea.lastSelected = this;
            this.clicked = true;
        } else {
            this.clicked = false;
        }

        if (!this.wasClicked && this.clicked) {
            this.wasClicked = true;
            this.prev = 'a';
            if (this.type === NODE_INTERMEDIATE) {
                if (
                    !simulationArea.shiftDown &&
                    simArea.multipleObjectSelections.includes(this)
                ) {
                    for (
                        let i = 0;
                        i < simArea.multipleObjectSelections.length;
                        i++
                    ) {
                        simArea.multipleObjectSelections[i].startDragging();
                    }
                }

                if (simulationArea.shiftDown) {
                    simulationArea.lastSelected = undefined;
                    if (
                        simArea.multipleObjectSelections.includes(this)
                    ) {
                        simArea.multipleObjectSelections = simArea.multipleObjectSelections.filter((x: Node) => x !== this);
                    } else {
                        simArea.multipleObjectSelections.push(this);
                    }
                } else {
                    simulationArea.lastSelected = this;
                }
            }
        } else if (this.wasClicked && this.clicked) {
            if (
                !simulationArea.shiftDown &&
                simArea.multipleObjectSelections.includes(this)
            ) {
                for (
                    let i = 0;
                    i < simArea.multipleObjectSelections.length;
                    i++
                ) {
                    simArea.multipleObjectSelections[i].drag();
                }
            }
            if (this.type === NODE_INTERMEDIATE) {
                if (
                    this.connections.length === 1 &&
                    this.connections[0].absX() === simulationArea.mouseX &&
                    this.absX() === simulationArea.mouseX
                ) {
                    this.y = simulationArea.mouseY - this.parent.y;
                    this.prev = 'a';
                    return;
                }
                if (
                    this.connections.length === 1 &&
                    this.connections[0].absY() === simulationArea.mouseY &&
                    this.absY() === simulationArea.mouseY
                ) {
                    this.x = simulationArea.mouseX - this.parent.x;
                    this.prev = 'a';
                    return;
                }
                if (
                    this.connections.length === 1 &&
                    this.connections[0].absX() === this.absX() &&
                    this.connections[0].absY() === this.absY()
                ) {
                    this.connections[0].clicked = true;
                    this.connections[0].wasClicked = true;
                    simulationArea.lastSelected = this.connections[0];
                    this.delete();
                    return;
                }
            }

            if (
                this.prev === 'a' &&
                distance(
                    simulationArea.mouseX,
                    simulationArea.mouseY,
                    this.absX(),
                    this.absY()
                ) >= 10
            ) {
                if (
                    Math.abs(this.x + this.parent.x - simulationArea.mouseX) >
                    Math.abs(this.y + this.parent.y - simulationArea.mouseY)
                ) {
                    this.prev = 'x';
                } else {
                    this.prev = 'y';
                }
            } else if (
                this.prev === 'x' &&
                this.absY() === simulationArea.mouseY
            ) {
                this.prev = 'a';
            } else if (
                this.prev === 'y' &&
                this.absX() === simulationArea.mouseX
            ) {
                this.prev = 'a';
            }
        } else if (this.wasClicked && !this.clicked) {
            this.wasClicked = false;

            if (
                simulationArea.mouseX === this.absX() &&
                simulationArea.mouseY === this.absY()
            ) {
                return; // no new node situation
            }

            let x1: number | undefined;
            let y1: number | undefined;
            let x2: number;
            let y2: number;
            let flag = 0;
            let n1: Node | undefined;
            let n2: Node | undefined;

            // (x,y) present node, (x1,y1) node 1 , (x2,y2) node 2
            // n1 - node 1, n2 - node 2
            // node 1 may or may not be there
            // flag = 0  - node 2 only
            // flag = 1  - node 1 and node 2
            x2 = simulationArea.mouseX;
            y2 = simulationArea.mouseY;
            const x = this.absX();
            const y = this.absY();

            if (x !== x2 && y !== y2) {
                // Rare Exception Cases
                if (
                    this.prev === 'a' &&
                    distance(
                        simulationArea.mouseX,
                        simulationArea.mouseY,
                        this.absX(),
                        this.absY()
                    ) >= 10
                ) {
                    if (
                        Math.abs(
                            this.x + this.parent.x - simulationArea.mouseX
                        ) >
                        Math.abs(this.y + this.parent.y - simulationArea.mouseY)
                    ) {
                        this.prev = 'x';
                    } else {
                        this.prev = 'y';
                    }
                }

                flag = 1;
                if (this.prev === 'x') {
                    x1 = x2;
                    y1 = y;
                } else if (this.prev === 'y') {
                    y1 = y2;
                    x1 = x;
                }
            }

            if (flag === 1 && x1 !== undefined && y1 !== undefined) {
                for (let i = 0; i < this.parent.scope.allNodes.length; i++) {
                    if (
                        x1 === this.parent.scope.allNodes[i].absX() &&
                        y1 === this.parent.scope.allNodes[i].absY()
                    ) {
                        n1 = this.parent.scope.allNodes[i];
                        break;
                    }
                }

                if (n1 === undefined) {
                    n1 = new Node(x1, y1, 2, this.scope.root);
                    for (let i = 0; i < this.parent.scope.wires.length; i++) {
                        if (this.parent.scope.wires[i].checkConvergence(n1)) {
                            this.parent.scope.wires[i].converge(n1);
                            break;
                        }
                    }
                }
                this.connect(n1);
            }

            for (let i = 0; i < this.parent.scope.allNodes.length; i++) {
                if (
                    x2 === this.parent.scope.allNodes[i].absX() &&
                    y2 === this.parent.scope.allNodes[i].absY()
                ) {
                    n2 = this.parent.scope.allNodes[i];
                    break;
                }
            }

            if (n2 === undefined) {
                n2 = new Node(x2, y2, 2, this.scope.root);
                for (let i = 0; i < this.parent.scope.wires.length; i++) {
                    if (this.parent.scope.wires[i].checkConvergence(n2)) {
                        this.parent.scope.wires[i].converge(n2);
                        break;
                    }
                }
            }
            if (flag === 0) {
                this.connect(n2);
            } else if (n1) {
                n1.connect(n2);
            }
            if (simulationArea.lastSelected === this) {
                simulationArea.lastSelected = n2;
            }
        }

        if (this.type === NODE_INTERMEDIATE && simulationArea.mouseDown === false) {
            if (this.connections.length === 2) {
                if (
                    this.connections[0].absX() === this.connections[1].absX() ||
                    this.connections[0].absY() === this.connections[1].absY()
                ) {
                    this.connections[0].connect(this.connections[1]);
                    this.delete();
                }
            } else if (this.connections.length === 0) {
                this.delete();
            }
        }
    }

    /**
     * Function to delete a node
     */
    delete(): void {
        updateSimulationSet(true);
        this.deleted = true;
        this.parent.scope.allNodes = this.parent.scope.allNodes.filter(x => x !== this);
        this.parent.scope.nodes = this.parent.scope.nodes.filter(x => x !== this);

        // Hope this works! - Can cause bugs
        if (this.parent.scope.root.nodeList) {
            this.parent.scope.root.nodeList = this.parent.scope.root.nodeList.filter(x => x !== this);
        }

        if (simulationArea.lastSelected === this) {
            simulationArea.lastSelected = undefined;
        }
        for (let i = 0; i < this.connections.length; i++) {
            this.connections[i].connections = this.connections[i].connections.filter(x => x !== this);
            this.connections[i].checkDeleted();
        }

        this.scope.timeStamp = new Date().getTime();

        wireToBeCheckedSet(1);
        forceResetNodesSet(true);
        scheduleUpdate();
    }

    /**
     * Backward compatibility alias for delete()
     */
    cleanDelete(): void {
        this.delete();
    }

    isClicked(): boolean {
        return (
            this.absX() === simulationArea.mouseX &&
            this.absY() === simulationArea.mouseY
        );
    }

    isHover(): boolean {
        return (
            this.absX() === simulationArea.mouseX &&
            this.absY() === simulationArea.mouseY
        );
    }

    /**
     * If input node: it resolves the parent
     * Else: it adds all the nodes onto the stack
     * and they are processed to generate verilog
     */
    nodeConnect(): void {
        const x = this.absX();
        const y = this.absY();
        let n: Node | undefined;

        for (let i = 0; i < this.parent.scope.allNodes.length; i++) {
            if (
                this !== this.parent.scope.allNodes[i] &&
                x === this.parent.scope.allNodes[i].absX() &&
                y === this.parent.scope.allNodes[i].absY()
            ) {
                n = this.parent.scope.allNodes[i];
                if (this.type === NODE_INTERMEDIATE) {
                    for (let j = 0; j < this.connections.length; j++) {
                        n.connect(this.connections[j]);
                    }
                    this.delete();
                } else {
                    this.connect(n);
                }

                break;
            }
        }

        if (n === undefined) {
            for (let i = 0; i < this.parent.scope.wires.length; i++) {
                if (this.parent.scope.wires[i].checkConvergence(this)) {
                    let nodeToConverge: Node = this;
                    if (this.type !== NODE_INTERMEDIATE) {
                        nodeToConverge = new Node(
                            this.absX(),
                            this.absY(),
                            2,
                            this.scope.root
                        );
                        this.connect(nodeToConverge);
                    }
                    this.parent.scope.wires[i].converge(nodeToConverge);
                    break;
                }
            }
        }
    }

    processVerilog(): void {
        if (this.type === NODE_INPUT) {
            if (this.parent.isVerilogResolvable?.()) {
                this.scope.stack.push(this.parent);
            }
        }

        for (let i = 0; i < this.connections.length; i++) {
            if (this.connections[i].verilogLabel !== this.verilogLabel) {
                this.connections[i].verilogLabel = this.verilogLabel;
                this.scope.stack.push(this.connections[i]);
            }
        }
    }
}
