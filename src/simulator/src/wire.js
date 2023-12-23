import {drawLine} from './canvas_api';

import {Node} from './node';
import {updateSimulationSet, forceResetNodesSet} from './engine';
import {colors} from './themer/themer';

/**
 * Wire - To connect two nodes.
 * @class
 * @memberof module:wire
 * @param {Node} node1
 * @param {Node} node2
 * @param {Scope} scope - The circuit in which wire has to be drawn
 * @category wire
 */
export class Wire {
  /**
   *
   * @param {Node} node1
   * @param {Node} node2
   * @param {Scope} scope
   */
  constructor(node1, node2, scope) {
    this.objectType = 'Wire';
    this.node1 = node1;
    this.scope = scope;
    this.node2 = node2;
    this.type = 'horizontal';

    this.updateData();
    this.scope.wires.push(this);
    forceResetNodesSet(true);
  }

  /**
   *
   */
  updateData() {
    this.x1 = this.node1.absX();
    this.y1 = this.node1.absY();
    this.x2 = this.node2.absX();
    this.y2 = this.node2.absY();
    if (this.x1 === this.x2) {
      this.type = 'vertical';
    }
  }

  /**
   *
   * @param {Scope} scope
   */
  updateScope(scope) {
    this.scope = scope;
    this.checkConnections();
  }

  /**
   * check if nodes are disconnected
   * @return {boolean} are nodes disconnected.
   */
  checkConnections() {
    const check =
      this.node1.deleted ||
      this.node2.deleted ||
      !this.node1.connections.includes(this.node2) ||
      !this.node2.connections.includes(this.node1);
    if (check) {
      this.delete();
    }
    return check;
  }

  /**
   * On double click select both ends of a wire.
   */
  dblclick() {
    if (
      this.node1.parent == globalScope.root &&
      this.node2.parent == globalScope.root
    ) {
      globalScope.simulationArea.multipleObjectSelections = [this.node1, this.node2];
      globalScope.simulationArea.lastSelected = undefined;
    }
  }

  /**
   *
   * @return {boolean} whether an update has occurred
   */
  update() {
    let updated = false;
    if (embed) {
      return updated;
    }

    if (this.node1.absX() === this.node2.absX()) {
      this.x1 = this.x2 = this.node1.absX();
      this.type = 'vertical';
    } else if (this.node1.absY() === this.node2.absY()) {
      this.y1 = this.y2 = this.node1.absY();
      this.type = 'horizontal';
    }
    let n;
    if (
      globalScope.simulationArea.shiftDown === false &&
      globalScope.simulationArea.mouseDown === true &&
      globalScope.simulationArea.selected === false &&
      this.checkWithin(
          globalScope.simulationArea.mouseDownX,
          globalScope.simulationArea.mouseDownY,
      )
    ) {
      globalScope.simulationArea.selected = true;
      globalScope.simulationArea.lastSelected = this;
      updated = true;
    } else if (
      globalScope.simulationArea.mouseDown &&
      globalScope.simulationArea.lastSelected === this &&
      !this.checkWithin(globalScope.simulationArea.mouseX, globalScope.simulationArea.mouseY)
    ) {
      n = new Node(
          globalScope.simulationArea.mouseDownX,
          globalScope.simulationArea.mouseDownY,
          2,
          this.scope.root,
      );
      n.clicked = true;
      n.wasClicked = true;
      globalScope.simulationArea.lastSelected = n;
      this.converge(n);
    }

    if (this.node1.deleted || this.node2.deleted) {
      this.delete();
      return updated;
    } // if either of the nodes are deleted

    if (globalScope.simulationArea.mouseDown === false) {
      if (this.type === 'horizontal') {
        if (this.node1.absY() !== this.y1) {
          n = new Node(this.node1.absX(), this.y1, 2, this.scope.root);
          this.converge(n);
          updated = true;
        } else if (this.node2.absY() !== this.y2) {
          n = new Node(this.node2.absX(), this.y2, 2, this.scope.root);
          this.converge(n);
          updated = true;
        }
      } else if (this.type === 'vertical') {
        if (this.node1.absX() !== this.x1) {
          n = new Node(this.x1, this.node1.absY(), 2, this.scope.root);
          this.converge(n);
          updated = true;
        } else if (this.node2.absX() !== this.x2) {
          n = new Node(this.x2, this.node2.absY(), 2, this.scope.root);
          this.converge(n);
          updated = true;
        }
      }
    }
    return updated;
  }

  draw() {
    // for calculating min-max Width,min-max Height
    const ctx = globalScope.simulationArea.context;

    let color;
    if (globalScope.simulationArea.lastSelected == this) {
      color = colors['color_wire_sel'];
    } else if (
      this.node1.value == undefined ||
      this.node2.value == undefined
    ) {
      color = colors['color_wire_lose'];
    } else if (this.node1.bitWidth == 1) {
      color = [
        colors['color_wire_lose'],
        colors['color_wire_con'],
        colors['color_wire_pow'],
      ][this.node1.value + 1];
    } else {
      color = colors['color_wire'];
    }
    drawLine(
        ctx,
        this.node1.absX(),
        this.node1.absY(),
        this.node2.absX(),
        this.node2.absY(),
        color,
        3,
    );
  }

  // checks if node lies on wire
  checkConvergence(n) {
    return this.checkWithin(n.absX(), n.absY());
  }

  /**
   * Checks if coordinate lies on wire
   * @param {*} x
   * @param {*} y
   * @return {boolean}
   */
  checkWithin(x, y) {
    if (
      this.type === 'horizontal' &&
      this.node1.absX() < this.node2.absX() &&
      x > this.node1.absX() &&
      x < this.node2.absX() &&
      y === this.node2.absY()
    ) {
      return true;
    }
    if (
      this.type === 'horizontal' &&
      this.node1.absX() > this.node2.absX() &&
      x < this.node1.absX() &&
      x > this.node2.absX() &&
      y === this.node2.absY()
    ) {
      return true;
    }
    if (
      this.type === 'vertical' &&
      this.node1.absY() < this.node2.absY() &&
      y > this.node1.absY() &&
      y < this.node2.absY() &&
      x === this.node2.absX()
    ) {
      return true;
    }
    if (
      this.type === 'vertical' &&
      this.node1.absY() > this.node2.absY() &&
      y < this.node1.absY() &&
      y > this.node2.absY() &&
      x === this.node2.absX()
    ) {
      return true;
    }
    return false;
  }

  // add intermediate node between these 2 nodes
  converge(n) {
    this.node1.connect(n);
    this.node2.connect(n);
    this.delete();
  }
  /**
   *
   */
  delete() {
    forceResetNodesSet(true);
    updateSimulationSet(true);
    let index = this.node1.connections.indexOf(this.node2);
    if (index != -1) {
      this.node1.connections.splice(index, 1);
    }
    index = this.node2.connections.indexOf(this.node1);
    if (index != -1) {
      this.node2.connections.splice(index, 1);
    }
    index = this.scope.wires.indexOf(this);
    if (index != -1) {
      this.scope.wires.splice(index, 1);
    }
    this.node1.checkDeleted();
    this.node2.checkDeleted();
  }
}
