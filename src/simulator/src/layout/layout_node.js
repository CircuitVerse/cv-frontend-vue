import {drawCircle} from '../canvas_api';

import {tempBuffer} from '../layout_mode';

/**
 * @class
 * @param {number} x - x coord of node
 * @param {number} y - y coord of node
 * @param {string} id - id for node
 * @param {string} label - label for the node
 * @param {number} xx - parent x
 * @param {number} yy - parent y
 * @param {number} type - input or output node
 * @param {CircuitElement} parent  parent of the node
 * @category layout
 */
export class LayoutNode {
  /**
   * @param {number} x - x coord of node.
   * @param {number} y - y coord of node.
   * @param {string} id - id for node
   * @param {string} label - label for the node
   * @param {number} type - input or output node
   * @param {CircuitElement} parent  parent of the node
   */
  constructor(x, y, id, label = '', type, parent) {
    this.type = type;
    this.id = id;

    this.label = label;

    this.prevX = undefined;
    this.prevY = undefined;
    this.x = x; // Position of node wrt to parent
    this.y = y; // Position of node wrt to parent

    this.radius = 5;
    this.clicked = false;
    this.hover = false;
    this.wasClicked = false;
    this.prev = 'a';
    this.count = 0;
    this.parent = parent;
    this.objectType = 'Layout Node';
  }

  absX() {
    return this.x;
  }

  absY() {
    return this.y;
  }

  update() {
    // Code copied from node.update() - Some code is redundant - needs to be removed

    if (this === globalScope.simulationArea.hover) {
      globalScope.simulationArea.hover = undefined;
    }
    this.hover = this.isHover();

    if (!globalScope.simulationArea.mouseDown) {
      if (this.absX() !== this.prevX || this.absY() !== this.prevY) {
        // Store position before clicked
        this.prevX = this.absX();
        this.prevY = this.absY();
      }
    }

    if (this.hover) {
      globalScope.simulationArea.hover = this;
    }

    if (
      globalScope.simulationArea.mouseDown &&
      ((this.hover && !globalScope.simulationArea.selected) ||
        globalScope.simulationArea.lastSelected === this)
    ) {
      globalScope.simulationArea.selected = true;
      globalScope.simulationArea.lastSelected = this;
      this.clicked = true;
    } else {
      this.clicked = false;
    }

    if (!this.wasClicked && this.clicked) {
      this.wasClicked = true;
      this.prev = 'a';
      globalScope.simulationArea.lastSelected = this;
    } else if (this.wasClicked && this.clicked) {
      // Check if valid position and update accordingly
      if (
        tempBuffer.isAllowed(
            globalScope.simulationArea.mouseX,
            globalScope.simulationArea.mouseY,
        ) &&
        !tempBuffer.isNodeAt(
            globalScope.simulationArea.mouseX,
            globalScope.simulationArea.mouseY,
        )
      ) {
        this.x = globalScope.simulationArea.mouseX;
        this.y = globalScope.simulationArea.mouseY;
      }
    }
  }

  /**
   * @memberof layoutNode
   * this function is used to draw the nodes
   */
  draw() {
    const ctx = globalScope.simulationArea.context;
    drawCircle(
        ctx,
        this.absX(),
        this.absY(),
        3,
        ['green', 'red'][+(globalScope.simulationArea.lastSelected === this)],
    );
  }

  /**
   * @memberof layoutNode
   * this function is used to check if hover
   */
  isHover() {
    return (
      this.absX() === globalScope.simulationArea.mouseX &&
      this.absY() === globalScope.simulationArea.mouseY
    );
  }
}
