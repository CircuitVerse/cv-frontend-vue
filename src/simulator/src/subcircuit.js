import {Scope, scopeList, switchCircuit} from './circuit';
import {CircuitElement} from './circuit_element';
import {simulationArea} from './simulation_area';
import {scheduleBackup, checkIfBackup} from './data/backup_circuit';
import {
  scheduleUpdate,
  updateSimulationSet,
  updateCanvasSet,
  updateSubcircuitSet,
  forceResetNodesSet,
} from './engine';
import {loadScope} from './data/load';
import {showError} from './utils_clock';

import {Node, findNode} from './node';
import {fillText, correctWidth, rect2} from './canvas_api';
import {colors} from './themer/themer';
import {layoutModeGet} from './layout_mode';
import {verilogModeGet} from './verilog_to_cv';
import {sanitizeLabel} from './verilog_helpers';
import {SimulatorStore} from '#/store/SimulatorStore/SimulatorStore';
/**
 * Function to load a subcircuit
 * @param {JSON} savedData
 * @param {Scope} scope
 * @category subcircuit
 */
export function loadSubCircuit(savedData, scope) {
  new SubCircuit(savedData.x, savedData.y, scope, savedData.id, savedData);
}

/**
 * Prompt to create subcircuit, shows list of circuits which dont depend on
 * the current circuit.
 * @param {Scope} scope
 * @category subcircuit
 */
export function createSubCircuitPrompt(scope = globalScope) {
  if (verilogModeGet() || layoutModeGet()) {
    showError('Subcircuit cannot be inserted in this mode');
    return;
  }
  const simulatorStore = SimulatorStore();
  simulatorStore.dialogBox.insertsubcircuit_dialog = true;
}

/**
 * @class
 * @extends CircuitElement
 * @param {number} x - x coord of subcircuit.
 * @param {number} y - y coord of subcircuit.
 * @param {Scope} scope - the circuit in which subcircuit has been added.
 * @param {string} id - the id of the subcircuit scope.
 * @param {JSON} savedData - the saved data.
 * @category subcircuit
 */
export class SubCircuit extends CircuitElement {
  /**
   * @param {number} x - x coord of subcircuit.
   * @param {number} y - y coord of subcircuit.
   * @param {Scope} scope - the circuit in which subcircuit has been added.
   * @param {string} id - the id of the subcircuit scope.
   * @param {JSON} savedData - the saved data.
   */
  constructor(
      x,
      y,
      scope = globalScope,
      id = undefined,
      savedData = undefined,
  ) {
    super(x, y, scope, 'RIGHT', 1); // super call
    this.objectType = 'SubCircuit';
    this.scope.SubCircuit.push(this);
    this.id = id || prompt('Enter Id: ');
    this.directionFixed = true;
    this.fixedBitWidth = true;
    this.savedData = savedData;
    this.inputNodes = [];
    this.outputNodes = [];
    this.localScope = new Scope();
    this.preventCircuitSwitch = false; // prevents from switching circuit if double clicking element
    this.rectangleObject = false;

    const subcircuitScope = scopeList[this.id]; // Scope of the subcircuit
    // Error handing
    if (subcircuitScope == undefined) {
      // if no such scope for subcircuit exists
      showError(
          `SubCircuit : ${(savedData && savedData.title) || this.id
          } Not found`,
      );
    } else if (!checkIfBackup(subcircuitScope)) {
      // if there is no input/output nodes there will be no backup
      showError(
          `SubCircuit : ${(savedData && savedData.title) || subcircuitScope.name
          } is an empty circuit`,
      );
    } else if (subcircuitScope.checkDependency(scope.id)) {
      // check for cyclic dependency
      showError('Cyclic Circuit Error');
    }
    // Error handling, cleanup
    if (
      subcircuitScope == undefined ||
      subcircuitScope.checkDependency(scope.id)
    ) {
      if (savedData) {
        for (let i = 0; i < savedData.inputNodes.length; i++) {
          scope.allNodes[savedData.inputNodes[i]].deleted = true;
        }
        for (let i = 0; i < savedData.outputNodes.length; i++) {
          scope.allNodes[savedData.outputNodes[i]].deleted = true;
        }
      }
      return;
    }

    if (this.savedData != undefined) {
      updateSubcircuitSet(true);
      scheduleUpdate();
      this.version = this.savedData.version || '1.0';

      this.id = this.savedData.id;
      this.label = this.savedData.label || '';
      this.labelDirection = this.savedData.labelDirection || 'RIGHT';
      for (let i = 0; i < this.savedData.inputNodes.length; i++) {
        this.inputNodes.push(
            this.scope.allNodes[this.savedData.inputNodes[i]],
        );
        this.inputNodes[i].parent = this;
        this.inputNodes[i].layout_id =
          subcircuitScope.Input[i]?.layoutProperties.id;
      }
      for (let i = 0; i < this.savedData.outputNodes.length; i++) {
        this.outputNodes.push(
            this.scope.allNodes[this.savedData.outputNodes[i]],
        );
        this.outputNodes[i].parent = this;
        this.outputNodes[i].layout_id =
          subcircuitScope.Output[i]?.layoutProperties.id;
      }
      if (this.version == '1.0') {
        // For backward compatibility
        this.version = '2.0';
        this.x -= subcircuitScope.layout.width / 2;
        this.y -= subcircuitScope.layout.height / 2;
        for (let i = 0; i < this.inputNodes.length; i++) {
          this.inputNodes[i].x =
            subcircuitScope.Input[i].layoutProperties.x;
          this.inputNodes[i].y =
            subcircuitScope.Input[i].layoutProperties.y;
          this.inputNodes[i].leftX = this.inputNodes[i].x;
          this.inputNodes[i].leftY = this.inputNodes[i].y;
        }
        for (let i = 0; i < this.outputNodes.length; i++) {
          this.outputNodes[i].x =
            subcircuitScope.Output[i].layoutProperties.x;
          this.outputNodes[i].y =
            subcircuitScope.Output[i].layoutProperties.y;
          this.outputNodes[i].leftX = this.outputNodes[i].x;
          this.outputNodes[i].leftY = this.outputNodes[i].y;
        }
      }

      if (this.version == '2.0') {
        this.leftDimensionX = 0;
        this.upDimensionY = 0;
        this.rightDimensionX = subcircuitScope.layout.width;
        this.downDimensionY = subcircuitScope.layout.height;
      }

      this.nodeList = this.nodeList.concat(this.inputNodes);
      this.nodeList = this.nodeList.concat(this.outputNodes);
    } else {
      this.version = '2.0';
    }

    this.data = JSON.parse(scheduleBackup(subcircuitScope));
    this.buildCircuit(); // load the localScope for the subcircuit
    this.makeConnections(); // which will be wireless
  }

  /**
     * actually make all connection but are invisible so
     * it seems like the simulation is happening in other
     * Scope but it actually is not.
     */
  makeConnections() {
    for (let i = 0; i < this.inputNodes.length; i++) {
      this.localScope.Input[i]?.output1.connectWireLess(
          this.inputNodes[i],
      );
      this.localScope.Input[i].output1.subcircuitOverride = true;
    }

    for (let i = 0; i < this.outputNodes.length; i++) {
      this.localScope.Output[i]?.inp1.connectWireLess(this.outputNodes[i]);
      this.outputNodes[i].subcircuitOverride = true;
    }
  }

  /**
     * Function to remove wireless connections
     */
  removeConnections() {
    for (let i = 0; i < this.inputNodes.length; i++) {
      this.localScope.Input[i]?.output1.disconnectWireLess(
          this.inputNodes[i],
      );
    }

    for (let i = 0; i < this.outputNodes.length; i++) {
      this.localScope.Output[i]?.inp1.disconnectWireLess(
          this.outputNodes[i],
      );
    }
  }

  /**
     * loads the subcircuit and draws all the nodes
     */
  buildCircuit() {
    const subcircuitScope = scopeList[this.id];
    loadScope(this.localScope, this.data);
    this.localScope.name = this.data.name;
    this.lastUpdated = this.localScope.timeStamp;
    updateSimulationSet(true);
    updateCanvasSet(true);

    if (this.savedData == undefined) {
      this.leftDimensionX = 0;
      this.upDimensionY = 0;
      this.rightDimensionX = subcircuitScope.layout.width;
      this.downDimensionY = subcircuitScope.layout.height;
      for (let i = 0; i < subcircuitScope.Output.length; i++) {
        const a = new Node(
            subcircuitScope.Output[i].layoutProperties.x,
            subcircuitScope.Output[i].layoutProperties.y,
            1,
            this,
            subcircuitScope.Output[i].bitWidth,
        );
        a.layout_id = subcircuitScope.Output[i].layoutProperties.id;
        this.outputNodes.push(a);
      }
      for (let i = 0; i < subcircuitScope.Input.length; i++) {
        const a = new Node(
            subcircuitScope.Input[i].layoutProperties.x,
            subcircuitScope.Input[i].layoutProperties.y,
            0,
            this,
            subcircuitScope.Input[i].bitWidth,
        );
        a.layout_id = subcircuitScope.Input[i].layoutProperties.id;
        this.inputNodes.push(a);
      }
    }
  }

  /**
     * rebuilds the subcircuit if any change to localscope is made
     */
  reBuildCircuit() {
    this.data = JSON.parse(scheduleBackup(scopeList[this.id]));
    this.localScope = new Scope(data.name);
    loadScope(this.localScope, this.data);
    this.lastUpdated = this.localScope.timeStamp;
    this.scope.timeStamp = this.localScope.timeStamp;
  }

  /**
   * Reset the subcircuit.
   */
  reset() {
    this.removeConnections();

    const subcircuitScope = scopeList[this.id];

    for (let i = 0; i < subcircuitScope.SubCircuit.length; i++) {
      subcircuitScope.SubCircuit[i].reset();
    }

    // No Inputs or Outputs
    let emptyCircuit =
      subcircuitScope.Input.length == 0 &&
      subcircuitScope.Output.length == 0;
    // No LayoutElements
    for (const element of circuitElementList) {
      if (
        subcircuitScope[element].length > 0 &&
        subcircuitScope[element][0].canShowInSubcircuit
      ) {
        emptyCircuit = false;
        break;
      }
    }

    if (emptyCircuit) {
      showError(
          `SubCircuit : ${subcircuitScope.name} is an empty circuit`,
      );
    }

    subcircuitScope.layout.height = subcircuitScope.layout.height;
    subcircuitScope.layout.width = subcircuitScope.layout.width;
    this.leftDimensionX = 0;
    this.upDimensionY = 0;
    this.rightDimensionX = subcircuitScope.layout.width;
    this.downDimensionY = subcircuitScope.layout.height;

    const tempMapInput = {};
    for (let i = 0; i < subcircuitScope.Input.length; i++) {
      tempMapInput[subcircuitScope.Input[i].layoutProperties.id] = [
        subcircuitScope.Input[i],
        undefined,
      ];
    }
    for (let i = 0; i < this.inputNodes.length; i++) {
      if (tempMapInput.hasOwnProperty(this.inputNodes[i].layout_id)) {
        tempMapInput[this.inputNodes[i].layout_id][1] =
          this.inputNodes[i];
      } else {
        this.scope.backups = [];
        this.inputNodes[i].delete();
        const index = this.nodeList.indexOf(this.inputNodes[i]);
        if (index != -1) {
          this.nodeList.splice(index, 1);
        }
      }
    }

    for (id in tempMapInput) {
      if (tempMapInput[id][1]) {
        if (
          tempMapInput[id][0].layoutProperties.x ==
          tempMapInput[id][1].x &&
          tempMapInput[id][0].layoutProperties.y ==
          tempMapInput[id][1].y
        ) {
          tempMapInput[id][1].bitWidth = tempMapInput[id][0].bitWidth;
        } else {
          this.scope.backups = [];
          tempMapInput[id][1].delete();
          const index = this.nodeList.indexOf(tempMapInput[id][1]);
          if (index != -1) {
            this.nodeList.splice(index, 1);
          }
          tempMapInput[id][1] = new Node(
              tempMapInput[id][0].layoutProperties.x,
              tempMapInput[id][0].layoutProperties.y,
              0,
              this,
              tempMapInput[id][0].bitWidth,
          );
          tempMapInput[id][1].layout_id = id;
        }
      }
    }

    this.inputNodes = [];
    for (let i = 0; i < subcircuitScope.Input.length; i++) {
      const input =
        tempMapInput[subcircuitScope.Input[i].layoutProperties.id][0];
      if (tempMapInput[input.layoutProperties.id][1]) {
        this.inputNodes.push(tempMapInput[input.layoutProperties.id][1]);
      } else {
        const a = new Node(
            input.layoutProperties.x,
            input.layoutProperties.y,
            0,
            this,
            input.bitWidth,
        );
        a.layout_id = input.layoutProperties.id;
        this.inputNodes.push(a);
      }
    }

    const temp_map_out = {};
    for (let i = 0; i < subcircuitScope.Output.length; i++) {
      temp_map_out[subcircuitScope.Output[i].layoutProperties.id] = [
        subcircuitScope.Output[i],
        undefined,
      ];
    }
    for (let i = 0; i < this.outputNodes.length; i++) {
      if (temp_map_out.hasOwnProperty(this.outputNodes[i].layout_id)) {
        temp_map_out[this.outputNodes[i].layout_id][1] =
          this.outputNodes[i];
      } else {
        this.outputNodes[i].delete();
        const index = this.nodeList.indexOf(this.outputNodes[i]);
        if (index != -1) {
          this.nodeList.splice(index, 1);
        }
      }
    }

    for (id in temp_map_out) {
      if (temp_map_out[id][1]) {
        if (
          temp_map_out[id][0].layoutProperties.x ==
          temp_map_out[id][1].x &&
          temp_map_out[id][0].layoutProperties.y ==
          temp_map_out[id][1].y
        ) {
          temp_map_out[id][1].bitWidth = temp_map_out[id][0].bitWidth;
        } else {
          temp_map_out[id][1].delete();
          const index = this.nodeList.indexOf(temp_map_out[id][1]);
          if (index != -1) {
            this.nodeList.splice(index, 1);
          }
          temp_map_out[id][1] = new Node(
              temp_map_out[id][0].layoutProperties.x,
              temp_map_out[id][0].layoutProperties.y,
              1,
              this,
              temp_map_out[id][0].bitWidth,
          );
          temp_map_out[id][1].layout_id = id;
        }
      }
    }

    this.outputNodes = [];
    for (let i = 0; i < subcircuitScope.Output.length; i++) {
      const output =
        temp_map_out[subcircuitScope.Output[i].layoutProperties.id][0];
      if (temp_map_out[output.layoutProperties.id][1]) {
        this.outputNodes.push(
            temp_map_out[output.layoutProperties.id][1],
        );
      } else {
        const a = new Node(
            output.layoutProperties.x,
            output.layoutProperties.y,
            1,
            this,
            output.bitWidth,
        );
        a.layout_id = output.layoutProperties.id;
        this.outputNodes.push(a);
      }
    }

    if (subcircuitScope.timeStamp > this.lastUpdated) {
      this.reBuildCircuit();
    }

    // Should this be done here or only when this.reBuildCircuit() is called?
    {
      this.localScope.reset();
      updateSimulationSet(true);
      forceResetNodesSet(true);
    }

    this.makeConnections();
  }

  /**
     * Procedure after a element is clicked inside a subcircuit
     **/
  click() {
    const elementClicked = this.getElementHover();
    if (elementClicked) {
      this.lastClickedElement = elementClicked;
      elementClicked.wasClicked = true;
    }
  }

  getElementHover() {
    const rX = this.layoutProperties.rightDimensionX;
    const lX = this.layoutProperties.leftDimensionX;
    const uY = this.layoutProperties.upDimensionY;
    const dY = this.layoutProperties.downDimensionY;

    for (const el of circuitElementList) {
      if (this.localScope[el].length === 0) {
        continue;
      }
      if (!this.localScope[el][0].canShowInSubcircuit) {
        continue;
      }
      for (let i = 0; i < this.localScope[el].length; i++) {
        const obj = this.localScope[el][i];
        if (
          obj.subcircuitMetadata.showInSubcircuit &&
          obj.isSubcircuitHover(this.x, this.y)
        ) {
          return obj;
        }
      }
    }
  }

  /**
     * Sets the elements' wasClicked property in the subcircuit to false
     **/
  releaseClick() {
    if (this.lastClickedElement !== undefined) {
      this.lastClickedElement.wasClicked = false;
      this.lastClickedElement = undefined;
    }
  }

  /**
     * adds all local scope inputs to the global scope simulation queue
     */
  addInputs() {
    for (let i = 0; i < subCircuitInputList.length; i++) {
      for (
        let j = 0;
        j < this.localScope[subCircuitInputList[i]].length;
        j++
      ) {
        simulationArea.simulationQueue.add(
            this.localScope[subCircuitInputList[i]][j],
            0,
        );
      }
    }
    for (let j = 0; j < this.localScope.SubCircuit.length; j++) {
      this.localScope.SubCircuit[j].addInputs();
    }
  }

  /**
     * Procedure if any element is double clicked inside a subcircuit
     **/
  dblclick() {
    if (this.elementHover) {
      return;
    }
    switchCircuit(this.id);
  }

  /**
     * Returns a javascript object of subcircuit data.
     * Does not include data of subcircuit elements apart from Input and Output (that is a part of element.subcircuitMetadata)
     **/
  saveObject() {
    const data = {
      x: this.x,
      y: this.y,
      id: this.id,
      label: this.label,
      labelDirection: this.labelDirection,
      inputNodes: this.inputNodes.map(findNode),
      outputNodes: this.outputNodes.map(findNode),
      version: this.version,
    };
    return data;
  }

  /**
   * By design, subcircuit element's input and output nodes are wirelessly
   * connected to the localscope (clone of the scope of the subcircuit's
   * circuit). So it is almost like the actual circuit is copied in the
   * location of the subcircuit element. Therefore no resolve needed.
   * @return {boolean} always false
   */
  isResolvable() {
    return false;
  }

  /**
   * If element not resolvable (always in subcircuits), removePropagation
   * is called on it.
   */
  removePropagation() {
    // Leave this to the scope of the subcircuit. Do nothing.
  }

  verilogName() {
    return sanitizeLabel(scopeList[this.id].name);
  }

  /**
   * determines where to show label
   */
  determine_label(x, y) {
    if (x == 0) {
      return ['left', 5, 5];
    }
    if (x == scopeList[this.id].layout.width) {
      return ['right', -5, 5];
    }
    if (y == 0) {
      return ['center', 0, 13];
    }
    return ['center', 0, -6];
  }

  /**
   *
   */
  checkHover() {
    super.checkHover();
    if (this.elementHover) {
      this.elementHover.hover = false;
      this.elementHover = undefined;
      simulationArea.hover = undefined;
    }
    const elementHover = this.getElementHover();
    if (elementHover) {
      elementHover.hover = true;
      this.elementHover = elementHover;
      this.hover = false;
      simulationArea.hover = elementHover;
    }
  }

  /**
   * @memberof SubCircuit
   * Draws the subcircuit (and contained elements)
   * @param {CanvasRenderingContext2D} ctx
   */
  customDraw(ctx) {
    const subcircuitScope = scopeList[this.id];
    ctx.lineWidth = globalScope.scale * 3;
    ctx.strokeStyle = colors['stroke'];
    ctx.fillStyle = colors['fill'];
    const xx = this.x;
    const yy = this.y;

    ctx.strokeStyle = colors['stroke'];
    ctx.fillStyle = colors['fill'];
    ctx.lineWidth = correctWidth(3);
    ctx.beginPath();
    rect2(
        ctx,
        -this.leftDimensionX,
        -this.upDimensionY,
        this.leftDimensionX + this.rightDimensionX,
        this.upDimensionY + this.downDimensionY,
        this.x,
        this.y,
        [this.direction, 'RIGHT'][+this.directionFixed],
    );
    if (!this.elementHover) {
      if (
        (this.hover && !simulationArea.shiftDown) ||
        simulationArea.lastSelected === this ||
        simulationArea.multipleObjectSelections.includes(this)
      ) {
        ctx.fillStyle = colors['hover_select'];
      }
    }
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();

    ctx.textAlign = 'center';
    ctx.fillStyle = 'black';
    if (this.version == '1.0') {
      fillText(
          ctx,
          subcircuitScope.name,
          xx,
          yy - subcircuitScope.layout.height / 2 + 13,
          11,
      );
    } else if (this.version == '2.0') {
      if (subcircuitScope.layout.titleEnabled) {
        fillText(
            ctx,
            subcircuitScope.name,
            subcircuitScope.layout.title_x + xx,
            yy + subcircuitScope.layout.title_y,
            11,
        );
      }
    }

    for (let i = 0; i < subcircuitScope.Input.length; i++) {
      if (!subcircuitScope.Input[i].label) {
        continue;
      }
      const info = this.determine_label(
          this.inputNodes[i].x,
          this.inputNodes[i].y,
      );
      ctx.textAlign = info[0];
      fillText(
          ctx,
          subcircuitScope.Input[i].label,
          this.inputNodes[i].x + info[1] + xx,
          yy + this.inputNodes[i].y + info[2],
          12,
      );
    }

    for (let i = 0; i < subcircuitScope.Output.length; i++) {
      if (!subcircuitScope.Output[i].label) {
        continue;
      }
      const info = this.determine_label(
          this.outputNodes[i].x,
          this.outputNodes[i].y,
      );
      ctx.textAlign = info[0];
      fillText(
          ctx,
          subcircuitScope.Output[i].label,
          this.outputNodes[i].x + info[1] + xx,
          yy + this.outputNodes[i].y + info[2],
          12,
      );
    }
    ctx.fill();
    for (let i = 0; i < this.outputNodes.length; i++) {
      this.outputNodes[i].draw();
    }
    for (let i = 0; i < this.inputNodes.length; i++) {
      this.inputNodes[i].draw();
    }

    // draw subcircuitElements
    for (const el of circuitElementList) {
      if (this.localScope[el].length === 0) {
        continue;
      }
      if (!this.localScope[el][0].canShowInSubcircuit) {
        continue;
      }
      for (let i = 0; i < this.localScope[el].length; i++) {
        if (
          this.localScope[el][i].subcircuitMetadata.showInSubcircuit
        ) {
          this.localScope[el][i].drawLayoutMode(this.x, this.y);
        }
      }
    }
  }
}
SubCircuit.prototype.centerElement = true; // To center subcircuit when new
SubCircuit.prototype.propagationDelayFixed = true;
