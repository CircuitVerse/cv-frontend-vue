import {CircuitElement} from './circuit_element';
import {plotArea} from './plot_area';
import {simulationArea} from './simulation_area';
import {BackgroundArea} from './background_area';
import {
  stripTags,
  uniq,
} from './utils';
import {findDimensions, dots} from './canvas_api';
import {updateRestrictedElementsList} from './restricted_element_div';
import {scheduleBackup} from './data/backup_circuit';
import {showProperties} from './ux';
import {
  scheduleUpdate,
  updateSimulationSet,
  updateCanvasSet,
  updateSubcircuitSet,
  forceResetNodesSet,
  changeLightMode,
} from './engine';
import {toggleLayoutMode, layoutModeGet} from './layout_mode';
import {setProjectName} from './data/save';
import {changeClockEnable} from './sequential';
import {changeInputSize} from './modules';
import {verilogModeGet, verilogModeSet} from './verilog_to_cv';
import {updateTestbenchUI} from './testbench';
import {SimulatorStore} from '#/store/SimulatorStore/SimulatorStore';
import {toRefs} from 'vue';
import {provideCircuitName} from '#/components/helpers/promptComponent/PromptComponent.vue';
import {deleteCurrentCircuit} from '#/components/helpers/deleteCircuit/DeleteCircuit.vue';

export const circuitProperty = {
  toggleLayoutMode,
  setProjectName,
  changeCircuitName,
  deleteCurrentCircuit,
  changeClockEnable,
  changeInputSize,
  changeLightMode,
};

export var scopeList = {};
export function resetScopeList() {
  const simulatorStore = SimulatorStore();
  const {circuitList} = toRefs(simulatorStore);
  scopeList = {};
  circuitList.value = [];
}
/**
 * Function used to change the current focusedCircuit
 * Disables layoutMode if enabled
 * Changes UI tab etc
 * Sets flags to make updates, resets most of the things
 * @param {string} id - identifier for circuit
 * @category circuit
 */
export function switchCircuit(id) {
  const simulatorStore = SimulatorStore();
  const {circuitList} = toRefs(simulatorStore);
  const {activeCircuit} = toRefs(simulatorStore);

  if (layoutModeGet()) {
    toggleLayoutMode();
  }
  if (!scopeList[id].verilogMetadata.isVerilogCircuit) {
    verilogModeSet(false);
  }
  scheduleBackup();
  if (id === globalScope.id) {
    return;
  }
  circuitList.value.forEach((circuit) =>
        circuit.focussed ? (circuit.focussed = false) : null,
  );
  simulationArea.lastSelected = undefined;
  simulationArea.multipleObjectSelections = [];
  simulationArea.copyList = [];
  globalScope = scopeList[id];
  if (globalScope.verilogMetadata.isVerilogCircuit) {
    verilogModeSet(true);
  }
  if (globalScope.isVisible()) {
    const index = circuitList.value.findIndex(
        (circuit) => circuit.id == id,
    );
    circuitList.value[index].focussed = true;
    activeCircuit.value.id = globalScope.id;
    activeCircuit.value.name = globalScope.name;
  }
  updateSimulationSet(true);
  updateSubcircuitSet(true);
  forceResetNodesSet(true);
  dots(false);
  simulationArea.lastSelected = globalScope.root;
  if (!embed) {
    showProperties(simulationArea.lastSelected);
    updateTestbenchUI();
    plotArea.reset();
  }
  updateCanvasSet(true);
  scheduleUpdate();

  // to update the restricted elements information
  updateRestrictedElementsList();
}

/**
 * Comma separated list of dependency names
 * @param {string} scopeId
 * @return {string} Comma separated list of dependency names
 */
export function getDependenciesList(scopeId) {
  let scope = scopeList[scopeId];
  if (scope == undefined) {
    scope = scopeList[globalScope.id];
  }
  let dependencies = '';
  for (id in scopeList) {
    if (id != scope.id && scopeList[id].checkDependency(scope.id)) {
      if (dependencies === '') {
        dependencies = scopeList[id].name;
      } else {
        dependencies += `, ${scopeList[id].name}`;
      }
    }
  }
  return dependencies;
}

/**
 * Deletes the current circuit
 * Ensures that at least one circuit is there
 * Ensures that no circuit depends on the current circuit
 * Switched to a random circuit
 * @param {string} name
 * @param {string} id
 * @param {boolean} isVerilog
 * @param {boolean} isVerilogMain
 * @category circuit
 */
export async function createNewCircuitScope(
    name = undefined,
    id = undefined,
    isVerilog = false,
    isVerilogMain = false,
) {
  name = name ?? (await provideCircuitName());
  if (name instanceof Error) {
    return; // if user cancels the prompt
  }
  if (name.trim() == '') {
    name = 'Untitled-Circuit';
  }
  simulationArea.lastSelected = undefined;
  newCircuit(name, id, isVerilog, isVerilogMain);
  if (!embed) {
    showProperties(simulationArea.lastSelected);
    updateTestbenchUI();
    plotArea.reset();
  }
  return true;
}

/**
 * Function to create new circuit
 * Function creates button in tab, creates scope and switches to this circuit
 * @param {string} name - name of the new circuit
 * @param {string} id - identifier for circuit
 * @param {boolean} isVerilog
 * @param {boolean} isVerilogMain
 * @return {Scope}
 * @category circuit
 */
export function newCircuit(name, id, isVerilog = false, isVerilogMain = false) {
  const simulatorStore = SimulatorStore();
  const {circuitList} = toRefs(simulatorStore);
  const {activeCircuit} = toRefs(simulatorStore);
  if (layoutModeGet()) {
    toggleLayoutMode();
  }
  if (verilogModeGet()) {
    verilogModeSet(false);
  }
  name = name || 'Untitled-Circuit';
  name = stripTags(name);
  if (!name) {
    return;
  }
  const scope = new Scope(name);
  if (id) {
    scope.id = id;
  }
  scopeList[scope.id] = scope;
  const currCircuit = {
    id: scope.id,
    name: scope.name,
  };

  circuitList.value.push(currCircuit);
  if (isVerilog) {
    scope.verilogMetadata.isVerilogCircuit = true;
    circuitList.value.forEach((circuit) => (circuit.isVerilog = false));
    circuitList.value[circuitList.value.length - 1].isVerilog = true;
    scope.verilogMetadata.isMainCircuit = isVerilogMain;
  }
  globalScope = scope;
  // $('.circuits').removeClass('current')
  circuitList.value.forEach((circuit) => (circuit.focussed = false));
  circuitList.value[circuitList.value.length - 1].focussed = true;
  activeCircuit.value.id = scope.id;
  activeCircuit.value.name = scope.name;

  if (!isVerilog || isVerilogMain) {
    $('.circuitName').off('click');

    // switch circuit function moved inside vue component

    if (!embed) {
      $('.circuitName').on('click', () => {
        simulationArea.lastSelected = globalScope.root;
        setTimeout(() => {
          // here link with the properties panel
          document.getElementById('circname').select();
        }, 100);
      });
    }
    if (!embed) {
      showProperties(scope.root);
    }
    dots(false);
  }
  return scope;
}

/**
 * Used to change name of a circuit
 * @param {string} name - new name
 * @param {string} id - id of the circuit
 * @category circuit
 */
export function changeCircuitName(name, id = globalScope.id) {
  const simulatorStore = SimulatorStore();
  const {circuitList} = toRefs(simulatorStore);
  name = name || 'Untitled';
  name = stripTags(name);
  scopeList[id].name = name;
  const index = circuitList.value.findIndex((circuit) => circuit.id === id);
  circuitList.value[index].name = name;
}

/**
 * Class representing a Scope
 * @class
 * @param {string} name - name of the circuit
 * @param {number} id - a random id for the circuit
 * @category circuit
 */
export class Scope {
  /**
   *
   * @param {string} name
   * @param {number} id
   */
  constructor(name = 'localScope', id = undefined) {
    const backgroundAreaCanvas = document.getElementById('canvasArea');
    this.backgroundArea = new BackgroundArea(backgroundAreaCanvas);
    this.restrictedCircuitElementsUsed = [];
    this.id = id || Math.floor(Math.random() * 100000000000 + 1);
    this.CircuitElement = [];
    this.name = name;

    // root object for referring to main canvas - intermediate node uses this
    this.root = new CircuitElement(0, 0, this, 'RIGHT', 1);
    this.backups = [];
    // maintaining a state (history) for redo function
    this.history = [];
    this.timeStamp = new Date().getTime();
    this.verilogMetadata = {
      isVerilogCircuit: false,
      isMainCircuit: false,
      code: '// Write Some Verilog Code Here!',
      subCircuitScopeIds: [],
    };

    this.ox = 0;
    this.oy = 0;
    this.scale = DPR;
    this.stack = [];

    this.initialize();

    // Setting default layout
    this.layout = {
      // default position
      width: 100,
      height: 40,
      title_x: 50,
      title_y: 13,
      titleEnabled: true,
    };
  }
  /**
   * Is circuit visible.
   * @return {boolean} visibility
   */
  isVisible() {
    if (!this.verilogMetadata.isVerilogCircuit) {
      return true;
    }
    return this.verilogMetadata.isMainCircuit;
  }

  /**
   *
   */
  initialize() {
    this.tunnelList = {};
    this.pending = [];
    this.nodes = []; // intermediate nodes only
    this.allNodes = [];
    this.wires = [];

    // Creating arrays for other module elements
    for (let i = 0; i < moduleList.length; i++) {
      this[moduleList[i]] = [];
    }
  }

  /**
   * Resets all nodes recursively
   */
  reset() {
    for (let i = 0; i < this.allNodes.length; i++) {
      this.allNodes[i].reset();
    }
    for (let i = 0; i < this.Splitter.length; i++) {
      this.Splitter[i].reset();
    }
    for (let i = 0; i < this.SubCircuit.length; i++) {
      this.SubCircuit[i].reset();
    }
  }

  /**
   * Adds all inputs to simulationQueue
   * @param {any[]} inputs
   */
  addInputs() {
    for (let i = 0; i < inputList.length; i++) {
      for (let j = 0; j < this[inputList[i]].length; j++) {
        simulationArea.simulationQueue.add(this[inputList[i]][j], 0);
      }
    }
    for (let i = 0; i < this.SubCircuit.length; i++) {
      this.SubCircuit[i].addInputs();
    }
  }

  /**
   * Ticks clocks recursively -- needs to be deprecated and
   * synchronize all clocks with a global clock
   */
  clockTick() {
    for (let i = 0; i < this.Clock.length; i++) {
      this.Clock[i].toggleState();
    } // tick clock!
    for (let i = 0; i < this.SubCircuit.length; i++) {
      this.SubCircuit[i].localScope.clockTick();
    } // tick clock!
  }

  /**
   * Checks if this circuit contains directly or indirectly scope with id
   * Recursive nature
   * @param {number} id - ID of element to check.
   * @return {boolean}
   */
  checkDependency(id) {
    if (id === this.id) {
      return true;
    }
    for (let i = 0; i < this.SubCircuit.length; i++) {
      if (this.SubCircuit[i].id === id) {
        return true;
      }
    }
    for (let i = 0; i < this.SubCircuit.length; i++) {
      if (scopeList[this.SubCircuit[i].id].checkDependency(id)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get dependency list - list of all circuits, this circuit depends on
   * @return {any[]} unique list of dependencies.
   */
  getDependencies() {
    let list = [];
    for (let i = 0; i < this.SubCircuit.length; i++) {
      list.push(this.SubCircuit[i].id);
      list = list.concat(scopeList[this.SubCircuit[i].id].getDependencies());
    }
    return uniq(list);
  }

  /**
   * helper function to reduce layout size
   */
  fixLayout() {
    let maxY = 20;
    for (let i = 0; i < this.Input.length; i++) {
      maxY = Math.max(this.Input[i].layoutProperties.y, maxY);
    }
    for (let i = 0; i < this.Output.length; i++) {
      maxY = Math.max(this.Output[i].layoutProperties.y, maxY);
    }
    if (maxY !== this.layout.height) {
      this.layout.height = maxY + 10;
    }
  }

  /**
   * Function which centers the circuit to the correct zoom level
   * @param {boolean} zoomIn - Should zoom in.
   */
  centerFocus(zoomIn = true) {
    if (layoutModeGet()) {
      return;
    }
    findDimensions(this);

    // Some part of the canvas is hidden behind the toolbar
    const ytoolbarOffset = embed ? 0 : 60 * DPR;

    const minX = simulationArea.minWidth || 0;
    const minY = simulationArea.minHeight || 0;
    const maxX = simulationArea.maxWidth || 0;
    const maxY = simulationArea.maxHeight || 0;

    const reqWidth = maxX - minX + 75 * DPR;
    const reqHeight = maxY - minY + 75 * DPR;

    this.scale = Math.min(
        width / reqWidth,
        (height - ytoolbarOffset) / reqHeight,
    );

    if (!zoomIn) {
      this.scale = Math.min(this.scale, DPR);
    }
    this.scale = Math.max(this.scale, DPR / 10);

    this.ox = -minX * this.scale + (width - (maxX - minX) * this.scale) / 2;
    this.oy =
            -minY * this.scale +
            (height - ytoolbarOffset - (maxY - minY) * this.scale) / 2;
  }
}
