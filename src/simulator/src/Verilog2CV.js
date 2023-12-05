import {
  createNewCircuitScope,
  switchCircuit,
  changeCircuitName,
} from './circuit';
import {SubCircuit} from './subcircuit';
import {simulationArea} from './simulationArea';
import CodeMirror from 'codemirror/lib/codemirror.js';
import 'codemirror/lib/codemirror.css';

// Importing CodeMirror themes
import 'codemirror/theme/3024-day.css';
import 'codemirror/theme/solarized.css';
import 'codemirror/theme/elegant.css';
import 'codemirror/theme/neat.css';
import 'codemirror/theme/idea.css';
import 'codemirror/theme/neo.css';
import 'codemirror/theme/3024-night.css';
import 'codemirror/theme/blackboard.css';
import 'codemirror/theme/cobalt.css';
import 'codemirror/theme/the-matrix.css';
import 'codemirror/theme/night.css';
import 'codemirror/theme/monokai.css';
import 'codemirror/theme/midnight.css';

import 'codemirror/addon/hint/show-hint.css';
import 'codemirror/mode/verilog/verilog.js';
import 'codemirror/addon/edit/closebrackets.js';
import 'codemirror/addon/hint/anyword-hint.js';
import 'codemirror/addon/hint/show-hint.js';
import 'codemirror/addon/display/autorefresh.js';
import {showError, showMessage} from './utils_clock';
import {showProperties} from './ux';

let editor;
let verilogMode = false;

export async function createVerilogCircuit() {
  const returned = await createNewCircuitScope(
      undefined,
      undefined,
      true,
      true,
  );
  if (returned) {
    verilogModeSet(true);
  }
}

export function saveVerilogCode() {
  const code = editor.getValue();
  globalScope.verilogMetadata.code = code;
  generateVerilogCircuit(code);
}

export function applyVerilogTheme(theme) {
  localStorage.setItem('verilog-theme', theme);
  editor.setOption('theme', theme);
}

export function resetVerilogCode() {
  editor.setValue(globalScope.verilogMetadata.code);
}

export function hasVerilogCodeChanges() {
  return editor.getValue() != globalScope.verilogMetadata.code;
}

export function verilogModeGet() {
  return verilogMode;
}

export function verilogModeSet(mode) {
  if (mode == verilogMode) {
    return;
  }
  verilogMode = mode;
  if (mode) {
    document.getElementById('code-window').style.display = 'block';
    document.querySelector('.elementPanel').style.display = 'none';
    document.querySelector('.timing-diagram-panel').style.display = 'none';
    document.querySelector('.quick-btn').style.display = 'none';
    document.getElementById('verilogEditorPanel').style.display = 'block';
    if (!embed) {
      simulationArea.lastSelected = globalScope.root;
      showProperties(undefined);
      showProperties(simulationArea.lastSelected);
    }
    resetVerilogCode();
  } else {
    document.getElementById('code-window').style.display = 'none';
    document.querySelector('.elementPanel').style.display = '';
    document.querySelector('.timing-diagram-panel').style.display = '';
    document.querySelector('.quick-btn').style.display = '';
    document.getElementById('verilogEditorPanel').style.display = 'none';
  }
}

import yosysTypeMap from './VerilogClasses';

class verilogSubCircuit {
  constructor(circuit) {
    this.circuit = circuit;
  }

  getPort(portName) {
    const numInputs = this.circuit.inputNodes.length;
    const numOutputs = this.circuit.outputNodes.length;

    for (var i = 0; i < numInputs; i++) {
      if (this.circuit.data.Input[i].label == portName) {
        return this.circuit.inputNodes[i];
      }
    }

    for (var i = 0; i < numOutputs; i++) {
      if (this.circuit.data.Output[i].label == portName) {
        return this.circuit.outputNodes[i];
      }
    }
  }
}

export function YosysJSON2CV(
    JSON,
    parentScope = globalScope,
    name = 'verilogCircuit',
    subCircuitScope = {},
    root = false,
) {
  const parentID = parentScope.id;
  let subScope;
  if (root) {
    subScope = parentScope;
  } else {
    subScope = newCircuit(name, undefined, true, false);
  }
  const circuitDevices = {};

  for (var subCircuitName in JSON.subcircuits) {
    const scope = YosysJSON2CV(
        JSON.subcircuits[subCircuitName],
        subScope,
        subCircuitName,
        subCircuitScope,
    );
    subCircuitScope[subCircuitName] = scope.id;
  }

  for (const device in JSON.devices) {
    const deviceType = JSON.devices[device].type;
    if (deviceType == 'Subcircuit') {
      var subCircuitName = JSON.devices[device].celltype;
      circuitDevices[device] = new verilogSubCircuit(
          new SubCircuit(
              500,
              500,
              undefined,
              subCircuitScope[subCircuitName],
          ),
      );
    } else {
      circuitDevices[device] = new yosysTypeMap[deviceType](
          JSON.devices[device],
      );
    }
  }

  for (const connection in JSON.connectors) {
    const fromId = JSON.connectors[connection]['from']['id'];
    const fromPort = JSON.connectors[connection]['from']['port'];
    const toId = JSON.connectors[connection]['to']['id'];
    const toPort = JSON.connectors[connection]['to']['port'];

    const fromObj = circuitDevices[fromId];
    const toObj = circuitDevices[toId];

    const fromPortNode = fromObj.getPort(fromPort);
    const toPortNode = toObj.getPort(toPort);

    fromPortNode.connect(toPortNode);
  }

  if (!root) {
    switchCircuit(parentID);
    return subScope;
  }
}

export function generateVerilogCircuit(
    verilogCode,
    scope = globalScope,
) {
  const params = {code: verilogCode};
  fetch('/api/v1/simulator/verilogcv', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })
      .then((response) => {
        if (!response.ok) {
          throw response;
        }
        return response.json();
      })
      .then((circuitData) => {
        scope.initialize();
        for (const id in scope.verilogMetadata.subCircuitScopeIds) {
          delete scopeList[id];
        }
        scope.verilogMetadata.subCircuitScopeIds = [];
        scope.verilogMetadata.code = verilogCode;
        const subCircuitScope = {};
        YosysJSON2CV(
            circuitData,
            globalScope,
            'verilogCircuit',
            subCircuitScope,
            true,
        );
        changeCircuitName(circuitData.name);
        showMessage('Verilog Circuit Successfully Created');
        document.getElementById('verilogOutput').innerHTML = '';
      })
      .catch((error) => {
        if (error.status == 500) {
          showError('Could not connect to Yosys');
        } else {
          showError('There is some issue with the code');
          error.json().then((errorMessage) => {
            document.getElementById('verilogOutput').innerHTML =
                        errorMessage.message;
          });
        }
      });
}

export function setupCodeMirrorEnvironment() {
  const myTextarea = document.getElementById('codeTextArea');

  CodeMirror.commands.autocomplete = function(cm) {
    cm.showHint({hint: CodeMirror.hint.anyword});
  };

  editor = CodeMirror.fromTextArea(myTextarea, {
    mode: 'verilog',
    autoRefresh: true,
    styleActiveLine: true,
    lineNumbers: true,
    autoCloseBrackets: true,
    smartIndent: true,
    indentWithTabs: true,
    extraKeys: {'Ctrl-Space': 'autocomplete'},
  });

  if (!localStorage.getItem('verilog-theme')) {
    localStorage.setItem('verilog-theme', 'default');
  } else {
    const prevtheme = localStorage.getItem('verilog-theme');
    editor.setOption('theme', prevtheme);
  }

  editor.setValue('// Write Some Verilog Code Here!');
  setTimeout(function() {
    editor.refresh();
  }, 1);
}
