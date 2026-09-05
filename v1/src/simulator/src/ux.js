/* eslint-disable import/no-cycle */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
import { layoutModeGet } from './layoutMode'
import {
    scheduleUpdate,
    wireToBeCheckedSet,
    updateCanvasSet
} from './engine'
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
let isFullViewActive = false
let prevMobileState = null 
// FUNCTION TO SHOW AND HIDE CONTEXT MENU
function hideContextMenu() {
    var el = document.getElementById('contextMenu')
    el.style = 'opacity:0;'
    setTimeout(() => {
        el.style = 'visibility:hidden;'
        ctxPos.visible = false
    }, 200) // Hide after 2 sec
}
/**
 * Function displays context menu
 * @category ux
 */
function showContextMenu() {
    if (layoutModeGet()) return false // Hide context menu when it is in Layout Mode
    const contextMenu = document.getElementById('contextMenu')
    if (contextMenu) {
        contextMenu.style.visibility = 'visible'
        contextMenu.style.opacity = '1'
    }

    const simArea = document.getElementById('simulationArea')
    var windowHeight =
        (simArea ? simArea.clientHeight : 0) - (contextMenu ? contextMenu.clientHeight : 0) - 10
    var windowWidth =
        (simArea ? simArea.clientWidth : 0) - (contextMenu ? contextMenu.clientWidth : 0) - 10
    // for top, left, right, bottom
    var topPosition
    var leftPosition
    var rightPosition
    var bottomPosition
    if (ctxPos.y > windowHeight && ctxPos.x <= windowWidth) {
        //When user click on bottom-left part of window
        leftPosition = ctxPos.x
        bottomPosition = window.innerHeight - ctxPos.y
        if (contextMenu) {
            contextMenu.style.left = `${leftPosition}px`
            contextMenu.style.bottom = `${bottomPosition}px`
            contextMenu.style.right = 'auto'
            contextMenu.style.top = 'auto'
        }
    } else if (ctxPos.y > windowHeight && ctxPos.x > windowWidth) {
        //When user click on bottom-right part of window
        bottomPosition = window.innerHeight - ctxPos.y
        rightPosition = window.innerWidth - ctxPos.x
        if (contextMenu) {
            contextMenu.style.left = 'auto'
            contextMenu.style.bottom = `${bottomPosition}px`
            contextMenu.style.right = `${rightPosition}px`
            contextMenu.style.top = 'auto'
        }
    } else if (ctxPos.y <= windowHeight && ctxPos.x <= windowWidth) {
        //When user click on top-left part of window
        leftPosition = ctxPos.x
        topPosition = ctxPos.y
        if (contextMenu) {
            contextMenu.style.left = `${leftPosition}px`
            contextMenu.style.bottom = 'auto'
            contextMenu.style.right = 'auto'
            contextMenu.style.top = `${topPosition}px`
        }
    } else {
        //When user click on top-right part of window
        rightPosition = window.innerWidth - ctxPos.x
        topPosition = ctxPos.y
        if (contextMenu) {
            contextMenu.style.left = 'auto'
            contextMenu.style.bottom = 'auto'
            contextMenu.style.right = `${rightPosition}px`
            contextMenu.style.top = `${topPosition}px`
        }
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
    document.getElementById('canvasArea').oncontextmenu = showContextMenu

    document.querySelectorAll('.logixButton').forEach(btn => {
        btn.addEventListener('click', function () {
            if (logixFunction[this.id]) logixFunction[this.id]()
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
    const val = selector.value
    const isNumeric = !isNaN(parseFloat(val)) && isFinite(val)
    if (
        !isNumeric ||
        parseFloat(val) > 32 ||
        parseFloat(val) < 1
    ) {
        // fallback to previously saves state
        selector.value = selector.getAttribute('old-val') || ''
    } else {
        selector.setAttribute('old-val', selector.value)
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
    document.querySelectorAll('.objectPropertyAttribute').forEach(el => {
        el.removeEventListener('change', objectPropertyAttributeUpdate)
        el.removeEventListener('keyup', objectPropertyAttributeUpdate)
        el.removeEventListener('paste', objectPropertyAttributeUpdate)
        el.removeEventListener('click', objectPropertyAttributeUpdate)

        el.addEventListener('change', objectPropertyAttributeUpdate)
        el.addEventListener('keyup', objectPropertyAttributeUpdate)
        el.addEventListener('paste', objectPropertyAttributeUpdate)
        el.addEventListener('click', objectPropertyAttributeUpdate)
    })

    document.querySelectorAll('.objectPropertyAttributeChecked').forEach(el => {
        el.removeEventListener('change', objectPropertyAttributeCheckedUpdate)
        el.removeEventListener('keyup', objectPropertyAttributeCheckedUpdate)
        el.removeEventListener('paste', objectPropertyAttributeCheckedUpdate)
        el.removeEventListener('click', objectPropertyAttributeCheckedUpdate)

        el.addEventListener('change', objectPropertyAttributeCheckedUpdate)
        el.addEventListener('keyup', objectPropertyAttributeCheckedUpdate)
        el.addEventListener('paste', objectPropertyAttributeCheckedUpdate)
        el.addEventListener('click', objectPropertyAttributeCheckedUpdate)
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
    const modInner = document.getElementById('moduleProperty-inner')
    if (modInner) modInner.innerHTML = ''
    const modProp = document.getElementById('moduleProperty')
    if (modProp) modProp.style.display = 'none'
    prevPropertyObjSet(undefined)
    document.querySelectorAll('.objectPropertyAttribute').forEach(el => {
        el.removeEventListener('change', objectPropertyAttributeUpdate)
        el.removeEventListener('keyup', objectPropertyAttributeUpdate)
        el.removeEventListener('paste', objectPropertyAttributeUpdate)
        el.removeEventListener('click', objectPropertyAttributeUpdate)
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
 * listener for opening the prompt for bin conversion
 * @category ux
 */
const bitconverterBtn = document.getElementById('bitconverter')
if (bitconverterBtn) {
    bitconverterBtn.addEventListener('click', () => {
        $('#bitconverterprompt').dialog({
            resizable: false,
            buttons: [
                {
                    text: 'Reset',
                    click() {
                        const dI = document.getElementById('decimalInput')
                        const bI = document.getElementById('binaryInput')
                        const oI = document.getElementById('octalInput')
                        const hI = document.getElementById('hexInput')
                        if (dI) dI.value = '0'
                        if (bI) bI.value = '0'
                        if (oI) oI.value = '0'
                        if (hI) hI.value = '0'
                    },
                },
            ],
        })
    })
}

// convertors
const convertors = {
    dec2bin: (x) => `0b${x.toString(2)}`,
    dec2hex: (x) => `0x${x.toString(16)}`,
    dec2octal: (x) => `0${x.toString(8)}`,
}

function setBaseValues(x) {
    if (isNaN(x)) return
    const bI = document.getElementById('binaryInput')
    const oI = document.getElementById('octalInput')
    const hI = document.getElementById('hexInput')
    const dI = document.getElementById('decimalInput')
    if (bI) bI.value = convertors.dec2bin(x)
    if (oI) oI.value = convertors.dec2octal(x)
    if (hI) hI.value = convertors.dec2hex(x)
    if (dI) dI.value = x
}

const decimalInput = document.getElementById('decimalInput')
if (decimalInput) {
    decimalInput.addEventListener('keyup', () => {
        var x = parseInt(decimalInput.value, 10)
        setBaseValues(x)
    })
}

const binaryInput = document.getElementById('binaryInput')
if (binaryInput) {
    binaryInput.addEventListener('keyup', () => {
        var x = parseInt(binaryInput.value, 2)
        setBaseValues(x)
    })
}

const hexInput = document.getElementById('hexInput')
if (hexInput) {
    hexInput.addEventListener('keyup', () => {
        var x = parseInt(hexInput.value, 16)
        setBaseValues(x)
    })
}

const octalInput = document.getElementById('octalInput')
if (octalInput) {
    octalInput.addEventListener('keyup', () => {
        var x = parseInt(octalInput.value, 8)
        setBaseValues(x)
    })
}


export function minimizePanel(panelSelector) {
    const btn = document.querySelector(panelSelector + ' .minimize')
    if (btn) btn.click()
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
    minimizePanel('.timing-diagram-panel')

    // Minimize Testbench UI
    minimizePanel('.testbench-manual-panel')

    const projName = document.getElementById('projectName')
    if (projName) {
        projName.addEventListener('click', () => {
            const input = document.querySelector("input[name='setProjectName']")
            if (input) {
                input.focus()
                input.select()
            }
        })
    }
}

// WeakMap to store named panel listener handlers per element, allowing cleanup on re-call
const _panelListenerHandlers = new WeakMap()

export function setupPanelListeners(panelSelector) {
    var headerSelector = `${panelSelector} .panel-header`
    var minimizeSelector = `${panelSelector} .minimize`
    var maximizeSelector = `${panelSelector} .maximize`
    var bodySelector = `${panelSelector} > .panel-body`

    dragging(headerSelector, panelSelector)
    // Current Panel on Top
    var minimized = false

    const onDblClick = () => {
        if (minimized) {
            const maxBtn = document.querySelector(maximizeSelector)
            if (maxBtn) maxBtn.click()
        } else {
            const minBtn = document.querySelector(minimizeSelector)
            if (minBtn) minBtn.click()
        }
    }
    const onMinimize = () => {
        document.querySelectorAll(bodySelector).forEach(b => { b.style.display = 'none' })
        document.querySelectorAll(minimizeSelector).forEach(m => { m.style.display = 'none' })
        document.querySelectorAll(maximizeSelector).forEach(m => { m.style.display = '' })
        minimized = true
    }
    const onMaximize = () => {
        document.querySelectorAll(bodySelector).forEach(b => { b.style.display = '' })
        document.querySelectorAll(minimizeSelector).forEach(m => { m.style.display = '' })
        document.querySelectorAll(maximizeSelector).forEach(m => { m.style.display = 'none' })
        minimized = false
    }

    document.querySelectorAll(headerSelector).forEach(el => {
        const prev = _panelListenerHandlers.get(el)
        if (prev?.dblclick) el.removeEventListener('dblclick', prev.dblclick)
        el.addEventListener('dblclick', onDblClick)
        _panelListenerHandlers.set(el, { ...(_panelListenerHandlers.get(el) || {}), dblclick: onDblClick })
    })
    // Minimize
    document.querySelectorAll(minimizeSelector).forEach(el => {
        const prev = _panelListenerHandlers.get(el)
        if (prev?.click) el.removeEventListener('click', prev.click)
        el.addEventListener('click', onMinimize)
        _panelListenerHandlers.set(el, { ...(_panelListenerHandlers.get(el) || {}), click: onMinimize })
    })
    // Maximize
    document.querySelectorAll(maximizeSelector).forEach(el => {
        const prev = _panelListenerHandlers.get(el)
        if (prev?.click) el.removeEventListener('click', prev.click)
        el.addEventListener('click', onMaximize)
        _panelListenerHandlers.set(el, { ...(_panelListenerHandlers.get(el) || {}), click: onMaximize })
    })
}

export function exitFullView() {
    // Remove ALL exit buttons (handles edge cases)
    const exitViewBtns = document.querySelectorAll('#exitViewBtn')
    exitViewBtns.forEach(btn => btn.remove())

    const elements = document.querySelectorAll(
        '.navbar, .modules, .report-sidebar, #tabsBar, #moduleProperty, .timing-diagram-panel, .testbench-manual-panel, .quick-btn'
    )

    elements.forEach((element) => {
        if (element instanceof HTMLElement) {
            element.style.display = ''
        }
    })

    // Mobile Components - Restore previous state
    const simulatorMobileStore = toRefs(useSimulatorMobileStore())
    
    // ✅ RESTORE PREVIOUS STATE
    if (prevMobileState) {
        simulatorMobileStore.showElementsPanel.value = prevMobileState.showElementsPanel
        simulatorMobileStore.showPropertiesPanel.value = prevMobileState.showPropertiesPanel
        simulatorMobileStore.showTimingDiagram.value = prevMobileState.showTimingDiagram
        simulatorMobileStore.showQuickButtons.value = prevMobileState.showQuickButtons
        simulatorMobileStore.showMobileButtons.value = prevMobileState.showMobileButtons
        prevMobileState = null // Clear saved state
    }

    // Reset state flag
    isFullViewActive = false
}

export function fullView() {
    // Prevent multiple calls
    if (isFullViewActive) return
    
    const app = document.querySelector('#app')
    if (!app) return

    // Close all menus using custom event (Vue-safe approach)
    document.dispatchEvent(new Event('ui:close-menus'))

    isFullViewActive = true

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

    // Mobile Components - Save previous state before hiding
    const simulatorMobileStore = toRefs(useSimulatorMobileStore())
    
    // ✅ SAVE PREVIOUS STATE
    prevMobileState = {
        showElementsPanel: simulatorMobileStore.showElementsPanel.value,
        showPropertiesPanel: simulatorMobileStore.showPropertiesPanel.value,
        showTimingDiagram: simulatorMobileStore.showTimingDiagram.value,
        showQuickButtons: simulatorMobileStore.showQuickButtons.value,
        showMobileButtons: simulatorMobileStore.showMobileButtons.value
    }

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
    const { subCircuitElementList, isEmptySubCircuitElementList } = toRefs(simulatorStore)
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
                const element = globalScope[el][i];
                elementGroup.elements.push(element);
            }
        }
        subCircuitElementExists = subCircuitElementExists || available
        if (available) {
            subcircuitElements.push(elementGroup);
        }

        subCircuitElementList.value = subcircuitElements
        isEmptySubCircuitElementList.value = !subCircuitElementExists
    }
}
