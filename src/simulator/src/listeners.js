// Most Listeners are stored here
import {
  layoutModeGet,
  tempBuffer,
  layoutUpdate,
} from './layout_mode';

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
import {scheduleBackup} from './data/backup_circuit';
import {
  hideProperties,
  deleteSelected,
  uxvar,
  exitFullView,
} from './ux';
import {
  updateRestrictedElementsList,
  updateRestrictedElementsInScope,
  hideRestricted,
  showRestricted,
} from './restricted_element_div';
import {removeMiniMap, updateLastMinimapShown} from './minimap';
import {undo} from './data/undo';
import {redo} from './data/redo';
import {copy, paste, selectAll} from './events';
import {verilogModeGet} from './verilog_to_cv';
import {setupTimingListeners} from './plot_area';

const unit = 10;
const listenToSimulator = true;

/**
 * Add DOM event listeners.
 */
export function startMainListeners() {
  const simulation = document.getElementsByClassName('simulationArea')[0];
  $(document).on('keyup', (e) => {
    if (e.key === 'Escape') {
      exitFullView();
    }
  });

  $('#projectName').on('click', () => {
    globalScope.simulationArea.lastSelected = globalScope.root;
    setTimeout(() => {
      document.getElementById('projname').select();
    }, 100);
  });

  simulation
      .addEventListener('mousedown', (e) => {
        globalScope.simulationArea.mouseDown = true;

        // Deselect Input
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }

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
        globalScope.simulationArea.oldX = globalScope.ox;
        globalScope.simulationArea.oldY = globalScope.oy;

        e.preventDefault();
        scheduleBackup();
        scheduleUpdate(1);
        $('.dropdown.open').removeClass('open');
      });
      simulation
      .addEventListener('mouseup', (e) => {
        if (globalScope.simulationArea.lastSelected) {
          globalScope.simulationArea.lastSelected.newElement = false;
        }
        /*
  handling restricted circuit elements
  */

        if (
          globalScope.simulationArea.lastSelected &&
        restrictedElements.includes(
            globalScope.simulationArea.lastSelected.objectType,
        ) &&
        !globalScope.restrictedCircuitElementsUsed.includes(
            globalScope.simulationArea.lastSelected.objectType,
        )
        ) {
          globalScope.restrictedCircuitElementsUsed.push(
              globalScope.simulationArea.lastSelected.objectType,
          );
          updateRestrictedElementsList();
        }

        // deselect multiple elements with click
        if (
          !globalScope.simulationArea.shiftDown &&
        globalScope.simulationArea.multipleObjectSelections.length > 0
        ) {
          if (
            !globalScope.simulationArea.multipleObjectSelections.includes(
                globalScope.simulationArea.lastSelected,
            )
          ) {
            globalScope.simulationArea.multipleObjectSelections = [];
          }
        }
      });
      simulation
      .addEventListener('mousemove', onMouseMove);

  window.addEventListener('keyup', (e) => {
    scheduleUpdate(1);
    globalScope.simulationArea.shiftDown = e.shiftKey;
    if (e.keyCode == 16) {
      globalScope.simulationArea.shiftDown = false;
    }
    if (e.key == 'Meta' || e.key == 'Control') {
      globalScope.simulationArea.controlDown = false;
    }
  });

  window.addEventListener(
      'keydown',
      (e) => {
        if (document.activeElement.tagName == 'INPUT') {
          return;
        }
        if (document.activeElement != document.body) {
          return;
        }

        globalScope.simulationArea.shiftDown = e.shiftKey;
        if (e.key == 'Meta' || e.key == 'Control') {
          globalScope.simulationArea.controlDown = true;
        }

        if (
          globalScope.simulationArea.controlDown &&
        e.key.charCodeAt(0) == 122 &&
        !globalScope.simulationArea.shiftDown
        ) {
        // detect the special CTRL-Z code
          undo();
        }
        if (
          globalScope.simulationArea.controlDown &&
        e.key.charCodeAt(0) == 122 &&
        globalScope.simulationArea.shiftDown
        ) {
        // detect the special Cmd + shift + z code (macOs)
          redo();
        }
        if (
          globalScope.simulationArea.controlDown &&
        e.key.charCodeAt(0) == 121 &&
        !globalScope.simulationArea.shiftDown
        ) {
        // detect the special ctrl + Y code (windows)
          redo();
        }

        if (listenToSimulator) {
          if (
            document.activeElement.tagName == 'INPUT' ||
          globalScope.simulationArea.mouseRawX < 0 ||
          globalScope.simulationArea.mouseRawY < 0 ||
          globalScope.simulationArea.mouseRawX > width ||
          globalScope.simulationArea.mouseRawY > height
          ) {
            return;
          }
          // HACK TO REMOVE FOCUS ON PROPERTIES
          if (document.activeElement.type == 'number') {
            hideProperties();
            showProperties(globalScope.simulationArea.lastSelected);
          }

          errorDetectedSet(false);
          updateSimulationSet(true);
          updatePositionSet(true);
          globalScope.simulationArea.shiftDown = e.shiftKey;

          if (e.key == 'Meta' || e.key == 'Control') {
            globalScope.simulationArea.controlDown = true;
          }

          // zoom in (+)
          if (
            (globalScope.simulationArea.controlDown &&
            (e.keyCode == 187 || e.keyCode == 171)) ||
          e.keyCode == 107
          ) {
            e.preventDefault();
            zoomIn();
          }
          // zoom out (-)
          if (
            (globalScope.simulationArea.controlDown &&
            (e.keyCode == 189 || e.keyCode == 173)) ||
          e.keyCode == 109
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
          wireToBeCheckedSet(1);

          if (
            globalScope.simulationArea.lastSelected &&
          globalScope.simulationArea.lastSelected.keyDown
          ) {
            if (
              e.key.toString().length == 1 ||
            e.key.toString() == 'Backspace' ||
            e.key.toString() == 'Enter'
            ) {
              globalScope.simulationArea.lastSelected.keyDown(e.key.toString());
              e.cancelBubble = true;
              e.returnValue = false;

              // e.stopPropagation works in Firefox.
              if (e.stopPropagation) {
                e.stopPropagation();
                e.preventDefault();
              }
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

          if (
            globalScope.simulationArea.lastSelected &&
          globalScope.simulationArea.lastSelected.keyDown3
          ) {
            if (
              e.key.toString() != 'Backspace' &&
            e.key.toString() != 'Delete'
            ) {
              globalScope.simulationArea.lastSelected.keyDown3(e.key.toString());
              return;
            }
          }

          if (e.keyCode == 16) {
            globalScope.simulationArea.shiftDown = true;
            if (
              globalScope.simulationArea.lastSelected &&
            !globalScope.simulationArea.lastSelected.keyDown &&
            globalScope.simulationArea.lastSelected.objectType != 'Wire' &&
            globalScope.simulationArea.lastSelected.objectType !=
            'CircuitElement' &&
            !globalScope.simulationArea.multipleObjectSelections.includes(
                globalScope.simulationArea.lastSelected,
            )
            ) {
              globalScope.simulationArea.multipleObjectSelections.push(
                  globalScope.simulationArea.lastSelected,
              );
            }
          }

          // Detect offline save shortcut (CTRL+SHIFT+S)
          if (
            globalScope.simulationArea.controlDown &&
          e.keyCode == 83 &&
          globalScope.simulationArea.shiftDown
          ) {
            saveOffline();
            e.preventDefault();
          }

          // Detect Select all Shortcut
          if (
            globalScope.simulationArea.controlDown &&
          (e.keyCode == 65 || e.keyCode == 97)
          ) {
            selectAll();
            e.preventDefault();
          }

          // deselect all Shortcut
          if (e.keyCode == 27) {
            globalScope.simulationArea.multipleObjectSelections = [];
            globalScope.simulationArea.lastSelected = undefined;
            e.preventDefault();
          }

          if (
            (e.keyCode == 113 || e.keyCode == 81) &&
          globalScope.simulationArea.lastSelected != undefined
          ) {
            if (globalScope.simulationArea.lastSelected.bitWidth !== undefined) {
              globalScope.simulationArea.lastSelected.newBitWidth(
                  parseInt(prompt('Enter new bitWidth'), 10),
              );
            }
          }

          if (
            globalScope.simulationArea.controlDown &&
          (e.key == 'T' || e.key == 't')
          ) {
            globalScope.simulationArea.changeClockTime(prompt('Enter Time:'));
          }
        }

        if (e.keyCode == 8 || e.key == 'Delete') {
          deleteSelected();
        }
      },
      true,
  );

  simulation
      .addEventListener('dblclick', (e) => {
        updateCanvasSet(true);
        if (
          globalScope.simulationArea.lastSelected &&
        globalScope.simulationArea.lastSelected.dblclick !== undefined
        ) {
          globalScope.simulationArea.lastSelected.dblclick();
        } else if (!globalScope.simulationArea.shiftDown) {
          globalScope.simulationArea.multipleObjectSelections = [];
        }
        scheduleUpdate(2);
      });

      simulation
      .addEventListener('mouseup', onMouseUp);

      simulation
      .addEventListener('mousewheel', MouseScroll);
      simulation
      .addEventListener('wheel', MouseScroll);
      simulation
      .addEventListener('DOMMouseScroll', MouseScroll);

  /**
   * Handle mouse scroll event.
   * @param {any} event
   */
  function MouseScroll(event) {
    updateCanvasSet(true);
    event.preventDefault();
    const deltaY = event.wheelDelta ? event.wheelDelta : -event.detail;
    const direction = deltaY > 0 ? 1 : -1;
    handleZoom(direction);
    updateCanvasSet(true);
    gridUpdateSet(true);

    if (layoutModeGet()) {
      layoutUpdate();
    } else {
      update(); // Schedule update not working, this is INEFFICIENT
    }
  }

  document.addEventListener('cut', (e) => {
    if (verilogModeGet()) {
      return;
    }
    if (document.activeElement.tagName == 'INPUT') {
      return;
    }
    if (document.activeElement.tagName != 'BODY') {
      return;
    }

    if (listenToSimulator) {
      globalScope.simulationArea.copyList =
        globalScope.simulationArea.multipleObjectSelections.slice();
      if (
        globalScope.simulationArea.lastSelected &&
        globalScope.simulationArea.lastSelected !== globalScope.simulationArea.root &&
        !globalScope.simulationArea.copyList.includes(globalScope.simulationArea.lastSelected)
      ) {
        globalScope.simulationArea.copyList.push(globalScope.simulationArea.lastSelected);
      }

      const textToPutOnClipboard = copy(globalScope.simulationArea.copyList, true);

      // Updated restricted elements
      updateRestrictedElementsInScope();
      localStorage.setItem('clipboardData', textToPutOnClipboard);
      e.preventDefault();
      if (textToPutOnClipboard == undefined) {
        return;
      }
      if (isIe) {
        window.clipboardData.setData('Text', textToPutOnClipboard);
      } else {
        e.clipboardData.setData('text/plain', textToPutOnClipboard);
      }
    }
  });

  document.addEventListener('copy', (e) => {
    if (verilogModeGet()) {
      return;
    }
    if (document.activeElement.tagName == 'INPUT') {
      return;
    }
    if (document.activeElement.tagName != 'BODY') {
      return;
    }

    if (listenToSimulator) {
      globalScope.simulationArea.copyList =
        globalScope.simulationArea.multipleObjectSelections.slice();
      if (
        globalScope.simulationArea.lastSelected &&
        globalScope.simulationArea.lastSelected !== globalScope.simulationArea.root &&
        !globalScope.simulationArea.copyList.includes(globalScope.simulationArea.lastSelected)
      ) {
        globalScope.simulationArea.copyList.push(globalScope.simulationArea.lastSelected);
      }

      const textToPutOnClipboard = copy(globalScope.simulationArea.copyList);

      // Updated restricted elements
      updateRestrictedElementsInScope();
      localStorage.setItem('clipboardData', textToPutOnClipboard);
      e.preventDefault();
      if (textToPutOnClipboard == undefined) {
        return;
      }
      if (isIe) {
        window.clipboardData.setData('Text', textToPutOnClipboard);
      } else {
        e.clipboardData.setData('text/plain', textToPutOnClipboard);
      }
    }
  });

  document.addEventListener('paste', (e) => {
    if (document.activeElement.tagName == 'INPUT') {
      return;
    }
    if (document.activeElement.tagName != 'BODY') {
      return;
    }

    if (listenToSimulator) {
      let data;
      if (isIe) {
        data = window.clipboardData.getData('Text');
      } else {
        data = e.clipboardData.getData('text/plain');
      }

      paste(data);

      // Updated restricted elements
      updateRestrictedElementsInScope();

      e.preventDefault();
    }
  });

  // 'drag and drop' event listener for subcircuit elements in layout mode
  $('#subcircuitMenu').on(
      'dragstop',
      '.draggableSubcircuitElement',
      function(event, ui) {
        const sideBarWidth = $('#guide_1')[0].clientWidth;
        let tempElement;

        if (ui.position.top > 10 && ui.position.left > sideBarWidth) {
        // make a shallow copy of the element with the new coordinates
          tempElement =
          globalScope[this.dataset.elementName][
              this.dataset.elementId
          ];

          // Changing coordinates doesn't work yet, nodes get far from element
          tempElement.x = ui.position.left - sideBarWidth;
          tempElement.y = ui.position.top;
          for (const node of tempElement.nodeList) {
            node.x = ui.position.left - sideBarWidth;
            node.y = ui.position.top;
          }

          tempBuffer.subElements.push(tempElement);
          this.parentElement.removeChild(this);
        }
      },
  );

  restrictedElements.forEach((element) => {
    $(`#${element}`).mouseover(() => {
      showRestricted();
    });

    $(`#${element}`).mouseout(() => {
      hideRestricted();
    });
  });

  zoomSliderListeners();
  // setupLayoutModePanelListeners()
  if (!embed) {
    setupTimingListeners();
  }
}

const isIe =
  navigator.userAgent.toLowerCase().indexOf('msie') != -1 ||
  navigator.userAgent.toLowerCase().indexOf('trident') != -1;

function onMouseMove(e) {
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

  if (
    globalScope.simulationArea.lastSelected &&
    (globalScope.simulationArea.mouseDown || globalScope.simulationArea.lastSelected.newElement)
  ) {
    updateCanvasSet(true);
    let fn;

    if (globalScope.simulationArea.lastSelected == globalScope.root) {
      fn = function() {
        updateSelectionsAndPane();
      };
    } else {
      fn = function() {
        if (globalScope.simulationArea.lastSelected) {
          globalScope.simulationArea.lastSelected.update();
        }
      };
    }
    scheduleUpdate(0, 20, fn);
  } else {
    scheduleUpdate(0, 200);
  }
}

function onMouseUp(e) {
  globalScope.simulationArea.mouseDown = false;
  if (!lightMode) {
    updateLastMinimapShown();
    setTimeout(removeMiniMap, 2000);
  }

  errorDetectedSet(false);
  updateSimulationSet(true);
  updatePositionSet(true);
  updateCanvasSet(true);
  gridUpdateSet(true);
  wireToBeCheckedSet(1);

  scheduleUpdate(1);
  globalScope.simulationArea.mouseDown = false;

  for (let i = 0; i < 2; i++) {
    updatePositionSet(true);
    wireToBeCheckedSet(1);
    update();
  }
  errorDetectedSet(false);
  updateSimulationSet(true);
  updatePositionSet(true);
  updateCanvasSet(true);
  gridUpdateSet(true);
  wireToBeCheckedSet(1);

  scheduleUpdate(1);
  const rect = globalScope.simulationArea.canvas.getBoundingClientRect();

  if (
    !(
      globalScope.simulationArea.mouseRawX < 0 ||
      globalScope.simulationArea.mouseRawY < 0 ||
      globalScope.simulationArea.mouseRawX > width ||
      globalScope.simulationArea.mouseRawY > height
    )
  ) {
    uxvar.smartDropXX = globalScope.simulationArea.mouseX + 100;
    uxvar.smartDropYY = globalScope.simulationArea.mouseY - 50;
  }
}

/**
 * direction is only 1 or -1
 * @param {number} direction
 */
function handleZoom(direction) {
  const zoomSlider = $('#customRange1');
  let currentSliderValue = parseInt(zoomSlider.val(), 10);
  currentSliderValue += direction;

  if (globalScope.scale > 0.5 * DPR) {
    zoomSlider.val(currentSliderValue).change();
  } else if (globalScope.scale < 4 * DPR) {
    zoomSlider.val(currentSliderValue).change();
  }

  gridUpdateSet(true);
  scheduleUpdate();
}

export function zoomIn() {
  handleZoom(1);
}

export function zoomOut() {
  handleZoom(-1);
}

function zoomSliderListeners() {
  document.getElementById('customRange1').value = 5;
  simulation
      .addEventListener('DOMMouseScroll', zoomSliderScroll);
      simulation
      .addEventListener('mousewheel', zoomSliderScroll);
  let curLevel = document.getElementById('customRange1').value;
  $(document).on('input change', '#customRange1', function(e) {
    const newValue = $(this).val();
    const changeInScale = newValue - curLevel;
    updateCanvasSet(true);
    changeScale(changeInScale * 0.1, 'zoomButton', 'zoomButton', 3);
    gridUpdateSet(true);
    curLevel = newValue;
  });


  function zoomSliderScroll(e) {
    let zoomLevel = document.getElementById('customRange1').value;
    const deltaY = e.wheelDelta ? e.wheelDelta : -e.detail;
    const directionY = deltaY > 0 ? 1 : -1;
    if (directionY > 0) {
      zoomLevel++;
    } else {
      zoomLevel--;
    }
    if (zoomLevel >= 45) {
      zoomLevel = 45;
      document.getElementById('customRange1').value = 45;
    } else if (zoomLevel <= 0) {
      zoomLevel = 0;
      document.getElementById('customRange1').value = 0;
    } else {
      document.getElementById('customRange1').value = zoomLevel;
      curLevel = zoomLevel;
    }
  }
}
