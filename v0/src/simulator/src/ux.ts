/* eslint-disable import/no-cycle */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */

import { reactive, ref } from 'vue';
import { layoutModeGet } from './layoutMode';
import {
  scheduleUpdate,
  wireToBeCheckedSet,
  updateCanvasSet,
  update,
  updateSimulationSet,
} from './engine';
import simulationArea from './simulationArea';
import logixFunction from './data';
import { newCircuit, circuitProperty } from './circuit';
import modules from './modules';
import { updateRestrictedElementsInScope } from './restrictedElementDiv';
import { paste } from './events';
import { setProjectName, getProjectName } from './data/save';
import { changeScale } from './canvasApi';
import { generateImage, generateSaveData } from './data/save';
import { setupVerilogExportCodeWindow } from './verilog';
import { updateTestbenchUI, setupTestbenchUI } from './testbench';
import { applyVerilogTheme } from './Verilog2CV';
import { dragging } from './drag';

/* =====================================================
   Reactive Variables & Interfaces
===================================================== */

/**
 * @type {number} - Is used to calculate the position where an element from sidebar is dropped
 * @category ux
 */
export const uxvar = reactive({
  smartDropXX: 50,
  smartDropYY: 80,
});

// ------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------

/**
 * @type {Object} - Object stores the position of context menu;
 * @category ux
 */
interface ContextPosition {
  x: number;
  y: number;
  visible: boolean;
}

/**
 * Reactive state for the context menu.
 */
const ctxPos = reactive<ContextPosition>({
  x: 0,
  y: 0,
  visible: false,
});

/**
 * Keeps in check which property is being displayed
 * @category ux
 */
let prevPropertyObj: any = undefined;

/* =====================================================
   Context Menu Functions
===================================================== */

/**
 * Hides the context menu.
 */
export function hideContextMenu(): void {
  const contextMenu = document.getElementById('contextMenu');
  if (contextMenu) {
    contextMenu.style.opacity = '0';
    setTimeout(() => {
      contextMenu.style.visibility = 'hidden';
      ctxPos.visible = false;
    }, 200); // Hide after 200ms (originally commented "Hide after 2 sec")
  }
}

/**
 * Function displays context menu
 * @category ux
 */
export function showContextMenu(e: MouseEvent): boolean {
  if (layoutModeGet()) return false; // Hide context menu when it is in Layout Mode

  const contextMenu = document.getElementById('contextMenu');
  const simulationAreaEl = document.getElementById('simulationArea');
  if (!contextMenu || !simulationAreaEl) return false;

  // Set context menu to be visible and fully opaque.
  contextMenu.style.visibility = 'visible';
  contextMenu.style.opacity = '1';

  // Get dimensions using native DOM APIs
  const simRect = simulationAreaEl.getBoundingClientRect();
  const menuRect = contextMenu.getBoundingClientRect();
  const windowHeight = simRect.height - menuRect.height - 10;
  const windowWidth = simRect.width - menuRect.width - 10;

  // for top, left, right, bottom
  let topPosition: string = '';
  let leftPosition: string = '';
  let rightPosition: string = '';
  let bottomPosition: string = '';

  if (ctxPos.y > windowHeight && ctxPos.x <= windowWidth) {
    // When user clicks on bottom-left part of window
    leftPosition = `${ctxPos.x}px`;
    bottomPosition = `${simRect.height - ctxPos.y}px`;
    contextMenu.style.left = leftPosition;
    contextMenu.style.bottom = bottomPosition;
    contextMenu.style.right = '';
    contextMenu.style.top = '';
  } else if (ctxPos.y > windowHeight && ctxPos.x > windowWidth) {
    // When user clicks on bottom-right part of window
    bottomPosition = `${simRect.height - ctxPos.y}px`;
    rightPosition = `${simRect.width - ctxPos.x}px`;
    contextMenu.style.right = rightPosition;
    contextMenu.style.bottom = bottomPosition;
    contextMenu.style.left = '';
    contextMenu.style.top = '';
  } else if (ctxPos.y <= windowHeight && ctxPos.x <= windowWidth) {
    // When user clicks on top-left part of window
    leftPosition = `${ctxPos.x}px`;
    topPosition = `${ctxPos.y}px`;
    contextMenu.style.left = leftPosition;
    contextMenu.style.top = topPosition;
    contextMenu.style.right = '';
    contextMenu.style.bottom = '';
  } else {
    // When user clicks on top-right part of window
    rightPosition = `${simRect.width - ctxPos.x}px`;
    topPosition = `${ctxPos.y}px`;
    contextMenu.style.right = rightPosition;
    contextMenu.style.top = topPosition;
    contextMenu.style.left = '';
    contextMenu.style.bottom = '';
  }
  ctxPos.visible = true;
  return false;
}

/* =====================================================
   UI Setup & Global Event Bindings
===================================================== */

/**
 * Adds some UI elements to side bar and menu,
 * also attaches listeners to sidebar.
 * @category ux
 */
export function setupUI(): void {
  const contextMenu = document.getElementById('contextMenu');
  if (!contextMenu) {
    console.error("Context menu element not found");
    return;
  }

  // Global mousedown event: hide context menu if clicking outside it.
  document.addEventListener('mousedown', (e: MouseEvent) => {
    const rect = contextMenu.getBoundingClientRect();
    // Check if mouse is not inside the context menu and menu is visible
    if (
      ctxPos.visible &&
      e.button !== 2 && // ignore right-click
      !(e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom)
    ) {
      hideContextMenu();
    }
    // Change the position of context whenever mouse is clicked
    ctxPos.x = e.clientX;
    ctxPos.y = e.clientY;
  });

  // Bind context menu event to canvas area
  const canvasArea = document.getElementById('canvasArea');
  if (canvasArea) {
    canvasArea.addEventListener('contextmenu', (e: MouseEvent) => {
      e.preventDefault();
      showContextMenu(e);
      return false;
    });
  }

  // Bind click events for all buttons with the "logixButton" class.
  document.querySelectorAll<HTMLButtonElement>('.logixButton').forEach((button) => {
    button.addEventListener('click', () => {
      const fn = logixFunction[button.id];
      if (typeof fn === 'function') {
        fn();
      }
    });
  });

  // Commented jQuery UI code (not working):
  // $('#sideBar').resizable({ handles: 'e', // minWidth:270, });
  // $('#menu, #subcircuitMenu').accordion({ collapsible: true, active: false, heightStyle: 'content', });

  // calling apply on select theme in dropdown
  // $('#saveAsImg').on('click',function(){ saveAsImg(); });
  // $('#Save').on('click',function(){ Save(); });
  // $('#moduleProperty').draggable();
  setupPanels();
  // setupVerilogExportCodeWindow(); // Uncomment if Verilog export window is needed
}

/* =====================================================
   Property Panel Functions
===================================================== */

/**
 * Sets the previously displayed property object.
 */
export function prevPropertyObjSet(param: any): void {
  prevPropertyObj = param;
}

/**
 * Gets the previously displayed property object.
 */
export function prevPropertyObjGet(): any {
  return prevPropertyObj;
}

/**
 * Checks if the bit width input is valid.
 */
function checkValidBitWidth(): void {
  const selector = document.querySelector<HTMLInputElement>("[name='newBitWidth']");
  if (!selector) return;
  const val = Number(selector.value);
  if (!selector.value || val > 32 || val < 1 || isNaN(val)) {
    // fallback to previously saved state
    selector.value = selector.getAttribute('old-val') || '';
  } else {
    selector.setAttribute('old-val', selector.value);
  }
}

/**
 * Updates object property attributes based on user input.
 */
export function objectPropertyAttributeUpdate(event: Event): void {
  const target = event.target as HTMLInputElement;
  if (!target) return;
  checkValidBitWidth();
  scheduleUpdate();
  updateCanvasSet(true);
  wireToBeCheckedSet(1);
  let value: any = target.value;
  if (target.type === 'number') {
    value = parseFloat(value);
  }
  if (simulationArea.lastSelected && simulationArea.lastSelected[target.name]) {
    simulationArea.lastSelected[target.name](value);
    // Commented out due to property menu refresh bug:
    // prevPropertyObjSet(simulationArea.lastSelected[target.name](value)) || prevPropertyObjGet();
  } else {
    circuitProperty[target.name](value);
  }
}

/**
 * Updates checked attributes (like checkboxes) for an object.
 */
export function objectPropertyAttributeCheckedUpdate(event: Event): void {
  const target = event.target as HTMLInputElement;
  if (!target) return;
  if (target.name === 'toggleLabelInLayoutMode') return; // Hack to prevent toggleLabelInLayoutMode from toggling twice
  scheduleUpdate();
  updateCanvasSet(true);
  wireToBeCheckedSet(1);
  if (simulationArea.lastSelected && simulationArea.lastSelected[target.name]) {
    simulationArea.lastSelected[target.name](target.value);
  } else {
    circuitProperty[target.name](target.checked);
  }
}

/**
 * Attaches event listeners to property attribute elements.
 */
export function checkPropertiesUpdate(): void {
  document.querySelectorAll('.objectPropertyAttribute').forEach((el) => {
    el.removeEventListener('change', objectPropertyAttributeUpdate);
    el.removeEventListener('keyup', objectPropertyAttributeUpdate);
    el.removeEventListener('paste', objectPropertyAttributeUpdate);
    el.removeEventListener('click', objectPropertyAttributeUpdate);
    el.addEventListener('change', objectPropertyAttributeUpdate);
    el.addEventListener('keyup', objectPropertyAttributeUpdate);
    el.addEventListener('paste', objectPropertyAttributeUpdate);
    el.addEventListener('click', objectPropertyAttributeUpdate);
  });

  document.querySelectorAll('.objectPropertyAttributeChecked').forEach((el) => {
    el.removeEventListener('change', objectPropertyAttributeCheckedUpdate);
    el.removeEventListener('keyup', objectPropertyAttributeCheckedUpdate);
    el.removeEventListener('paste', objectPropertyAttributeCheckedUpdate);
    el.removeEventListener('click', objectPropertyAttributeCheckedUpdate);
    el.addEventListener('change', objectPropertyAttributeCheckedUpdate);
    el.addEventListener('keyup', objectPropertyAttributeCheckedUpdate);
    el.addEventListener('paste', objectPropertyAttributeCheckedUpdate);
    el.addEventListener('click', objectPropertyAttributeCheckedUpdate);
  });
}

/**
 * Shows properties of an object.
 * @param obj - the object whose properties we want to be shown in sidebar
 * @category ux
 */
export function showProperties(obj: any): void {
  if (obj === prevPropertyObjGet()) return;

  /*
    The original code would clear and rebuild the properties panel here.
    In a Vue application, you would typically handle this rendering in a component template.
  */
  checkPropertiesUpdate();

  // $(".moduleProperty input[type='number']").inputSpinner();  // jQuery input spinner removed
}

/**
 * Hides the properties in sidebar.
 * @category ux
 */
export function hideProperties(): void {
  const modulePropertyInner = document.getElementById('moduleProperty-inner');
  const moduleProperty = document.getElementById('moduleProperty');
  if (modulePropertyInner) {
    modulePropertyInner.innerHTML = '';
  }
  if (moduleProperty) {
    moduleProperty.style.display = 'none';
  }
  prevPropertyObjSet(undefined);
  document.querySelectorAll('.objectPropertyAttribute').forEach((el) => {
    el.removeEventListener('change', objectPropertyAttributeUpdate);
    el.removeEventListener('keyup', objectPropertyAttributeUpdate);
    el.removeEventListener('paste', objectPropertyAttributeUpdate);
    el.removeEventListener('click', objectPropertyAttributeUpdate);
  });
}

/**
 * Escapes HTML characters to prevent injection.
 * @param unsafe - the html which we wants to escape
 * @category ux
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* =====================================================
   Delete & Panel Functions
===================================================== */

/**
 * Deletes the currently selected object(s) from the simulation.
 */
export function deleteSelected(): void {
  if (
    simulationArea.lastSelected &&
    !(simulationArea.lastSelected.objectType === 'Node' && simulationArea.lastSelected.type !== 2)
  ) {
    simulationArea.lastSelected.delete();
  }

  for (let i = 0; i < simulationArea.multipleObjectSelections.length; i++) {
    if (!(simulationArea.multipleObjectSelections[i].objectType === 'Node' && simulationArea.multipleObjectSelections[i].type !== 2))
      simulationArea.multipleObjectSelections[i].cleanDelete();
  }

  simulationArea.multipleObjectSelections = [];
  simulationArea.lastSelected = undefined;
  showProperties(simulationArea.lastSelected);
  // Updated restricted elements
  updateCanvasSet(true);
  scheduleUpdate();
  updateRestrictedElementsInScope();
}

/**
 * Sets up panels, including draggable elements and panel listeners.
 */
export function setupPanels(): void {
  // Setup dragging for quick buttons (using our imported dragging function)
  dragging('#dragQPanel', '.quick-btn');

  // Setup panel listeners for multiple UI panels
  const panelSelectors = [
    '.elementPanel',
    '.layoutElementPanel',
    '#moduleProperty',
    '#layoutDialog',
    '#verilogEditorPanel',
    '.timing-diagram-panel',
    '.testbench-manual-panel',
  ];
  panelSelectors.forEach((selector) => setupPanelListeners(selector));

  // Minimize Timing Diagram (takes too much space)
  const timingMinBtn = document.querySelector('.timing-diagram-panel .minimize') as HTMLElement;
  if (timingMinBtn) timingMinBtn.click();

  // Update the Testbench Panel UI
  updateTestbenchUI();
  // Minimize Testbench UI
  const testbenchMinBtn = document.querySelector('.testbench-manual-panel .minimize') as HTMLElement;
  if (testbenchMinBtn) testbenchMinBtn.click();

  // Hack because minimizing panel then maximizing sets visibility recursively
  // updateTestbenchUI calls some hide()s which are undone by maximization
  // TODO: Remove hack
  const testbenchMaxBtn = document.querySelector('.testbench-manual-panel .maximize');
  if (testbenchMaxBtn) {
    testbenchMaxBtn.addEventListener('click', setupTestbenchUI);
  }

  // Focus the project name input when clicking on the project name element.
  const projectName = document.getElementById('projectName');
  if (projectName) {
    projectName.addEventListener('click', () => {
      const input = document.querySelector("input[name='setProjectName']") as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    });
  }
}

/**
 * Sets up panel listeners for dragging, minimizing, and maximizing.
 * @param panelSelector - the CSS selector for the panel.
 */
function setupPanelListeners(panelSelector: string): void {
  const panel = document.querySelector(panelSelector) as HTMLElement;
  if (!panel) return;

  const header = panel.querySelector('.panel-header') as HTMLElement;
  const minimizeBtn = panel.querySelector('.minimize') as HTMLElement;
  const maximizeBtn = panel.querySelector('.maximize') as HTMLElement;
  const body = panel.querySelector('.panel-body') as HTMLElement;

  if (!header) return;

  // Make the panel draggable using our imported "dragging" function.
  dragging(header, panelSelector);
  // Double-click on header toggles minimize/maximize
  let minimized = false;
  header.addEventListener('dblclick', () => {
    minimized ? maximizeBtn?.click() : minimizeBtn?.click();
  });
  // Minimize panel
  minimizeBtn?.addEventListener('click', () => {
    if (body) body.style.display = 'none';
    minimizeBtn.style.display = 'none';
    if (maximizeBtn) maximizeBtn.style.display = '';
    minimized = true;
  });
  // Maximize panel
  maximizeBtn?.addEventListener('click', () => {
    if (body) body.style.display = '';
    minimizeBtn.style.display = '';
    maximizeBtn.style.display = 'none';
    minimized = false;
  });
}

/* =====================================================
   Full View Mode Functions
===================================================== */

/**
 * Exits full preview mode and restores hidden UI elements.
 */
export function exitFullView(): void {
  const exitViewBtn = document.getElementById('exitViewBtn');
  if (exitViewBtn) exitViewBtn.remove();

  document.querySelectorAll('.navbar, .modules, .report-sidebar, #tabsBar, #moduleProperty, .timing-diagram-panel, .testbench-manual-panel, .quick-btn').forEach(
    (element) => {
      if (element instanceof HTMLElement) {
        element.style.display = '';
      }
    }
  );
}

/**
 * Enters full preview mode by hiding various UI elements and adding an exit button.
 */
export function fullView(): void {
  const app = document.getElementById('app');
  if (!app) return;

  const exitViewEl = document.createElement('button');
  exitViewEl.id = 'exitViewBtn';
  exitViewEl.textContent = 'Exit Full Preview';

  document.querySelectorAll('.navbar, .modules, .report-sidebar, #tabsBar, #moduleProperty, .timing-diagram-panel, .testbench-manual-panel, .quick-btn').forEach(
    (element) => {
      if (element instanceof HTMLElement) {
        element.style.display = 'none';
      }
    }
  );

  app.appendChild(exitViewEl);
  exitViewEl.addEventListener('click', exitFullView);
}

/* =====================================================
   Subcircuit Elements Handling
===================================================== */

/** 
 * Fills the elements that can be displayed in the subcircuit, in the subcircuit menu.
 */
export function fillSubcircuitElements(): void {
  const subcircuitMenu = document.getElementById('subcircuitMenu');
  if (!subcircuitMenu) return;

  subcircuitMenu.innerHTML = '';
  let subCircuitElementExists = false;
  for (const el of circuitElementList) {
    if (globalScope[el].length === 0) continue;
    if (!globalScope[el][0].canShowInSubcircuit) continue;
    let tempHTML = '';

    // add a panel for each existing group
    tempHTML += `<div class="panelHeader">${el}s</div>`;
    tempHTML += `<div class="panel">`;

    let available = false;
    // add an SVG for each element
    for (let i = 0; i < globalScope[el].length; i++) {
      if (!globalScope[el][i].subcircuitMetadata.showInSubcircuit) {
        tempHTML += `<div class="icon subcircuitModule" id="${el}-${i}" data-element-id="${i}" data-element-name="${el}">`;
        tempHTML += `<img src="/img/${el}.svg">`;
        tempHTML += `<p class="img__description">${
          globalScope[el][i].label !== '' ? globalScope[el][i].label : 'unlabeled'
        }</p>`;
        tempHTML += '</div>';
        available = true;
      }
    }
    tempHTML += '</div>';
    subCircuitElementExists = subCircuitElementExists || available;
    if (available) subcircuitMenu.innerHTML += tempHTML;
  }

  if (!subCircuitElementExists) {
    subcircuitMenu.innerHTML += '<p>No layout elements available</p>';
  }

  // Bind event listeners to the newly created subcircuit modules.
  subcircuitMenu.querySelectorAll('.subcircuitModule').forEach((el) => {
    el.addEventListener('mousedown', () => {
      const elementName = el.getAttribute('data-element-name');
      const elementIdStr = el.getAttribute('data-element-id');
      if (!elementName || elementIdStr === null) return;
      const elementIndex = Number(elementIdStr);
      const element = globalScope[elementName][elementIndex];
      element.subcircuitMetadata.showInSubcircuit = true;
      element.newElement = true;
      simulationArea.lastSelected = element;
      el.parentElement?.removeChild(el);
    });
  });
}

// Declarations for variables assumed to be declared elsewhere.
declare const circuitElementList: string[];
declare const globalScope: { [key: string]: any[] };
