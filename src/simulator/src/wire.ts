/* eslint-disable no-multi-assign */
import { drawLine } from './canvasApi';
import { simulationArea } from './simulationArea';
import Node from './node';
import { updateSimulationSet, forceResetNodesSet } from './engine';
import { colors } from './themer/themer';

interface Scope {
    wires: Wire[];
    root: any; // Replace 'any' with the appropriate type if known
    timeStamp: number;
}

export default class Wire {
    objectType: string;
    node1: Node;
    node2: Node;
    scope: Scope;
    type: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;

    constructor(node1: Node, node2: Node, scope: Scope) {
        this.objectType = 'Wire';
        this.node1 = node1;
        this.scope = scope;
        this.node2 = node2;
        this.type = 'horizontal';

        this.x1 = this.node1.absX();
        this.y1 = this.node1.absY();
        this.x2 = this.node2.absX();
        this.y2 = this.node2.absY();
        this.updateData();
        this.scope.wires.push(this);
        forceResetNodesSet(true);
    }

    // Update wire coordinates
    updateData(): void {
        this.x1 = this.node1.absX();
        this.y1 = this.node1.absY();
        this.x2 = this.node2.absX();
        this.y2 = this.node2.absY();
        if (this.x1 === this.x2) this.type = 'vertical';
    }

    // Update scope and check connections
    updateScope(scope: Scope): void {
        this.scope = scope;
        this.checkConnections();
    }

    // Check if nodes are disconnected
    checkConnections(): boolean {
        const check =
            this.node1.deleted ||
            this.node2.deleted ||
            !(this.node1.connections?.includes(this.node2)) ||
            !(this.node2.connections?.includes(this.node1) ?? false);
        if (check) this.delete();
        return check;
    }

    // Handle double-click event
    dblclick(): void {
        if (
            this.node1.parent == globalScope.root &&
            this.node2.parent == globalScope.root
        ) {
            simulationArea.multipleObjectSelections = [this.node1, this.node2];
            simulationArea.lastSelected = undefined;
        }
    }

    // Update wire state
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

    // Draw the wire
    draw(): void {
        const ctx = simulationArea.context;
        const color = this.getWireColor();
        drawLine(
            ctx,
            this.node1.absX(),
            this.node1.absY(),
            this.node2.absX(),
            this.node2.absY(),
            color,
            3
        );
    }

    // Check if a node lies on the wire
    checkConvergence(n: Node): boolean {
        return this.checkWithin(n.absX(), n.absY());
    }

    // Check if a coordinate lies on the wire
    checkWithin(x: number, y: number): boolean {
        const isHorizontal = this.type === 'horizontal';
        const isVertical = this.type === 'vertical';

        if (isHorizontal) {
            return (
                (this.node1.absX() < this.node2.absX() &&
                    x > this.node1.absX() &&
                    x < this.node2.absX() &&
                    y === this.node2.absY()) ||
                (this.node1.absX() > this.node2.absX() &&
                    x < this.node1.absX() &&
                    x > this.node2.absX() &&
                    y === this.node2.absY())
            );
        }

        if (isVertical) {
            return (
                (this.node1.absY() < this.node2.absY() &&
                    y > this.node1.absY() &&
                    y < this.node2.absY() &&
                    x === this.node2.absX()) ||
                (this.node1.absY() > this.node2.absY() &&
                    y < this.node1.absY() &&
                    y > this.node2.absY() &&
                    x === this.node2.absX())
            );
        }

        return false;
    }

    // Add intermediate node between these two nodes
    converge(n: Node): void {
        this.node1.connect(n);
        this.node2.connect(n);
        this.delete();
    }

    // Delete the wire
    delete(): void {
        forceResetNodesSet(true);
        updateSimulationSet(true);
        if (this.node1.connections) {
            this.node1.connections = this.node1.connections.filter(x => x !== this.node2);
        }
        if (this.node2.connections) {
            this.node2.connections = this.node2.connections.filter(x => x !== this.node1);
        }
        this.scope.wires = this.scope.wires.filter(x => x !== this);
        this.node1.checkDeleted();
        this.node2.checkDeleted();
        this.scope.timeStamp = new Date().getTime();
    }

    // Helper: Update wire type based on node positions
    private updateWireType(): void {
        if (this.node1.absX() === this.node2.absX()) {
            this.x1 = this.x2 = this.node1.absX();
            this.type = 'vertical';
        } else if (this.node1.absY() === this.node2.absY()) {
            this.y1 = this.y2 = this.node1.absY();
            this.type = 'horizontal';
        }
    }

    // Helper: Handle mouse interactions
    private handleMouseInteraction(): boolean {
        if (
            !simulationArea.shiftDown &&
            simulationArea.mouseDown &&
            !simulationArea.selected &&
            this.checkWithin(simulationArea.mouseDownX, simulationArea.mouseDownY)
        ) {
            simulationArea.selected = true;
            simulationArea.lastSelected = this;
            return true;
        }

        if (
            simulationArea.mouseDown &&
            simulationArea.lastSelected === this &&
            !this.checkWithin(simulationArea.mouseX, simulationArea.mouseY)
        ) {
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

        return false;
    }

    // Helper: Handle node alignment
    private handleNodeAlignment(): boolean {
        let updated = false;

        if (this.type === 'horizontal') {
            if (this.node1.absY() !== this.y1) {
                const n = new Node(this.node1.absX(), this.y1, 2, this.scope.root);
                this.converge(n);
                updated = true;
            } else if (this.node2.absY() !== this.y2) {
                const n = new Node(this.node2.absX(), this.y2, 2, this.scope.root);
                this.converge(n);
                updated = true;
            }
        } else if (this.type === 'vertical') {
            if (this.node1.absX() !== this.x1) {
                const n = new Node(this.x1, this.node1.absY(), 2, this.scope.root);
                this.converge(n);
                updated = true;
            } else if (this.node2.absX() !== this.x2) {
                const n = new Node(this.x2, this.node2.absY(), 2, this.scope.root);
                this.converge(n);
                updated = true;
            }
        }

        return updated;
    }

    // Helper: Get wire color based on state
    private getWireColor(): string {
        if (simulationArea.lastSelected == this) {
            return colors['color_wire_sel'];
        }
        if (this.node1.value == undefined || this.node2.value == undefined) {
            return colors['color_wire_lose'];
        }
        if (this.node1.bitWidth == 1) {
            return [
                colors['color_wire_lose'],
                colors['color_wire_con'],
                colors['color_wire_pow'],
            ][this.node1.value + 1];
        }
        return colors['color_wire'];
    }
}