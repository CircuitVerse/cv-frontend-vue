import {drawCircle, drawLine, arc} from './canvasApi';
import {simulationArea} from './simulationArea';
import {distance} from './utils';
import {showError} from './utils_clock';
import {
  renderCanvas,
  scheduleUpdate,
  wireToBeCheckedSet,
  updateSimulationSet,
  updateCanvasSet,
  forceResetNodesSet,
  canvasMessageData,
} from './engine';
import {Wire} from './wire';
import {colors} from './themer/themer';

/**
 * Constructs all the connections of Node node
 * @param {Node} node - node to be constructed
 * @param {JSON} data - the saved data which is used to load
 * @category node
 */
export function constructNodeConnections(node, data) {
  for (let i = 0; i < data.connections.length; i++) {
    if (
      !node.connections.contains(node.scope.allNodes[data.connections[i]])
    ) {
      node.connect(node.scope.allNodes[data.connections[i]]);
    }
  }
}

/**
 * Fn to replace node by node @ index in global Node List - used when loading
 * @param {Node} node - node to be replaced
 * @param {number} index - index of node to be replaced
 * @category node
 */
export function replace(node, index) {
  if (index == -1) {
    return node;
  }
  const {scope} = node;
  const {parent} = node;
  parent.nodeList.clean(node);
  node.delete();
  node = scope.allNodes[index];
  node.parent = parent;
  parent.nodeList.push(node);
  node.updateRotation();
  return node;
}
function rotate(x1, y1, dir) {
  if (dir == 'LEFT') {
    return [-x1, y1];
  }
  if (dir == 'DOWN') {
    return [y1, x1];
  }
  if (dir == 'UP') {
    return [y1, -x1];
  }
  return [x1, y1];
}

export function extractBits(num, start, end) {
  return (num << (32 - end)) >>> (32 - (end - start + 1));
}

/**
 * find Index of a node
 * @param {Node} x - Node to be found
 * @return {number} - index of found Node.
 * @category node
 */
export function findNode(x) {
  return x.scope.allNodes.indexOf(x);
}

/**
 * function makes a node according to data provided
 * @param {JSON} data - the data used to load a Project
 * @param {Scope} scope - scope to which node has to be loaded
 * @category node
 */
export function loadNode(data, scope) {
  const n = new Node(
      data.x,
      data.y,
      data.type,
      scope.root,
      data.bitWidth,
      data.label,
  );
}

// output node=1
// input node=0
// intermediate node =2
export const NodeType = {
  Input: 0,
  Output: 1,
  Intermediate: 2,
};

/**
 * used to give id to a node.
 * @type {number}
 * @category node
 */
let uniqueIdCounter = 10;

/**
 * This class is responsible for all the Nodes.Nodes are connected using Wires
 * Nodes are of 3 types;
 * Input and output nodes belong to some CircuitElement(it's parent)
 * @param {number} x - x coord of Node.
 * @param {number} y - y coord of Node.
 * @param {number} type - type of Node.
 * @param {CircuitElement} parent - parent element.
 * @param {?number} bitWidth - the bits of node in input and output nodes.
 * @param {string} label - label for a node.
 * @category node
 */
export class Node {
  /**
   * @param {number} x - x coord of Node.
   * @param {number} y - y coord of Node.
   * @param {number} type - type of Node.
   * @param {CircuitElement} parent - parent element.
   * @param {?number} bitWidth - the bits of node in input and output nodes.
   * @param {string} label - label for a node.
   */
  constructor(x, y, type, parent, bitWidth = undefined, label = '') {
    // Should never raise, but just in case
    if (isNaN(x) || isNaN(y)) {
      this.delete();
      showError('Fatal error occurred');
      return;
    }

    forceResetNodesSet(true);

    this.objectType = 'Node';
    this.subcircuitOverride = false;
    this.id = `node${uniqueIdCounter}`;
    uniqueIdCounter++;
    this.parent = parent;
    if (type != 2 && this.parent.nodeList !== undefined) {
      this.parent.nodeList.push(this);
    }

    if (bitWidth == undefined) {
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
    this.radius = 5;
    this.clicked = false;
    this.hover = false;
    this.wasClicked = false;
    this.scope = this.parent.scope;
    /**
     * @type {string}
     * value of this.prev is
     * 'a' : whenever a node is not being dragged this.prev is 'a'
     * 'x' : when node is being dragged horizontally
     * 'y' : when node is being dragged vertically
     */
    this.prev = 'a';
    this.count = 0;
    this.highlighted = false;

    // This fn is called during rotations and setup
    this.refresh();

    if (this.type == 2) {
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
   * @param {string} label - new label
   * Function to set label
   */
  setLabel(label) {
    this.label = label;
  }

  /**
   * function to convert a node to intermediate node
   */
  convertToIntermediate() {
    this.type = 2;
    this.x = this.absX();
    this.y = this.absY();
    this.parent = this.scope.root;
    this.scope.nodes.push(this);
  }

  /**
   * Helper fuction to move a node.
   * Sets up some variable which help in changing node.
   */
  startDragging() {
    this.oldx = this.x;
    this.oldy = this.y;
  }

  /**
   * Helper function to move a node.
   */
  drag() {
    this.x = this.oldx + simulationArea.mouseX - simulationArea.mouseDownX;
    this.y = this.oldy + simulationArea.mouseY - simulationArea.mouseDownY;
  }

  /**
   * Function for saving a node
   */
  saveObject() {
    if (this.type == 2) {
      this.leftx = this.x;
      this.lefty = this.y;
    }
    const data = {
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
   * helper function to help rotating parent
   */
  updateRotation() {
    let x;
    let y;
    [x, y] = rotate(this.leftx, this.lefty, this.parent.direction);
    this.x = x;
    this.y = y;
  }

  /**
   * Refreshes a node after rotation of parent
   */
  refresh() {
    this.updateRotation();
    for (let i = 0; i < this.connections.length; i++) {
      this.connections[i].connections.clean(this);
    }
    this.connections = [];
  }

  /**
   * Gets the absolute X position of this Node.
   * @return {number} absolute X position of this Node.
   */
  absX() {
    return this.x + this.parent.x;
  }

  /**
   * Gets the absolute Y position of the node.
   * @return {number} absolute Y position of this Node.
   */
  absY() {
    return this.y + this.parent.y;
  }

  /**
   * update the scope of a node
   */
  updateScope(scope) {
    this.scope = scope;
    if (this.type == 2) {
      this.parent = scope.root;
    }
  }

  /**
   * return true if node is connected or not connected but false if undefined.
   */
  isResolvable() {
    return this.value != undefined;
  }

  /**
   * function used to reset the nodes
   */
  reset() {
    this.value = undefined;
    this.highlighted = false;
  }

  /**
   * function to connect two nodes.
   * @param {Node} node - Node to which we are connecting.
   */
  connect(node) {
    if (node == this) {
      return;
    }
    if (node.connections.contains(this)) {
      return;
    }
    const w = new Wire(this, node, this.parent.scope);
    this.connections.push(node);
    node.connections.push(this);

    updateCanvasSet(true);
    updateSimulationSet(true);
    scheduleUpdate();
  }

  /**
   * connects but doesn't draw the wire between nodes
   * @param {Node} node - Node to connect to.
   */
  connectWireLess(node) {
    if (node == this) {
      return;
    }
    if (node.connections.contains(this)) {
      return;
    }
    this.connections.push(node);
    node.connections.push(this);

    updateCanvasSet(true);
    updateSimulationSet(true);
    scheduleUpdate();
  }

  /**
   * disconnecting two nodes connected wirelessly.
   * @param {Node} node - Node to disconnect.
   */
  disconnectWireLess(node) {
    this.connections.clean(node);
    node.connections.clean(this);
  }

  /**
   * function to resolve a node
   */
  resolve() {
    // Remove propagation of values (TriState)
    if (this.value == undefined) {
      for (var i = 0; i < this.connections.length; i++) {
        if (this.connections[i].value !== undefined) {
          this.connections[i].value = undefined;
          simulationArea.simulationQueue.add(this.connections[i]);
        }
      }

      if (this.type == NodeType.Input) {
        if (this.parent.objectType == 'Splitter') {
          this.parent.removePropagation();
        } else if (this.parent.isResolvable()) {
          simulationArea.simulationQueue.add(this.parent);
        } else {
          this.parent.removePropagation();
        }
      }

      if (this.type == NodeType.Output && !this.subcircuitOverride) {
        if (
          this.parent.isResolvable() &&
          !this.parent.queueProperties.inQueue
        ) {
          if (this.parent.objectType == 'TriState') {
            if (this.parent.state.value) {
              simulationArea.simulationQueue.add(this.parent);
            }
          } else {
            simulationArea.simulationQueue.add(this.parent);
          }
        }
      }
      return;
    }

    if (this.type == 0) {
      if (this.parent.isResolvable()) {
        simulationArea.simulationQueue.add(this.parent);
      }
    }

    for (var i = 0; i < this.connections.length; i++) {
      const node = this.connections[i];

      if (node.value != this.value || node.bitWidth != this.bitWidth) {
        if (
          node.type == 1 &&
          node.value != undefined &&
          node.parent.objectType != 'TriState' &&
          !(node.subcircuitOverride && node.scope != this.scope) && // Subcircuit Input Node Output Override
          node.parent.objectType != 'SubCircuit'
        ) {
          // Subcircuit Output Node Override
          this.highlighted = true;
          node.highlighted = true;
          const circuitName = node.scope.name;
          const circuitElementName = node.parent.objectType;
          showError(
              `Contention Error: ${this.value} and ${node.value} at ${circuitElementName} in ${circuitName}`,
          );
        } else if (node.bitWidth == this.bitWidth || node.type == 2) {
          if (
            node.parent.objectType == 'TriState' &&
            node.value != undefined &&
            node.type == 1
          ) {
            if (node.parent.state.value) {
              simulationArea.contentionPending.push(node.parent);
            }
          }

          node.bitWidth = this.bitWidth;
          node.value = this.value;
          simulationArea.simulationQueue.add(node);
        } else {
          this.highlighted = true;
          node.highlighted = true;
          showError(
              `BitWidth Error: ${this.bitWidth} and ${node.bitWidth}`,
          );
        }
      }
    }
  }

  /**
   * this function checks if hover over the node
   */
  checkHover() {
    if (!simulationArea.mouseDown) {
      if (simulationArea.hover == this) {
        this.hover = this.isHover();
        if (!this.hover) {
          simulationArea.hover = undefined;
          this.showHover = false;
        }
      } else if (!simulationArea.hover) {
        this.hover = this.isHover();
        if (this.hover) {
          simulationArea.hover = this;
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
   * this function draw a node
   */
  draw() {
    const ctx = simulationArea.context;
    const color = colors.color_wire_draw;
    if (this.clicked) {
      if (this.prev == 'x') {
        drawLine(
            ctx,
            this.absX(),
            this.absY(),
            simulationArea.mouseX,
            this.absY(),
            color,
            3,
        );
        drawLine(
            ctx,
            simulationArea.mouseX,
            this.absY(),
            simulationArea.mouseX,
            simulationArea.mouseY,
            color,
            3,
        );
      } else if (this.prev == 'y') {
        drawLine(
            ctx,
            this.absX(),
            this.absY(),
            this.absX(),
            simulationArea.mouseY,
            color,
            3,
        );
        drawLine(
            ctx,
            this.absX(),
            simulationArea.mouseY,
            simulationArea.mouseX,
            simulationArea.mouseY,
            color,
            3,
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
            3,
        );
      } else {
        drawLine(
            ctx,
            this.absX(),
            this.absY(),
            this.absX(),
            simulationArea.mouseY,
            color,
            3,
        );
      }
    }
    let colorNode = colors['stroke'];
    const colorNodeConnect = colors['color_wire_con'];
    const colorNodePow = colors['color_wire_pow'];
    const colorNodeLose = colors['color_wire_lose'];
    const colorNodeSelected = colors['node'];

    if (this.bitWidth == 1) {
      colorNode = [colorNodeConnect, colorNodePow][this.value];
    }
    if (this.value == undefined) {
      colorNode = colorNodeLose;
    }
    if (this.type == 2) {
      this.checkHover();
    }
    if (this.type == 2) {
      drawCircle(ctx, this.absX(), this.absY(), 3, colorNode);
    } else {
      drawCircle(ctx, this.absX(), this.absY(), 3, colorNodeSelected);
    }

    if (
      this.highlighted ||
      simulationArea.lastSelected == this ||
      (this.isHover() &&
        !simulationArea.selected &&
        !simulationArea.shiftDown) ||
      simulationArea.multipleObjectSelections.contains(this)
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
          'RIGHT',
      );
      ctx.closePath();
      ctx.stroke();
    }

    if (this.hover || simulationArea.lastSelected == this) {
      if (this.showHover || simulationArea.lastSelected == this) {
        canvasMessageData.x = this.absX();
        canvasMessageData.y = this.absY() - 15;
        if (this.type == 2) {
          let v = 'X';
          if (this.value !== undefined) {
            v = this.value.toString(16);
          }
          if (this.label.length) {
            canvasMessageData.string = `${this.label} : ${v}`;
          } else {
            canvasMessageData.string = v;
          }
        } else if (this.label.length) {
          canvasMessageData.string = this.label;
        }
      } else {
        setTimeout(() => {
          if (simulationArea.hover) {
            simulationArea.hover.showHover = true;
          }
          updateCanvasSet(true);
          renderCanvas(globalScope);
        }, 400);
      }
    }
  }

  /**
   * checks if a node has been deleted
   */
  checkDeleted() {
    if (this.deleted) {
      this.delete();
    }
    if (this.connections.length == 0 && this.type == 2) {
      this.delete();
    }
  }

  /**
   * used to update nodes if there is a event like click or hover on the node.
   * many booleans are used to check if certain properties are to be updated.
   */
  update() {
    if (embed) {
      return;
    }

    if (this == simulationArea.hover) {
      simulationArea.hover = undefined;
    }
    this.hover = this.isHover();

    if (!simulationArea.mouseDown) {
      if (this.absX() != this.prevx || this.absY() != this.prevy) {
        // Connect to any node
        this.prevx = this.absX();
        this.prevy = this.absY();
        this.nodeConnect();
      }
    }

    if (this.hover) {
      simulationArea.hover = this;
    }

    if (
      simulationArea.mouseDown &&
      ((this.hover && !simulationArea.selected) ||
        simulationArea.lastSelected == this)
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
      if (this.type == 2) {
        if (
          !simulationArea.shiftDown &&
          simulationArea.multipleObjectSelections.contains(this)
        ) {
          for (
            let i = 0;
            i < simulationArea.multipleObjectSelections.length;
            i++
          ) {
            simulationArea.multipleObjectSelections[
                i
            ].startDragging();
          }
        }

        if (simulationArea.shiftDown) {
          simulationArea.lastSelected = undefined;
          if (
            simulationArea.multipleObjectSelections.contains(this)
          ) {
            simulationArea.multipleObjectSelections.clean(this);
          } else {
            simulationArea.multipleObjectSelections.push(this);
          }
        } else {
          simulationArea.lastSelected = this;
        }
      }
    } else if (this.wasClicked && this.clicked) {
      if (
        !simulationArea.shiftDown &&
        simulationArea.multipleObjectSelections.contains(this)
      ) {
        for (
          let i = 0;
          i < simulationArea.multipleObjectSelections.length;
          i++
        ) {
          simulationArea.multipleObjectSelections[i].drag();
        }
      }
      if (this.type == 2) {
        if (
          this.connections.length == 1 &&
          this.connections[0].absX() == simulationArea.mouseX &&
          this.absX() == simulationArea.mouseX
        ) {
          this.y = simulationArea.mouseY - this.parent.y;
          this.prev = 'a';
          return;
        }
        if (
          this.connections.length == 1 &&
          this.connections[0].absY() == simulationArea.mouseY &&
          this.absY() == simulationArea.mouseY
        ) {
          this.x = simulationArea.mouseX - this.parent.x;
          this.prev = 'a';
          return;
        }
        if (
          this.connections.length == 1 &&
          this.connections[0].absX() == this.absX() &&
          this.connections[0].absY() == this.absY()
        ) {
          this.connections[0].clicked = true;
          this.connections[0].wasClicked = true;
          simulationArea.lastSelected = this.connections[0];
          this.delete();
          return;
        }
      }

      if (
        this.prev == 'a' &&
        distance(
            simulationArea.mouseX,
            simulationArea.mouseY,
            this.absX(),
            this.absY(),
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
        this.prev == 'x' &&
        this.absY() == simulationArea.mouseY
      ) {
        this.prev = 'a';
      } else if (
        this.prev == 'y' &&
        this.absX() == simulationArea.mouseX
      ) {
        this.prev = 'a';
      }
    } else if (this.wasClicked && !this.clicked) {
      this.wasClicked = false;

      if (
        simulationArea.mouseX == this.absX() &&
        simulationArea.mouseY == this.absY()
      ) {
        return; // no new node situation
      }

      let x1;
      let y1;
      let x2;
      let y2;
      let flag = 0;
      let n1;
      let n2;

      // (x,y) present node, (x1,y1) node 1 , (x2,y2) node 2
      // n1 - node 1, n2 - node 2
      // node 1 may or may not be there
      // flag = 0  - node 2 only
      // flag = 1  - node 1 and node 2
      x2 = simulationArea.mouseX;
      y2 = simulationArea.mouseY;
      const x = this.absX();
      const y = this.absY();

      if (x != x2 && y != y2) {
        // Rare Exception Cases
        if (
          this.prev == 'a' &&
          distance(
              simulationArea.mouseX,
              simulationArea.mouseY,
              this.absX(),
              this.absY(),
          ) >= 10
        ) {
          if (
            Math.abs(
                this.x + this.parent.x - simulationArea.mouseX,
            ) >
            Math.abs(this.y + this.parent.y - simulationArea.mouseY)
          ) {
            this.prev = 'x';
          } else {
            this.prev = 'y';
          }
        }

        flag = 1;
        if (this.prev == 'x') {
          x1 = x2;
          y1 = y;
        } else if (this.prev == 'y') {
          y1 = y2;
          x1 = x;
        }
      }

      if (flag == 1) {
        for (let i = 0; i < this.parent.scope.allNodes.length; i++) {
          if (
            x1 == this.parent.scope.allNodes[i].absX() &&
            y1 == this.parent.scope.allNodes[i].absY()
          ) {
            n1 = this.parent.scope.allNodes[i];
            break;
          }
        }

        if (n1 == undefined) {
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
          x2 == this.parent.scope.allNodes[i].absX() &&
          y2 == this.parent.scope.allNodes[i].absY()
        ) {
          n2 = this.parent.scope.allNodes[i];
          break;
        }
      }

      if (n2 == undefined) {
        n2 = new Node(x2, y2, 2, this.scope.root);
        for (let i = 0; i < this.parent.scope.wires.length; i++) {
          if (this.parent.scope.wires[i].checkConvergence(n2)) {
            this.parent.scope.wires[i].converge(n2);
            break;
          }
        }
      }
      if (flag == 0) {
        this.connect(n2);
      } else {
        n1.connect(n2);
      }
      if (simulationArea.lastSelected == this) {
        simulationArea.lastSelected = n2;
      }
    }

    if (this.type == 2 && simulationArea.mouseDown == false) {
      if (this.connections.length == 2) {
        if (
          this.connections[0].absX() == this.connections[1].absX() ||
          this.connections[0].absY() == this.connections[1].absY()
        ) {
          this.connections[0].connect(this.connections[1]);
          this.delete();
        }
      } else if (this.connections.length == 0) {
        this.delete();
      }
    }
  }

  /**
   * function delete a node
   */
  delete() {
    updateSimulationSet(true);
    this.deleted = true;
    this.parent.scope.allNodes.clean(this);
    this.parent.scope.nodes.clean(this);

    this.parent.scope.root.nodeList.clean(this);

    if (simulationArea.lastSelected == this) {
      simulationArea.lastSelected = undefined;
    }
    for (let i = 0; i < this.connections.length; i++) {
      this.connections[i].connections.clean(this);
      this.connections[i].checkDeleted();
    }
    wireToBeCheckedSet(1);
    forceResetNodesSet(true);
    scheduleUpdate();
  }

  isClicked() {
    return (
      this.absX() == simulationArea.mouseX &&
      this.absY() == simulationArea.mouseY
    );
  }

  isHover() {
    return (
      this.absX() == simulationArea.mouseX &&
      this.absY() == simulationArea.mouseY
    );
  }

  /**
   * if input node: it resolves the parent
   * else: it adds all the nodes onto the stack
   * and they are processed to generate verilog
   */
  nodeConnect() {
    const x = this.absX();
    const y = this.absY();
    let n;

    for (let i = 0; i < this.parent.scope.allNodes.length; i++) {
      if (
        this != this.parent.scope.allNodes[i] &&
        x == this.parent.scope.allNodes[i].absX() &&
        y == this.parent.scope.allNodes[i].absY()
      ) {
        n = this.parent.scope.allNodes[i];
        if (this.type == 2) {
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

    if (n == undefined) {
      for (let i = 0; i < this.parent.scope.wires.length; i++) {
        if (this.parent.scope.wires[i].checkConvergence(this)) {
          let n = this;
          if (this.type != 2) {
            n = new Node(
                this.absX(),
                this.absY(),
                2,
                this.scope.root,
            );
            this.connect(n);
          }
          this.parent.scope.wires[i].converge(n);
          break;
        }
      }
    }
  }

  processVerilog() {
    if (this.type == NodeType.Input) {
      if (this.parent.isVerilogResolvable()) {
        this.scope.stack.push(this.parent);
      }
    }

    for (let i = 0; i < this.connections.length; i++) {
      if (this.connections[i].verilogLabel != this.verilogLabel) {
        this.connections[i].verilogLabel = this.verilogLabel;
        this.scope.stack.push(this.connections[i]);
      }
    }
  }
}

/**
 * delay in simulation of the node.
 * @category node
 */
Node.prototype.propagationDelay = 0;

/**
 * backward compatibility?
 * @category node
 */
Node.prototype.cleanDelete = Node.prototype.delete;

Node.prototype.processVerilog = function() {
  if (this.type == NodeType.Input) {
    this.scope.stack.push(this.parent);
  }
  for (let i = 0; i < this.connections.length; i++) {
    if (this.connections[i].verilogLabel != this.verilogLabel) {
      this.connections[i].verilogLabel = this.verilogLabel;
      this.scope.stack.push(this.connections[i]);
    }
  }
};
