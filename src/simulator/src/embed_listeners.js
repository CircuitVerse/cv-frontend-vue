// Listeners when circuit is embedded
// Refer listeners.js

import {
  scheduleUpdate,
  update,
  updateSelectionsAndPane,
  wireToBeCheckedSet,
  updatePositionSet,
  updateSimulationSet,
  updateCanvasSet,
  gridUpdateSet,
  errorDetectedSet,
} from './engine';
import {changeScale} from './canvas_api';
import {zoomIn, zoomOut} from './listeners';

const unit = 10;

/**
 *
 */
export function startListeners() {
  const simulation = document.getElementsByClassName('simulationArea')[0];
  window.addEventListener('keyup', (e) => {
    scheduleUpdate(1);
    if (e.keyCode == 16) {
      globalScope.simulationArea.shiftDown = false;
    }
    if (e.key == 'Meta' || e.key == 'Control') {
      globalScope.simulationArea.controlDown = false;
    }
  });

  simulation
      .addEventListener('mousedown', (e) => {
        errorDetectedSet(false);
        updateSimulationSet(true);
        updatePositionSet(true);
        updateCanvasSet(true);

        globalScope.simulationArea.lastSelected = undefined;
        globalScope.simulationArea.selected = false;
        globalScope.simulationArea.hover = undefined;
        const rect = globalScope.simulationArea.canvas.getBoundingClientRect();
        globalScope.simulationArea.mouseDownRawX = (e.clientX - rect.left) * DPR;
        globalScope.simulationArea.mouseDownRawY = (e.clientY - rect.top) * DPR;
        globalScope.simulationArea.mouseDownX =
                Math.round(
                    (globalScope.simulationArea.mouseDownRawX - globalScope.ox) /
                        globalScope.scale /
                        unit,
                ) * unit;
        globalScope.simulationArea.mouseDownY =
                Math.round(
                    (globalScope.simulationArea.mouseDownRawY - globalScope.oy) /
                        globalScope.scale /
                        unit,
                ) * unit;
        globalScope.simulationArea.mouseDown = true;
        globalScope.simulationArea.oldX = globalScope.ox;
        globalScope.simulationArea.oldY = globalScope.oy;

        e.preventDefault();
        scheduleUpdate(1);
      });

  simulation
      .addEventListener('mousemove', () => {
        const ele = document.getElementById('elementName');
        if (globalScope && globalScope.simulationArea && globalScope.simulationArea.objectList) {
          let {objectList} = globalScope.simulationArea;
          objectList = objectList.filter((val) => val !== 'wires');

          for (let i = 0; i < objectList.length; i++) {
            for (
              let j = 0;
              j < globalScope[objectList[i]].length;
              j++
            ) {
              if (globalScope[objectList[i]][j].isHover()) {
                ele.style.display = 'block';
                if (objectList[i] === 'SubCircuit') {
                  ele.innerHTML = `Subcircuit: ${globalScope.SubCircuit[j].data.name}`;
                } else {
                  ele.innerHTML = `CircuitElement: ${objectList[i]}`;
                }
                return;
              }
            }
          }
        }

        ele.style.display = 'none';
        document.getElementById('elementName').innerHTML = '';
      });

  window.addEventListener('mousemove', (e) => {
    const rect = globalScope.simulationArea.canvas.getBoundingClientRect();
    globalScope.simulationArea.mouseRawX = (e.clientX - rect.left) * DPR;
    globalScope.simulationArea.mouseRawY = (e.clientY - rect.top) * DPR;
    globalScope.simulationArea.mouseXf =
            (globalScope.simulationArea.mouseRawX - globalScope.ox) / globalScope.scale;
    globalScope.simulationArea.mouseYf =
            (globalScope.simulationArea.mouseRawY - globalScope.oy) / globalScope.scale;
    globalScope.simulationArea.mouseX = Math.round(globalScope.simulationArea.mouseXf / unit) * unit;
    globalScope.simulationArea.mouseY = Math.round(globalScope.simulationArea.mouseYf / unit) * unit;

    updateCanvasSet(true);
    if (globalScope.simulationArea.lastSelected == globalScope.root) {
      updateCanvasSet(true);
      let fn;
      fn = function() {
        updateSelectionsAndPane();
      };
      scheduleUpdate(0, 20, fn);
    } else {
      scheduleUpdate(0, 200);
    }
  });
  window.addEventListener('keydown', (e) => {
    errorDetectedSet(false);
    updateSimulationSet(true);
    updatePositionSet(true);

    // zoom in (+)
    if (e.key == 'Meta' || e.key == 'Control') {
      globalScope.simulationArea.controlDown = true;
    }

    if (
      globalScope.simulationArea.controlDown &&
            (e.keyCode == 187 || e.KeyCode == 171)
    ) {
      e.preventDefault();
      zoomIn();
    }

    // zoom out (-)
    if (
      globalScope.simulationArea.controlDown &&
            (e.keyCode == 189 || e.Keycode == 173)
    ) {
      e.preventDefault();
      zoomOut();
    }

    if (
      globalScope.simulationArea.mouseRawX < 0 ||
            globalScope.simulationArea.mouseRawY < 0 ||
            globalScope.simulationArea.mouseRawX > width ||
            globalScope.simulationArea.mouseRawY > height
    ) {
      return;
    }

    scheduleUpdate(1);
    updateCanvasSet(true);

    if (
      globalScope.simulationArea.lastSelected &&
            globalScope.simulationArea.lastSelected.keyDown
    ) {
      if (
        e.key.toString().length == 1 ||
                e.key.toString() == 'Backspace'
      ) {
        globalScope.simulationArea.lastSelected.keyDown(e.key.toString());
        return;
      }
    }
    if (
      globalScope.simulationArea.lastSelected &&
            globalScope.simulationArea.lastSelected.keyDown2
    ) {
      if (e.key.toString().length == 1) {
        globalScope.simulationArea.lastSelected.keyDown2(e.key.toString());
        return;
      }
    }

    if (e.key == 'T' || e.key == 't') {
      globalScope.simulationArea.changeClockTime(prompt('Enter Time:'));
    }
  });
  simulation
      .addEventListener('dblclick', (e) => {
        scheduleUpdate(2);
        if (
          globalScope.simulationArea.lastSelected &&
                globalScope.simulationArea.lastSelected.dblclick !== undefined
        ) {
          globalScope.simulationArea.lastSelected.dblclick();
        }
      });

  window.addEventListener('mouseup', (e) => {
    globalScope.simulationArea.mouseDown = false;
    errorDetectedSet(false);
    updateSimulationSet(true);
    updatePositionSet(true);
    updateCanvasSet(true);
    gridUpdateSet(true);
    wireToBeCheckedSet(1);

    scheduleUpdate(1);
  });
  window.addEventListener('mousedown', function(e) {
    this.focus();
  });

  simulation
      .addEventListener('mousewheel', MouseScroll);
  simulation
      .addEventListener('DOMMouseScroll', MouseScroll);

  function MouseScroll(event) {
    updateCanvasSet(true);

    event.preventDefault();
    const deltaY = event.wheelDelta ? event.wheelDelta : -event.detail;
    const scrolledUp = deltaY < 0;
    const scrolledDown = deltaY > 0;

    if (event.ctrlKey) {
      if (scrolledUp && globalScope.scale > 0.5 * DPR) {
        changeScale(-0.1 * DPR);
      }
      if (scrolledDown && globalScope.scale < 4 * DPR) {
        changeScale(0.1 * DPR);
      }
    } else {
      if (scrolledUp && globalScope.scale < 4 * DPR) {
        changeScale(0.1 * DPR);
      }
      if (scrolledDown && globalScope.scale > 0.5 * DPR) {
        changeScale(-0.1 * DPR);
      }
    }

    updateCanvasSet(true);
    gridUpdateSet(true);
    update(); // Schedule update not working, this is INEFFICENT
  }
}

const isIe =
    navigator.userAgent.toLowerCase().indexOf('msie') != -1 ||
    navigator.userAgent.toLowerCase().indexOf('trident') != -1;
