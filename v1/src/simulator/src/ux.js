/* eslint-disable import/no-cycle */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
import { layoutModeGet } from './layoutMode'
import { scheduleUpdate, wireToBeCheckedSet, updateCanvasSet } from './engine'
import { simulationArea } from './simulationArea'
import logixFunction from './data'
import { circuitProperty } from './circuit'
import { updateRestrictedElementsInScope } from './restrictedElementDiv'
import { dragging } from './drag'
import { SimulatorStore } from '#/store/SimulatorStore/SimulatorStore'
import { toRefs } from 'vue'
import { circuitElementList } from './metadata'
import { useSimulatorMobileStore } from '#/store/simulatorMobileStore'

export const uxvar = {
    smartDropXX: 50,
    smartDropYY: 80,
}
/**
 * @type {number} - Is used to calculate the position where an element from sidebar is dropped
 * @category ux
 */
uxvar.smartDropXX = 50

/**
 * @type {number} - Is used to calculate the position where an element from sidebar is dropped
 * @category ux
 */
uxvar.smartDropYY = 80

/**
 * @type {Object} - Object stores the position of context menu;
 * @category ux
 */
var ctxPos = {
    x: 0,
    y: 0,
    visible: false,
}

/**
 * Helper function to check if value is numeric
 * @param {any} val - value to check
 * @returns {boolean}
 * @category ux
 */
function isNumeric(val) {
    return !isNaN(parseFloat(val)) && isFinite(val)
}

// FUNCTION TO SHOW AND HIDE CONTEXT MENU
function hideContextMenu() {
    var el = document.getElementById('contextMenu')
    if (!el) return
    el.style.opacity = '0'
    setTimeout(() => {
        el.style.visibility = 'hidden'
        ctxPos.visible = false
    }, 200) // Hide after 200ms
}
/**
 * Function displays context menu
 * @category ux
 */
function showContextMenu() {
    if (layoutModeGet()) return false // Hide context menu when it is in Layout Mode

    const contextMenu = document.getElementById('contextMenu')
    if (!contextMenu) return false

    contextMenu.style.visibility = 'visible'
    contextMenu.style.opacity = '1'

    const simulationAreaEl = document.getElementById('simulationArea')
    if (!simulationAreaEl) return false

    var windowHeight =
        simulationAreaEl.offsetHeight - contextMenu.offsetHeight - 10
    var windowWidth =
        simulationAreaEl.offsetWidth - contextMenu.offsetWidth - 10

    // for top, left, right, bottom
    var topPosition
    var leftPosition
    var rightPosition
    var bottomPosition

    if (ctxPos.y > windowHeight && ctxPos.x <= windowWidth) {
        //When user click on bottom-left part of window
        leftPosition = ctxPos.x
        bottomPosition = window.innerHeight - ctxPos.y
        contextMenu.style.left = `${leftPosition}px`
        contextMenu.style.bottom = `${bottomPosition}px`
        contextMenu.style.right = 'auto'
        contextMenu.style.top = 'auto'
    } else if (ctxPos.y > windowHeight && ctxPos.x > windowWidth) {
        //When user click on bottom-right part of window
        bottomPosition = window.innerHeight - ctxPos.y
        rightPosition = window.innerWidth - ctxPos.x
        contextMenu.style.left = 'auto'
        contextMenu.style.bottom = `${bottomPosition}px`
        contextMenu.style.right = `${rightPosition}px`
        contextMenu.style.top = 'auto'
    } else if (ctxPos.y <= windowHeight && ctxPos.x <= windowWidth) {
        //When user click on top-left part of window
        leftPosition = ctxPos.x
        topPosition = ctxPos.y
        contextMenu.style.left = `${leftPosition}px`
        contextMenu.style.bottom = 'auto'
        contextMenu.style.right = 'auto'
        contextMenu.style.top = `${topPosition}px`
    } else {
        //When user click on top-right part of window
        rightPosition = window.innerWidth - ctxPos.x
        topPosition = ctxPos.y
        contextMenu.style.left = 'auto'
        contextMenu.style.bottom = 'auto'
        contextMenu.style.right = `${rightPosition}px`
        contextMenu.style.top = `${topPosition}px`
    }
    ctxPos.visible = true
    return false
}

/**
 * adds some UI elements to side bar and
 * menu also attaches listeners to sidebar
 * @category ux
 */
export function setupUI() {
    var ctxEl = document.getElementById('contextMenu')
    document.addEventListener('mousedown', (e) => {
        // Check if mouse is not inside the context menu and menu is visible
        if (
            ctxEl &&
            !(
                e.clientX >= ctxPos.x &&
                e.clientX <= ctxPos.x + ctxEl.offsetWidth &&
                e.clientY >= ctxPos.y &&
                e.clientY <= ctxPos.y + ctxEl.offsetHeight
            ) &&
            ctxPos.visible &&
            e.which !== 3
        ) {
            hideContextMenu()
        }

        // Change the position of context whenever mouse is clicked
        ctxPos.x = e.clientX
        ctxPos.y = e.clientY
    })
    const canvasArea = document.getElementById('canvasArea')
    if (canvasArea) {
        canvasArea.oncontextmenu = showContextMenu
    }

    // Setup logix button click listeners
    const logixButtons = document.querySelectorAll('.logixButton')
    logixButtons.forEach((button) => {
        button.addEventListener('click', function () {
            logixFunction[this.id]()
        })
    })

    setupPanels()
}

/**
 * Keeps in check which property is being displayed
 * @category ux
 */
var prevPropertyObj

export function prevPropertyObjSet(param) {
    prevPropertyObj = param
}

export function prevPropertyObjGet() {
    return prevPropertyObj
}

function checkValidBitWidth() {
    const selector = document.querySelector("[name='newBitWidth']")
    if (!selector) return

    const value = selector.value
    const oldVal = selector.getAttribute('old-val')

    if (
        value === undefined ||
        parseInt(value) > 32 ||
        parseInt(value) < 1 ||
        !isNumeric(value)
    ) {
        // fallback to previously saved state
        if (oldVal) {
            selector.value = oldVal
        }
    } else {
        selector.setAttribute('old-val', value)
    }
}

export function objectPropertyAttributeUpdate() {
    checkValidBitWidth()
    scheduleUpdate()
    updateCanvasSet(true)
    wireToBeCheckedSet(1)
    let { value } = this
    if (this.type === 'number') {
        value = parseFloat(value)
    }
    if (simulationArea.lastSelected && simulationArea.lastSelected[this.name]) {
        simulationArea.lastSelected[this.name](value)
    } else {
        circuitProperty[this.name](value)
    }
}

export function objectPropertyAttributeCheckedUpdate() {
    if (this.name === 'toggleLabelInLayoutMode') return // Hack to prevent toggleLabelInLayoutMode from toggling twice
    scheduleUpdate()
    updateCanvasSet(true)
    wireToBeCheckedSet(1)
    if (simulationArea.lastSelected && simulationArea.lastSelected[this.name]) {
        simulationArea.lastSelected[this.name](this.value)
    } else {
        circuitProperty[this.name](this.checked)
    }
}

export function checkPropertiesUpdate(value = 0) {
    const propertyAttributes = document.querySelectorAll(
        '.objectPropertyAttribute'
    )
    propertyAttributes.forEach((el) => {
        // Remove existing listeners by cloning
        const newEl = el.cloneNode(true)
        el.parentNode.replaceChild(newEl, el)
        // Add new listeners
        newEl.addEventListener('change', objectPropertyAttributeUpdate)
        newEl.addEventListener('keyup', objectPropertyAttributeUpdate)
        newEl.addEventListener('paste', objectPropertyAttributeUpdate)
        newEl.addEventListener('click', objectPropertyAttributeUpdate)
    })

    const checkedAttributes = document.querySelectorAll(
        '.objectPropertyAttributeChecked'
    )
    checkedAttributes.forEach((el) => {
        // Remove existing listeners by cloning
        const newEl = el.cloneNode(true)
        el.parentNode.replaceChild(newEl, el)
        // Add new listeners
        newEl.addEventListener('change', objectPropertyAttributeCheckedUpdate)
        newEl.addEventListener('keyup', objectPropertyAttributeCheckedUpdate)
        newEl.addEventListener('paste', objectPropertyAttributeCheckedUpdate)
        newEl.addEventListener('click', objectPropertyAttributeCheckedUpdate)
    })
}

/**
 * show properties of an object.
 * @param {CircuiElement} obj - the object whose properties we want to be shown in sidebar
 * @category ux
 */
export function showProperties(obj) {
    if (obj === prevPropertyObjGet()) return
    checkPropertiesUpdate(this)
}

/**
 * Hides the properties in sidebar.
 * @category ux
 */
export function hideProperties() {
    const modulePropertyInner = document.getElementById('moduleProperty-inner')
    if (modulePropertyInner) {
        modulePropertyInner.innerHTML = ''
    }

    const moduleProperty = document.getElementById('moduleProperty')
    if (moduleProperty) {
        moduleProperty.style.display = 'none'
    }

    prevPropertyObjSet(undefined)

    // Remove event listeners from property attributes
    const propertyAttributes = document.querySelectorAll(
        '.objectPropertyAttribute'
    )
    propertyAttributes.forEach((el) => {
        const newEl = el.cloneNode(true)
        el.parentNode.replaceChild(newEl, el)
    })
}
/**
 * checkss the input is safe or not
 * @param {HTML} unsafe - the html which we wants to escape
 * @category ux
 */
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

export function deleteSelected() {
    if (
        simulationArea.lastSelected &&
        !(
            simulationArea.lastSelected.objectType === 'Node' &&
            simulationArea.lastSelected.type !== 2
        )
    ) {
        simulationArea.lastSelected.delete()
    }

    for (var i = 0; i < simulationArea.multipleObjectSelections.length; i++) {
        if (
            !(
                simulationArea.multipleObjectSelections[i].objectType ===
                    'Node' &&
                simulationArea.multipleObjectSelections[i].type !== 2
            )
        )
            simulationArea.multipleObjectSelections[i].cleanDelete()
    }

    simulationArea.multipleObjectSelections = []
    simulationArea.lastSelected = undefined
    showProperties(simulationArea.lastSelected)
    // Updated restricted elements
    updateCanvasSet(true)
    scheduleUpdate()
    updateRestrictedElementsInScope()
}

/**
 * Bit converter dialog - now handled by Vue HexBinDec.vue component
 * This function opens the dialog via the SimulatorStore
 * @category ux
 */
export function openBitConverterDialog() {
    const simulatorStore = SimulatorStore()
    simulatorStore.dialogBox.hex_bin_dec_converter_dialog = true
}

// convertors
const convertors = {
    dec2bin: (x) => `0b${x.toString(2)}`,
    dec2hex: (x) => `0x${x.toString(16)}`,
    dec2octal: (x) => `0${x.toString(8)}`,
}

export function setupPanels() {
    dragging('#dragQPanel', '.quick-btn')

    setupPanelListeners('.elementPanel')
    setupPanelListeners('.layoutElementPanel')
    setupPanelListeners('#moduleProperty')
    setupPanelListeners('#layoutDialog')
    setupPanelListeners('#verilogEditorPanel')
    setupPanelListeners('.timing-diagram-panel')
    setupPanelListeners('.testbench-manual-panel')

    // Minimize Timing Diagram (takes too much space)
    const timingMinimize = document.querySelector(
        '.timing-diagram-panel .minimize'
    )
    if (timingMinimize) {
        timingMinimize.click()
    }

    // Minimize Testbench UI
    const testbenchMinimize = document.querySelector(
        '.testbench-manual-panel .minimize'
    )
    if (testbenchMinimize) {
        testbenchMinimize.click()
    }

    const projectName = document.getElementById('projectName')
    if (projectName) {
        projectName.addEventListener('click', () => {
            const input = document.querySelector("input[name='setProjectName']")
            if (input) {
                input.focus()
                input.select()
            }
        })
    }
}

function setupPanelListeners(panelSelector) {
    const panel = document.querySelector(panelSelector)
    if (!panel) return

    const header = panel.querySelector('.panel-header')
    const minimizeBtn = panel.querySelector('.minimize')
    const maximizeBtn = panel.querySelector('.maximize')
    const body = panel.querySelector('.panel-body')

    if (header) {
        dragging(panelSelector + ' .panel-header', panelSelector)
    }

    // Current Panel on Top
    var minimized = false

    if (header) {
        header.addEventListener('dblclick', () => {
            if (minimized) {
                maximizeBtn?.click()
            } else {
                minimizeBtn?.click()
            }
        })
    }

    // Minimize
    if (minimizeBtn) {
        minimizeBtn.addEventListener('click', () => {
            if (body) body.style.display = 'none'
            minimizeBtn.style.display = 'none'
            if (maximizeBtn) maximizeBtn.style.display = ''
            minimized = true
        })
    }

    // Maximize
    if (maximizeBtn) {
        maximizeBtn.addEventListener('click', () => {
            if (body) body.style.display = ''
            if (minimizeBtn) minimizeBtn.style.display = ''
            maximizeBtn.style.display = 'none'
            minimized = false
        })
    }
}

export function exitFullView() {
    const exitViewBtn = document.querySelector('#exitViewBtn')
    if (exitViewBtn) exitViewBtn.remove()

    const elements = document.querySelectorAll(
        '.navbar, .modules, .report-sidebar, #tabsBar, #moduleProperty, .timing-diagram-panel, .testbench-manual-panel, .quick-btn'
    )
    elements.forEach((element) => {
        if (element instanceof HTMLElement) {
            element.style.display = ''
        }
    })

    // Mobile Components

    const simulatorMobileStore = toRefs(useSimulatorMobileStore())

    simulatorMobileStore.showQuickButtons.value = true
    simulatorMobileStore.showMobileButtons.value = true
}

export function fullView() {
    const app = document.querySelector('#app')

    const exitViewEl = document.createElement('button')
    exitViewEl.id = 'exitViewBtn'
    exitViewEl.textContent = 'Exit Full Preview'

    const elements = document.querySelectorAll(
        '.navbar, .modules, .report-sidebar, #tabsBar, #moduleProperty, .timing-diagram-panel, .testbench-manual-panel, .quick-btn'
    )
    elements.forEach((element) => {
        if (element instanceof HTMLElement) {
            element.style.display = 'none'
        }
    })

    // Mobile Components

    const simulatorMobileStore = toRefs(useSimulatorMobileStore())

    simulatorMobileStore.showElementsPanel.value = false
    simulatorMobileStore.showPropertiesPanel.value = false
    simulatorMobileStore.showTimingDiagram.value = false
    simulatorMobileStore.showQuickButtons.value = false
    simulatorMobileStore.showMobileButtons.value = false

    app.appendChild(exitViewEl)
    exitViewEl.addEventListener('click', exitFullView)
}

/**
    Fills the elements that can be displayed in the subcircuit, in the subcircuit menu
**/
export function fillSubcircuitElements() {
    const simulatorStore = SimulatorStore()
    const { subCircuitElementList, isEmptySubCircuitElementList } =
        toRefs(simulatorStore)
    subCircuitElementList.value = []
    isEmptySubCircuitElementList.value = true

    const subcircuitElements = []

    let subCircuitElementExists = false

    for (let el of circuitElementList) {
        if (globalScope[el].length === 0) continue
        if (!globalScope[el][0].canShowInSubcircuit) continue

        let available = false

        const elementGroup = {
            type: el,
            elements: [],
        }

        // add an SVG for each element
        for (let i = 0; i < globalScope[el].length; i++) {
            if (!globalScope[el][i].subcircuitMetadata.showInSubcircuit) {
                available = true
                const element = globalScope[el][i]
                elementGroup.elements.push(element)
            }
        }
        subCircuitElementExists = subCircuitElementExists || available
        if (available) {
            subcircuitElements.push(elementGroup)
        }

        subCircuitElementList.value = subcircuitElements
        isEmptySubCircuitElementList.value = !subCircuitElementExists
    }
}
