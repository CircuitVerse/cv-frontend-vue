// ui.ts
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

/* ===============================
   Reactive Variables & Interfaces
   =============================== */

// A reactive object to hold UX parameters
export const uxvar = reactive({
  smartDropXX: 50,
  smartDropYY: 80,
});

// Interface for the context menu position and visibility
interface ContextPosition {
  x: number;
  y: number;
  visible: boolean;
}

// Reactive state for the context menu
const ctxPos = reactive<ContextPosition>({
  x: 0,
  y: 0,
  visible: false,
});

// Variable to hold the last shown property object
let prevPropertyObj: any = undefined;

/* ===============================
   Context Menu Functions
   =============================== */

export function hideContextMenu(): void {
  const contextMenu = document.getElementById('contextMenu');
  if (contextMenu) {
    contextMenu.style.opacity = '0';
    setTimeout(() => {
      contextMenu.style.visibility = 'hidden';
      ctxPos.visible = false;
    }, 200);
  }
}

export function showContextMenu(e: MouseEvent): boolean {
  if (layoutModeGet()) return false; // Do nothing in layout mode

  const contextMenu = document.getElementById('contextMenu');
  const simulationAreaEl = document.getElementById('simulationArea');
  if (!contextMenu || !simulationAreaEl) return false;

  contextMenu.style.visibility = 'visible';
  contextMenu.style.opacity = '1';

  // Get dimensions using native DOM APIs
  const simRect = simulationAreaEl.getBoundingClientRect();
  const menuRect = contextMenu.getBoundingClientRect();
  const windowHeight = simRect.height - menuRect.height - 10;
  const windowWidth = simRect.width - menuRect.width - 10;

  let topPosition: string = '';
  let leftPosition: string = '';
  let rightPosition: string = '';
  let bottomPosition: string = '';

  // Adjust position based on current context coordinates (ctxPos)
  if (ctxPos.y > windowHeight && ctxPos.x <= windowWidth) {
    // Bottom-left part of the window
    leftPosition = `${ctxPos.x}px`;
    // Compute a bottom position relative to the simulation area
    bottomPosition = `${simRect.height - ctxPos.y}px`;
    contextMenu.style.left = leftPosition;
    contextMenu.style.bottom = bottomPosition;
    contextMenu.style.top = '';
    contextMenu.style.right = '';
  } else if (ctxPos.y > windowHeight && ctxPos.x > windowWidth) {
    // Bottom-right part
    bottomPosition = `${simRect.height - ctxPos.y}px`;
    rightPosition = `${simRect.width - ctxPos.x}px`;
    contextMenu.style.right = rightPosition;
    contextMenu.style.bottom = bottomPosition;
    contextMenu.style.left = '';
    contextMenu.style.top = '';
  } else if (ctxPos.y <= windowHeight && ctxPos.x <= windowWidth) {
    // Top-left part
    leftPosition = `${ctxPos.x}px`;
    topPosition = `${ctxPos.y}px`;
    contextMenu.style.left = leftPosition;
    contextMenu.style.top = topPosition;
    contextMenu.style.right = '';
    contextMenu.style.bottom = '';
  } else {
    // Top-right part
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

/* ===============================
   UI Setup & Global Event Bindings
   =============================== */

export function setupUI(): void {
  const contextMenu = document.getElementById('contextMenu');
  if (!contextMenu) {
    console.error("Context menu element not found");
    return;
  }

  // Global mousedown event: hide context menu if clicking outside it
  document.addEventListener('mousedown', (e: MouseEvent) => {
    const rect = contextMenu.getBoundingClientRect();
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
    // Update context menu position coordinates
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

  // Bind click events for all buttons with the "logixButton" class
  document.querySelectorAll<HTMLButtonElement>('.logixButton').forEach((button) => {
    button.addEventListener('click', () => {
      const fn = logixFunction[button.id];
      if (typeof fn === 'function') {
        fn();
      }
    });
  });

  // Initialize panels and (optionally) other UI elements
  setupPanels();
  // setupVerilogExportCodeWindow(); // Uncomment if needed
}

/* ===============================
   Property Panel Functions
   =============================== */

export function prevPropertyObjSet(param: any): void {
  prevPropertyObj = param;
}

export function prevPropertyObjGet(): any {
  return prevPropertyObj;
}

function checkValidBitWidth(): void {
  const selector = document.querySelector<HTMLInputElement>("[name='newBitWidth']");
  if (!selector) return;
  const val = Number(selector.value);
  if (!selector.value || val > 32 || val < 1 || isNaN(val)) {
    // Fallback to previously saved state
    selector.value = selector.getAttribute('old-val') || '';
  } else {
    selector.setAttribute('old-val', selector.value);
  }
}

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
  } else {
    circuitProperty[target.name](value);
  }
}

export function objectPropertyAttributeCheckedUpdate(event: Event): void {
  const target = event.target as HTMLInputElement;
  if (!target) return;
  if (target.name === 'toggleLabelInLayoutMode') return; // Prevent double toggle
  scheduleUpdate();
  updateCanvasSet(true);
  wireToBeCheckedSet(1);
  if (simulationArea.lastSelected && simulationArea.lastSelected[target.name]) {
    simulationArea.lastSelected[target.name](target.value);
  } else {
    circuitProperty[target.name](target.checked);
  }
}

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

// In a Vue app you would normally render properties via a component/template.
// Here we simply call checkPropertiesUpdate (and the commented code can be refactored into a component).
export function showProperties(obj: any): void {
  if (obj === prevPropertyObjGet()) return;
  // (Detailed property panel rendering would be handled by a Vue component.)
  checkPropertiesUpdate();
}

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

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ===============================
   Delete & Panel Functions
   =============================== */

export function deleteSelected(): void {
  if (
    simulationArea.lastSelected &&
    !(simulationArea.lastSelected.objectType === 'Node' && simulationArea.lastSelected.type !== 2)
  ) {
    simulationArea.lastSelected.delete();
  }

  simulationArea.multipleObjectSelections.forEach((obj: any) => {
    if (!(obj.objectType === 'Node' && obj.type !== 2)) {
      obj.cleanDelete();
    }
  });

  simulationArea.multipleObjectSelections = [];
  simulationArea.lastSelected = undefined;
  showProperties(simulationArea.lastSelected);
  updateCanvasSet(true);
  scheduleUpdate();
  updateRestrictedElementsInScope();
}

export function setupPanels(): void {
  // Setup dragging for quick buttons (assumes the imported "dragging" function is updated as needed)
  dragging('#dragQPanel', '.quick-btn');

  // Define panel selectors that need listeners
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

  // Minimize the timing diagram panel (simulate click)
  const timingMinBtn = document.querySelector('.timing-diagram-panel .minimize') as HTMLElement;
  if (timingMinBtn) timingMinBtn.click();

  // Update Testbench UI and minimize testbench panel
  updateTestbenchUI();
  const testbenchMinBtn = document.querySelector('.testbench-manual-panel .minimize') as HTMLElement;
  if (testbenchMinBtn) testbenchMinBtn.click();

  // Hook up maximize button to reset Testbench UI (hack workaround)
  const testbenchMaxBtn = document.querySelector('.testbench-manual-panel .maximize');
  if (testbenchMaxBtn) {
    testbenchMaxBtn.addEventListener('click', setupTestbenchUI);
  }

  // Focus/select the project name input when clicking on the project name element
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

  let minimized = false;
  header.addEventListener('dblclick', () => {
    if (minimized) {
      maximizeBtn?.click();
    } else {
      minimizeBtn?.click();
    }
  });

  minimizeBtn?.addEventListener('click', () => {
    if (body) body.style.display = 'none';
    if (minimizeBtn) minimizeBtn.style.display = 'none';
    if (maximizeBtn) maximizeBtn.style.display = '';
    minimized = true;
  });

  maximizeBtn?.addEventListener('click', () => {
    if (body) body.style.display = '';
    if (minimizeBtn) minimizeBtn.style.display = '';
    if (maximizeBtn) maximizeBtn.style.display = 'none';
    minimized = false;
  });
}

/* ===============================
   Full View Mode Functions
   =============================== */

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

/* ===============================
   Subcircuit Elements Handling
   =============================== */

// Assuming that circuitElementList and globalScope are declared and typed elsewhere
declare const circuitElementList: string[];
declare const globalScope: { [key: string]: any[] };

export function fillSubcircuitElements(): void {
  const subcircuitMenu = document.getElementById('subcircuitMenu');
  if (!subcircuitMenu) return;

  subcircuitMenu.innerHTML = '';
  let subCircuitElementExists = false;

  for (const el of circuitElementList) {
    const elementsArray = globalScope[el];
    if (!elementsArray || elementsArray.length === 0) continue;
    if (!elementsArray[0].canShowInSubcircuit) continue;

    let tempHTML = `<div class="panelHeader">${el}s</div><div class="panel">`;
    let available = false;

    for (let i = 0; i < elementsArray.length; i++) {
      if (!elementsArray[i].subcircuitMetadata.showInSubcircuit) {
        tempHTML += `<div class="icon subcircuitModule" id="${el}-${i}" data-element-id="${i}" data-element-name="${el}">
          <img src="/img/${el}.svg">
          <p class="img__description">${elementsArray[i].label !== '' ? elementsArray[i].label : 'unlabeled'}</p>
        </div>`;
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

  // Bind event listeners to the newly created subcircuit modules
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
