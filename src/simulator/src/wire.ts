/* eslint-disable no-multi-assign */
import { drawLine } from './canvasApi';
import { simulationArea } from './simulationArea';
import Node from './node';
import { updateSimulationSet, forceResetNodesSet } from './engine';
import { colors } from './themer/themer';
import CircuitElement from './circuitElement';

interface Scope {
    wires: Wire[];
    root: CircuitElement;
    timeStamp: number;
}

enum WireValue {
    LOOSE = -1,
    LOW = 0,
    HIGH = 1
}

export default class Wire {
    objectType = 'Wire';
    type: 'horizontal' | 'vertical' = 'horizontal';
    x1: number;
    y1: number;
    x2: number;
    y2: number;

    constructor(public node1: Node, public node2: Node, public scope: Scope) {
        this.x1 = this.node1.absX();
        this.y1 = this.node1.absY();
        this.x2 = this.node2.absX();
        this.y2 = this.node2.absY();
        this.updateData();
        this.scope.wires.push(this);
        forceResetNodesSet(true);
    }

    updateData(): void {
        [this.x1, this.y1, this.x2, this.y2] = [
            this.node1.absX(), this.node1.absY(),
            this.node2.absX(), this.node2.absY()
        ];
        if (this.x1 === this.x2) this.type = 'vertical';
        else if (this.y1 === this.y2) this.type = 'horizontal';
    }

    updateScope(scope: Scope): void {
        this.scope = scope;
        this.checkConnections();
    }

    checkConnections(): boolean {
        const disconnected = this.node1.deleted || this.node2.deleted ||
            !this.node1.connections?.includes(this.node2) ||
            !this.node2.connections?.includes(this.node1);
        if (disconnected) {
            setTimeout(() => this.delete(), 0);
        }
        return disconnected;
    }

    dblclick(): void {
        if (this.node1.parent === globalScope.root && this.node2.parent === globalScope.root) {
            simulationArea.multipleObjectSelections = [this.node1, this.node2];
            simulationArea.lastSelected = undefined;
        }
    }

    update(): boolean {
        let updated = false;
        if (embed) return updated;

        this.updateWireType();
        updated = this.handleMouseInteraction() || updated;

        if (this.node1.deleted || this.node2.deleted) {
            this.delete();
            return updated;
        }

        if (!simulationArea.mouseDown) {
            updated = this.handleNodeAlignment() || updated;
        }

        return updated;
    }

    draw(): void {
        drawLine(
            simulationArea.context,
            this.node1.absX(), this.node1.absY(),
            this.node2.absX(), this.node2.absY(),
            this.getWireColor(), 3
        );
    }

    checkConvergence(n: Node): boolean {
        return this.checkWithin(n.absX(), n.absY());
    }

    checkWithin(x: number, y: number): boolean {
        const threshold = 2;
        return this.checkCoordAndBetween(x, y, threshold);
    }

    private checkCoordAndBetween(x: number, y: number, threshold: number): boolean {
        if (this.type === 'horizontal') {
            return this.checkCoordinate(y, this.node1.absY(), threshold) &&
                this.isBetween(x, this.node1.absX(), this.node2.absX());
        }
        if (this.type === 'vertical') {
            return this.checkCoordinate(x, this.node1.absX(), threshold) &&
                this.isBetween(y, this.node1.absY(), this.node2.absY());
        }
        return false;
    }

    private checkCoordinate(coord: number, reference: number, threshold: number): boolean {
        return Math.abs(coord - reference) <= threshold;
    }

    private isBetween(value: number, a: number, b: number): boolean {
        return value >= Math.min(a, b) && value <= Math.max(a, b);
    }

    converge(n: Node): void {
        if (n === this.node1 || n === this.node2) return;
        this.node1.connect(n);
        this.node2.connect(n);
        this.delete();
    }

    delete(): void {
        forceResetNodesSet(true);
        updateSimulationSet(true);
        this.removeMutualConnections();
        this.scope.wires = this.scope.wires.filter(x => x !== this);
        this.node1.checkDeleted();
        this.node2.checkDeleted();
        this.scope.timeStamp = Date.now();
    }

    private removeMutualConnections(): void {
        this.removeConnection(this.node1, this.node2);
        this.removeConnection(this.node2, this.node1);
    }

    private removeConnection(node: Node, otherNode: Node): void {
        if (node.connections) {
            node.connections = node.connections.filter(x => x !== otherNode);
        }
    }

    private updateWireType(): void {
        const x1 = this.node1.absX();
        const x2 = this.node2.absX();
        const y1 = this.node1.absY();
        const y2 = this.node2.absY();

        if (x1 === x2) {
            this.type = 'vertical';
        } else if (y1 === y2) {
            this.type = 'horizontal';
        }
    }

    private handleMouseInteraction(): boolean {
        if (this.checkWireSelection()) {
            simulationArea.selected = true;
            simulationArea.lastSelected = this;
            return true;
        }

        if (this.checkWireDrag()) {
            this.createIntermediateNode();
            return true;
        }

        return false;
    }

    private checkWireSelection(): boolean {
        return !simulationArea.shiftDown &&
            simulationArea.mouseDown &&
            !simulationArea.selected &&
            this.checkWithin(simulationArea.mouseDownX, simulationArea.mouseDownY);
    }

    private checkWireDrag(): boolean {
        return simulationArea.mouseDown &&
            simulationArea.lastSelected === this &&
            !this.checkWithin(simulationArea.mouseX, simulationArea.mouseY);
    }

    private createIntermediateNode(): void {
        const n = new Node(
            simulationArea.mouseDownX,
            simulationArea.mouseDownY,
            2,
            this.scope.root
        );
        n.clicked = true;
        n.wasClicked = true;
        simulationArea.lastSelected = n;
        this.converge(n);
    }

    private handleNodeAlignment(): boolean {
        if (this.type === 'horizontal') {
            return this.alignNodesAlongYAxis();
        }
        if (this.type === 'vertical') {
            return this.alignNodesAlongXAxis();
        }
        return false;
    }

    private createAlignmentPoint(
        current: number,
        expected: number,
        x: number,
        y: number,
        scopeRoot: CircuitElement,
        referenceNode: Node
    ): { current: number, expected: number, createNode: () => Node, referenceNode: Node } {
        return {
            current,
            expected,
            createNode: () => new Node(x, y, 2, scopeRoot),
            referenceNode
        };
    }

    private alignNodesAlongYAxis(): boolean {
        const p1 = this.createAlignmentPoint(this.node1.absY(), this.y1, this.node1.absX(), this.y1, this.scope.root, this.node1);
        const p2 = this.createAlignmentPoint(this.node2.absY(), this.y2, this.node2.absX(), this.y2, this.scope.root, this.node2);
        return this.checkAndCreateNode(p1, p2);
    }

    private alignNodesAlongXAxis(): boolean {
        const p1 = this.createAlignmentPoint(this.node1.absX(), this.x1, this.x1, this.node1.absY(), this.scope.root, this.node1);
        const p2 = this.createAlignmentPoint(this.node2.absX(), this.x2, this.x2, this.node2.absY(), this.scope.root, this.node2);
        return this.checkAndCreateNode(p1, p2);
    }

    private checkNode(
        current: number,
        expected: number,
        createNode: () => Node,
        referenceNode: Node
    ): boolean {
        if (current !== expected) {
            const newNode = createNode();
            if (newNode.absX() !== referenceNode.absX() || newNode.absY() !== referenceNode.absY()) {
                this.converge(newNode);
                return true;
            }
        }
        return false;
    }

    private checkAndCreateNode(
        point1: { current: number, expected: number, createNode: () => Node, referenceNode: Node },
        point2: { current: number, expected: number, createNode: () => Node, referenceNode: Node }
    ): boolean {
        if (this.checkNode(point1.current, point1.expected, point1.createNode, point1.referenceNode)) {
            return true;
        }
        if (this.checkNode(point2.current, point2.expected, point2.createNode, point2.referenceNode)) {
            return true;
        }
        return false;
    }

    private getWireColor(): string {
        if (simulationArea.lastSelected === this) {
            return colors['color_wire_sel'];
        }
        if (this.node1.value === undefined || this.node2.value === undefined) {
            return colors['color_wire_lose'];
        }
        if (this.node1.bitWidth === 1) {
            return [
                colors['color_wire_lose'],
                colors['color_wire_con'],
                colors['color_wire_pow'],
            ][this.node1.value - WireValue.LOOSE];
        }
        return colors['color_wire'];
    }
}
