import {resetScopeList, newCircuit, switchCircuit} from '../circuit';
import {setProjectName} from './save';
import {
  scheduleUpdate,
  update,
  updateSimulationSet,
  updateCanvasSet,
  gridUpdateSet,
} from '../engine';
import {updateRestrictedElementsInScope} from '../restricted_element_div';
import {simulationArea} from '../simulation_area';

import {loadSubCircuit} from '../subcircuit';
import {scheduleBackup} from './backupCircuit';
import {showProperties} from '../ux';
import {constructNodeConnections, loadNode, replace} from '../node';
import {generateId} from '../utils';
import {modules} from '../modules';
import {oppositeDirection} from '../canvasApi';
import {plotArea} from '../plot_area';
import {updateTestbenchUI, TestbenchData} from '../testbench';
import {SimulatorStore} from '#/store/SimulatorStore/SimulatorStore';
import {toRefs} from 'vue';
import {ForceConnection, ForceNode, ForceDirectedGraph} from '../layout/force_directed_graph';

/**
 * Function to load CircuitElements
 * @param {JSON} data - JSOn data
 * @param {Scope} scope - circuit in which we want to load modules
 * @category data
 */
function loadModule(data, scope) {
  // Create circuit element
  const params = [];
  const constructorParams = modules[data.objectType].prototype.constructorParameters;
  for (let i = 0; i < constructorParams.length; i++) {
    params.push(data.customData[constructorParams[i]]);
  }
  const obj = new modules[data.objectType](
      data.x,
      data.y,
      scope,
      ...params,
  );
  // Sets directions
  obj.label = data.label || '';
  obj.labelDirection =
    data.labelDirection || oppositeDirection[obj.direction];

  // Sets delay
  obj.propagationDelay = data.propagationDelay || obj.propagationDelay;

  // Replace new nodes with the correct old nodes (with connections)
  if (data.nodes) {
    for (const node in data.nodes) {
      const n = data.nodes[node];
      if (n instanceof Array) {
        for (let i = 0; i < n.length; i++) {
          obj[node][i] = replace(obj[node][i], n[i]);
        }
      } else {
        obj[node] = replace(obj[node], n);
      }
    }
  }
  if (data.subcircuitMetadata) {
    obj.subcircuitMetadata = data['subcircuitMetadata'];
  }
}

/**
 * This function shouldn't ideally exist. But temporary fix
 * for some issues while loading nodes.
 * @param {Scope} scope scope
 * @category data
 */
function removeBugNodes(scope = globalScope) {
  let x = scope.allNodes.length;
  for (let i = 0; i < x; i++) {
    if (
      scope.allNodes[i].type !== 2 &&
      scope.allNodes[i].parent.objectType === 'CircuitElement'
    ) {
      scope.allNodes[i].delete();
    }
    if (scope.allNodes.length !== x) {
      i = 0;
      x = scope.allNodes.length;
    }
  }
}

/**
 * Function to load a full circuit
 * @param {Scope} scope
 * @param {JSON} data
 * @category data
 */
export function loadScope(scope, data) {
  const ML = moduleList.slice(); // Module List copy
  data.restrictedCircuitElementsUsed = data.restrictedCircuitElementsUsed || [];
  scope.restrictedCircuitElementsUsed = data.restrictedCircuitElementsUsed;
  data.nodes = data.nodes || [];
  // Load all nodes
  data.allNodes.map((x) => loadNode(x, scope));

  // Make all connections
  for (let i = 0; i < data.allNodes.length; i++) {
    constructNodeConnections(scope.allNodes[i], data.allNodes[i]);
  }
  // Load all modules
  for (let i = 0; i < data.elements.length; i++) {
    const el = data.elements[i];
    if (el.objectType === 'SubCircuit') {
      // Load subcircuits differently
      loadSubCircuit(el, scope);
    } else {
      loadModule(el, scope);
    }
  }
  // Update wires according
  scope.wires.map((x) => {
    x.updateData(scope);
  });
  removeBugNodes(scope); // To be deprecated

  // If Verilog Circuit Metadata exists, then restore
  if (data.verilogMetadata) {
    scope.verilogMetadata = data.verilogMetadata;
  }

  // If Test exists, then restore
  if (data.testbenchData) {
    globalScope.testbenchData = new TestbenchData(
        data.testbenchData.testData,
        data.testbenchData.currentGroup,
        data.testbenchData.currentCase,
    );
  }

  // If layout exists, then restore
  if (data.layout) {
    scope.layout = data.layout;
  } else {
    // generate layout how it would have been (backward compatibility)
    scope.layout = {};
    scope.layout.width = 100;
    scope.layout.height =
      Math.max(scope.Input.length, scope.Output.length) * 20 + 20;
    scope.layout.title_x = 50;
    scope.layout.title_y = 13;
    for (let i = 0; i < scope.Input.length; i++) {
      scope.Input[i].layoutProperties = {
        x: 0,
        y:
          scope.layout.height / 2 -
          scope.Input.length * 10 +
          20 * i +
          10,
        id: generateId(),
      };
    }
    for (let i = 0; i < scope.Output.length; i++) {
      scope.Output[i].layoutProperties = {
        x: scope.layout.width,
        y:
          scope.layout.height / 2 -
          scope.Output.length * 10 +
          20 * i +
          10,
        id: generateId(),
      };
    }
  }
  // Backward compatibility
  if (scope.layout.titleEnabled === undefined) {
    scope.layout.titleEnabled = true;
  }
}

/**
 *
 */
function automaticLayout(scope) {
  const ML = moduleList.slice();
  const links = [];
  const elements = [];
  const nodes = [];
  for (let i = 0; i < ML.length; i++) {
    if (scope[ML[i]]) {
      for (let j = 0; j < scope[ML[i]].length; j++) {
        const element = scope[ML[i]][j];
        nodes.push(new ForceNode(Math.random() * 1000, Math.random() * 1000,
            0, 0, element));
        elements.push(element);
      }
    }
  }
  for (let i = 0; i < nodes.length; i++) {
    console.log('HERE');
    const element = nodes[i].reference;
    console.log(element);
    for (let k = 0; k < element.nodeList.length; k++) {
      console.log(element.nodeList[k]);
      if (element.nodeList[k].type == 0) {
        const c = elements.indexOf(element.nodeList[k].connections[0].parent);
        if (c < 0) {
          console.log(element.nodeList[k].connections[0]);
        } else {
          links.push(new ForceConnection(c, i));
        }
        console.log(links);
      }
    }
  }

  console.log(nodes);
  console.log(links);
  const graph = new ForceDirectedGraph(nodes, links);
  graph.simulate(100);
  for (let i = 0; i < nodes.length; i++) {
    nodes[i].reference.x = nodes[i].x;
    nodes[i].reference.y = nodes[i].y;
    nodes[i].reference.prevx = nodes[i].x;
    nodes[i].reference.prevy = nodes[i].y;
  }
  console.log(graph);
}

// Function to load project from data
/**
 * loads a saved project
 * @param {JSON} data - the json data of the
 * @category data
 * @exports load
 */
export function load(data) {
  // If project is new and no data is there, then just set project name
  const simulatorStore = SimulatorStore();
  const {circuitList} = toRefs(simulatorStore);

  if (!data) {
    setProjectName(__projectName);
    return;
  }
  setProjectName(data.name);

  globalScope = undefined;
  resetScopeList(); // Remove default scope
  // $('.circuits').remove() // Delete default scope

  // Load all  according to the dependency order
  for (let i = 0; i < data.scopes.length; i++) {
    let isVerilogCircuit = false;
    let isMainCircuit = false;
    if (data.scopes[i].verilogMetadata) {
      isVerilogCircuit = data.scopes[i].verilogMetadata.isVerilogCircuit;
      isMainCircuit = data.scopes[i].verilogMetadata.isMainCircuit;
    }
    // Create new circuit
    const scope = newCircuit(
        data.scopes[i].name || 'Untitled',
        data.scopes[i].id,
        isVerilogCircuit,
        isMainCircuit,
    );

    // Load circuit data
    loadScope(scope, data.scopes[i]);

    // Focus circuit
    globalScope = scope;

    // Center circuit
    if (embed) {
      globalScope.centerFocus(true);
    } else {
      globalScope.centerFocus(false);
    }

    // update and backup circuit once
    update(globalScope, true);

    // Updating restricted element list initially on loading
    updateRestrictedElementsInScope();

    scheduleBackup();
  }

  // Restore clock
  simulationArea.changeClockTime(data.timePeriod || 500);
  simulationArea.clockEnabled =
    data.clockEnabled === undefined ? true : data.clockEnabled;

  if (!embed) {
    showProperties(simulationArea.lastSelected);
  }

  // Reorder tabs according to the saved order
  if (data.orderedTabs) {
    circuitList.value.sort((a, b) => {
      return data.orderedTabs.indexOf(String(a.id)) -
          data.orderedTabs.indexOf(String(b.id));
    });
  }

  // Switch to last focussedCircuit
  if (data.focussedCircuit) {
    switchCircuit(String(data.focussedCircuit));
  }

  // Update the testbench UI
  updateTestbenchUI();

  updateSimulationSet(true);
  updateCanvasSet(true);
  gridUpdateSet(true);
  // Reset Timing
  if (!embed) {
    plotArea.reset();
  }
  scheduleUpdate(1);
}
