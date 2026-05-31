/* eslint-disable no-shadow */
/* eslint-disable no-negated-condition */
/* eslint-disable no-alert */
/* eslint-disable new-cap */
/* eslint-disable no-undef */
/* eslint-disable eqeqeq */
/* eslint-disable prefer-template */
/* eslint-disable no-param-reassign */
// Most Listeners are stored here
const DPR = window.devicePixelRatio || 1
import {
    layoutModeGet,
    tempBuffer,
    layoutUpdate,
} from './layoutMode'
import { simulationArea } from './simulationArea'
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
} from './engine'
import { changeScale, findDimensions } from './canvasApi'
import { scheduleBackup } from './data/backupCircuit'
import { hideProperties, deleteSelected, uxvar, exitFullView } from './ux';
import { updateRestrictedElementsList, updateRestrictedElementsInScope, hideRestricted, showRestricted } from './restrictedElementDiv';
import miniMapArea, { removeMiniMap, updatelastMinimapShown } from './minimap'
import undo from './data/undo'
import redo from './data/redo'
import { copy, paste, selectAll } from './events'
import { verilogModeGet } from './Verilog2CV'
import { setupTimingListeners } from './plotArea'
import logixFunction from './data'
import { listen } from '@tauri-apps/api/event'
import { useSimulatorMobileStore } from '#/store/simulatorMobileStore'
import { toRefs } from 'vue'

const unit = 10
let listenToSimulator = true
let coordinate;
const returnCoordinate = {
    x: 0,
    y: 0
}

let currDistance = 0;
let distance = 0;
let pinchZ = 0;
let centreX;
let centreY;
let timeout;
let lastTap = 0;

/**
 *
 * @param {event} e
 * function for double click or double tap
 */
function onDoubleClickorTap(e) {
    updateCanvasSet(true);
    if (simulationArea.lastSelected && simulationArea.lastSelected.dblclick !== undefined) {
        simulationArea.lastSelected.dblclick();
    } else if (!simulationArea.shiftDown) {
        simulationArea.multipleObjectSelections = [];
    }
    scheduleUpdate(2);
    e.preventDefault();
}

/**
 *
 * @param {event} e
 * function to detect tap and double tap
 */
function getTap(e) {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    clearTimeout(timeout);
    if (tapLength < 500 && tapLength > 0) {
        onDoubleClickorTap(e);
    } else {
        // Single tap
    }
    lastTap = currentTime;
    e.preventDefault();
}

const isIe = (navigator.userAgent.toLowerCase().indexOf('msie') != -1 || navigator.userAgent.toLowerCase().indexOf('trident') != -1);

// Function to getCoordinate
//  *If touch is enable then it will return touch coordinate
//  *else it will return mouse coordinate
//
export function getCoordinate(e) {
    if (simulationArea.touch) {
        returnCoordinate.x = e.touches[0].clientX;
        returnCoordinate.y = e.touches[0].clientY;
        return returnCoordinate;
    }

    if (!simulationArea.touch) {
        returnCoordinate.x = e.clientX;
        returnCoordinate.y = e.clientY;
        return returnCoordinate;
    }

    return returnCoordinate;
}

/* Function for Panstop on simulator
   *For now variable name starts with mouse like mouseDown are used both
    touch and mouse will change in future
*/
export function pinchZoom(e, globalScope) {
    e.preventDefault();
    gridUpdateSet(true);
    scheduleUpdate();
    updateSimulationSet(true);
    updatePositionSet(true);
    updateCanvasSet(true);
    // Calculating distance between touch to see if its pinchIN or pinchOut
    distance = Math.sqrt((e.touches[1].clientX - e.touches[0].clientX) ** 2, (e.touches[1].clientY - e.touches[0].clientY) ** 2);
    if (distance >= currDistance) {
        pinchZ += 0.02;
        currDistance = distance;
    } else if (currDistance >= distance) {
        pinchZ -= 0.02;
        currDistance = distance;
    }
    if (pinchZ >= 2) {
        pinchZ = 2;
    }
    else if (pinchZ <= 0.5) {
        pinchZ = 0.5;
    }
    const oldScale = globalScope.scale;
    globalScope.scale = Math.max(0.5, Math.min(4 * DPR, pinchZ * 3));
    globalScope.scale = Math.round(globalScope.scale * 10) / 10;
    // This is not working as expected
    centreX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    centreY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    const rect = simulationArea.canvas.getBoundingClientRect();
    const RawX = (centreX - rect.left) * DPR;
    const RawY = (centreY - rect.top) * DPR;
    const Xf = Math.round(((RawX - globalScope.ox) / globalScope.scale) / unit);
    const Yf = Math.round(((RawY - globalScope.ox) / globalScope.scale) / unit);
    const currCentreX = Math.round(Xf / unit) * unit;
    const currCentreY = Math.round(Yf / unit) * unit;
    globalScope.ox = Math.round(currCentreX * (globalScope.scale - oldScale));
    globalScope.oy = Math.round(currCentreY * (globalScope.scale - oldScale));
    gridUpdateSet(true);
    scheduleUpdate(1);
}

/*
 *Function to start the pan in simulator
 *Works for both touch and Mouse
 *For now variable name starts from mouse like mouseDown are used both
  touch and mouse will change in future
 */
export function panStart(e) {
    coordinate = getCoordinate(e);
    simulationArea.mouseDown = true;
    // Deselect Input
    if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
    }

    errorDetectedSet(false);
    updateSimulationSet(true);
    updatePositionSet(true);
    updateCanvasSet(true);
    simulationArea.lastSelected = undefined;
    simulationArea.selected = false;
    simulationArea.hover = undefined;
    const rect = simulationArea.canvas.getBoundingClientRect();
    simulationArea.mouseDownRawX = (coordinate.x - rect.left) * DPR;
    simulationArea.mouseDownRawY = (coordinate.y - rect.top) * DPR;
    simulationArea.mouseDownX = Math.round(((simulationArea.mouseDownRawX - globalScope.ox) / globalScope.scale) / unit) * unit;
    simulationArea.mouseDownY = Math.round(((simulationArea.mouseDownRawY - globalScope.oy) / globalScope.scale) / unit) * unit;
    if (simulationArea.touch) {
        simulationArea.mouseX = simulationArea.mouseDownX;
        simulationArea.mouseY = simulationArea.mouseDownY;
    }

    simulationArea.oldx = globalScope.ox;
    simulationArea.oldy = globalScope.oy;
    e.preventDefault();
    scheduleBackup();
    scheduleUpdate(1);
    $('.dropdown.open').removeClass('open');
}

/*
 * Function to pan in simulator
 * Works for both touch and Mouse
 * Pinch to zoom also implemented in the same
 * For now variable name starts from mouse like mouseDown are used both
   touch and mouse will change in future
 */

export function panMove(e) {
    // If only one  it touched
    // pan left or right
    if (!simulationArea.touch || e.touches.length === 1) {
        coordinate = getCoordinate(e);
        const rect = simulationArea.canvas.getBoundingClientRect();
        simulationArea.mouseRawX = (coordinate.x - rect.left) * DPR;
        simulationArea.mouseRawY = (coordinate.y - rect.top) * DPR;
        simulationArea.mouseXf = (simulationArea.mouseRawX - globalScope.ox) / globalScope.scale;
        simulationArea.mouseYf = (simulationArea.mouseRawY - globalScope.oy) / globalScope.scale;
        simulationArea.mouseX = Math.round(simulationArea.mouseXf / unit) * unit;
        simulationArea.mouseY = Math.round(simulationArea.mouseYf / unit) * unit;
        updateCanvasSet(true);
        if (simulationArea.lastSelected && (simulationArea.mouseDown || simulationArea.lastSelected.newElement)) {
            updateCanvasSet(true);
            let fn;

            if (simulationArea.lastSelected == globalScope.root) {
                fn = function () {
                    updateSelectionsAndPane();
                };
            } else {
                fn = function () {
                    if (simulationArea.lastSelected) {
                        simulationArea.lastSelected.update();
                    }
                };
            }

            scheduleUpdate(0, 20, fn);
        } else {
            scheduleUpdate(0, 200);
        }
    }

    // If two fingures are touched
    // pinchZoom
    if (simulationArea.touch && e.touches.length === 2) {
        pinchZoom(e, globalScope);
    }
}

export function panStop(e) {
    const simulatorMobileStore = useSimulatorMobileStore()
    simulationArea.mouseDown = false;
    if (!lightMode) {
        updatelastMinimapShown();
        setTimeout(removeMiniMap, 2000);
    }

    errorDetectedSet(false);
    updateSimulationSet(true);
    updatePositionSet(true);
    updateCanvasSet(true);
    gridUpdateSet(true);
    wireToBeCheckedSet(1);

    scheduleUpdate(1);
    simulationArea.mouseDown = false;

    // eslint-disable-next-line no-plusplus
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
    // Var rect = simulationArea.canvas.getBoundingClientRect();

    if (!(simulationArea.mouseRawX < 0 || simulationArea.mouseRawY < 0 || simulationArea.mouseRawX > width || simulationArea.mouseRawY > height)) {
        uxvar.smartDropXX = simulationArea.mouseX + 100; // Math.round(((simulationArea.mouseRawX - globalScope.ox+100) / globalScope.scale) / unit) * unit;
        uxvar.smartDropYY = simulationArea.mouseY - 50; // Math.round(((simulationArea.mouseRawY - globalScope.oy+100) / globalScope.scale) / unit) * unit;
    }

    if (simulationArea.touch) {
        const { isCopy } = toRefs(simulatorMobileStore)
        // small hack so Current circuit element should not spwan above last circuit element
        if (!isCopy.value) {
            findDimensions(globalScope);
            simulationArea.mouseX = 100 + simulationArea.maxWidth || 0;
            simulationArea.mouseY = simulationArea.minHeight || 0;
            getTap(e);
        }
    }
}

export default function startListeners() {
    $(document).on('keyup', (e) => {
        if (e.key === 'Escape') exitFullView()
    })

    $('#projectName').on('click', () => {
        simulationArea.lastSelected = globalScope.root;
        setTimeout(() => {
            document.getElementById("projname").select();
        }, 100);
    });

    document
        .getElementById('simulationArea')
        .addEventListener('mouseup', (e) => {
            if (simulationArea.lastSelected) {
                simulationArea.lastSelected.newElement = false
            }
            // handling restricted circuit elements
            if (
                simulationArea.lastSelected &&
                restrictedElements.includes(
                    simulationArea.lastSelected.objectType
                ) &&
                !globalScope.restrictedCircuitElementsUsed.includes(
                    simulationArea.lastSelected.objectType
                )
            ) {
                globalScope.restrictedCircuitElementsUsed.push(
                    simulationArea.lastSelected.objectType
                )
                updateRestrictedElementsList()
            }

            // deselect multible elements with click
            if (
                !simulationArea.shiftDown &&
                simulationArea.multipleObjectSelections.length > 0
            ) {
                if (
                    !simulationArea.multipleObjectSelections.includes(
                        simulationArea.lastSelected
                    )
                ) {
                    simulationArea.multipleObjectSelections = []
                }
            }
        })

    window.addEventListener('keyup', (e) => {
        scheduleUpdate(1)
        simulationArea.shiftDown = e.shiftKey
        if (e.keyCode == 16) {
            simulationArea.shiftDown = false
        }
        if (e.key == 'Meta' || e.key == 'Control') {
            simulationArea.controlDown = false
        }
    })

    window.addEventListener(
        'keydown',
        (e) => {
            if (document.activeElement.tagName == 'INPUT') return
            if (document.activeElement != document.body) return

            simulationArea.shiftDown = e.shiftKey
            if (e.key == 'Meta' || e.key == 'Control') {
                simulationArea.controlDown = true
            }

            if (
                simulationArea.controlDown &&
                e.key.charCodeAt(0) == 122 &&
                !simulationArea.shiftDown
            ) {
                // detect the special CTRL-Z code
                undo()
            }
            if (
                simulationArea.controlDown &&
                e.key.charCodeAt(0) == 122 &&
                simulationArea.shiftDown
            ) {
                // detect the special Cmd + shift + z code (macOs)
                redo()
            }
            if (
                simulationArea.controlDown &&
                e.key.charCodeAt(0) == 121 &&
                !simulationArea.shiftDown
            ) {
                // detect the special ctrl + Y code (windows)
                redo()
            }

            if (listenToSimulator) {
                // If mouse is focusing on input element, then override any action
                if (
                    document.activeElement.tagName == 'INPUT' ||
                    simulationArea.mouseRawX < 0 ||
                    simulationArea.mouseRawY < 0 ||
                    simulationArea.mouseRawX > width ||
                    simulationArea.mouseRawY > height
                ) {
                    return
                }
                // HACK TO REMOVE FOCUS ON PROPERTIES
                if (document.activeElement.type == 'number') {
                    hideProperties()
                    showProperties(simulationArea.lastSelected)
                }

                errorDetectedSet(false)
                updateSimulationSet(true)
                updatePositionSet(true)
                simulationArea.shiftDown = e.shiftKey

                if (e.key == 'Meta' || e.key == 'Control') {
                    simulationArea.controlDown = true
                }

                // Keyboard zoom shortcuts
                // Zoom in: Cmd/Ctrl + '+' or numpad '+'
                // (On US keyboards, '+' is Shift+'='; we only check for '+' to avoid
                //  triggering on plain '=' which would require Cmd/Ctrl+Shift+= instead)
                if (
                    (simulationArea.controlDown &&
                        (e.keyCode == 187 || e.keyCode == 171 || e.key == '+')) ||
                    e.keyCode == 107
                ) {
                    e.preventDefault()
                    ZoomIn()
                }
                // Zoom out: Cmd/Ctrl + '-' or numpad '-'
                if (
                    (simulationArea.controlDown &&
                        (e.keyCode == 189 || e.keyCode == 173 || e.key == '-')) ||
                    e.keyCode == 109
                ) {
                    e.preventDefault()
                    ZoomOut()
                }

                if (
                    simulationArea.mouseRawX < 0 ||
                    simulationArea.mouseRawY < 0 ||
                    simulationArea.mouseRawX > width ||
                    simulationArea.mouseRawY > height
                )
                    return

                scheduleUpdate(1)
                updateCanvasSet(true)
                wireToBeCheckedSet(1)

                if (
                    simulationArea.lastSelected &&
                    simulationArea.lastSelected.keyDown
                ) {
                    if (
                        e.key.toString().length == 1 ||
                        e.key.toString() == 'Backspace' ||
                        e.key.toString() == 'Enter'
                    ) {
                        simulationArea.lastSelected.keyDown(e.key.toString())
                        e.cancelBubble = true
                        e.returnValue = false

                        //e.stopPropagation works in Firefox.
                        if (e.stopPropagation) {
                            e.stopPropagation()
                            e.preventDefault()
                        }
                        return
                    }
                }

                if (
                    simulationArea.lastSelected &&
                    simulationArea.lastSelected.keyDown2
                ) {
                    if (e.key.toString().length == 1) {
                        simulationArea.lastSelected.keyDown2(e.key.toString())
                        return
                    }
                }

                if (
                    simulationArea.lastSelected &&
                    simulationArea.lastSelected.keyDown3
                ) {
                    if (
                        e.key.toString() != 'Backspace' &&
                        e.key.toString() != 'Delete'
                    ) {
                        simulationArea.lastSelected.keyDown3(e.key.toString())
                        return
                    }
                }

                if (e.keyCode == 16) {
                    simulationArea.shiftDown = true
                    if (
                        simulationArea.lastSelected &&
                        !simulationArea.lastSelected.keyDown &&
                        simulationArea.lastSelected.objectType != 'Wire' &&
                        simulationArea.lastSelected.objectType !=
                        'CircuitElement' &&
                        !simulationArea.multipleObjectSelections.includes(
                            simulationArea.lastSelected
                        )
                    ) {
                        simulationArea.multipleObjectSelections.push(
                            simulationArea.lastSelected
                        )
                    }
                }

                // Detect offline save shortcut (CTRL+SHIFT+S)
                if (
                    simulationArea.controlDown &&
                    e.keyCode == 83 &&
                    simulationArea.shiftDown
                ) {
                    saveOffline()
                    e.preventDefault()
                }

                // Detect Select all Shortcut
                if (
                    simulationArea.controlDown &&
                    (e.keyCode == 65 || e.keyCode == 97)
                ) {
                    selectAll()
                    e.preventDefault()
                }

                // deselect all Shortcut
                if (e.keyCode == 27) {
                    simulationArea.multipleObjectSelections = []
                    simulationArea.lastSelected = undefined
                    e.preventDefault()
                }

                if (
                    (e.keyCode == 113 || e.keyCode == 81) &&
                    simulationArea.lastSelected != undefined
                ) {
                    if (simulationArea.lastSelected.bitWidth !== undefined) {
                        simulationArea.lastSelected.newBitWidth(
                            parseInt(prompt('Enter new bitWidth'), 10)
                        )
                    }
                }

                if (
                    simulationArea.controlDown &&
                    (e.key == 'T' || e.key == 't')
                ) {
                    // e.preventDefault(); //browsers normally open a new tab
                    simulationArea.changeClockTime(prompt('Enter Time:'))
                }
            }

            if (e.keyCode == 8 || e.key == 'Delete') {
                deleteSelected()
            }
        },
        true
    )

    document.getElementById('simulationArea').addEventListener('dblclick', e => {
        onDoubleClickorTap(e);
    });

    /**
     * Handle mouse wheel / trackpad scroll events
     * CHANGED: Now pans the canvas instead of zooming
     * Zoom is controlled ONLY by:
     *   - UI buttons/sliders (QuickButton components)
     *   - Keyboard shortcuts (Cmd/Ctrl +/-)
     * 
     * This prevents accidental zoom when scrolling/swiping on trackpad
     */
    function handleCanvasPan(event) {
        event.preventDefault()
        
        // Extract scroll delta from various browser event formats
        const scrollDelta = extractScrollDelta(event)
        
        // Apply panning by adjusting viewport origin
        applyCanvasPan(scrollDelta.x, scrollDelta.y)
        
        // Update display and minimap
        updateAfterPan()
    }
    
    /**
     * Extract scroll delta from browser wheel event
     * Handles multiple browser API formats
     */
    function extractScrollDelta(event) {
        let deltaX = 0
        let deltaY = 0
        
        if (event.deltaX !== undefined && event.deltaY !== undefined) {
            // Modern browsers: event.deltaX, event.deltaY
            // Normalize by deltaMode: 0 = pixel, 1 = line, 2 = page
            let modeScale = 1

            if (event.deltaMode === 1) {
                // Lines → approximate pixels
                modeScale = 16
            } else if (event.deltaMode === 2) {
                // Pages → approximate one viewport height
                modeScale = window.innerHeight
            }
        
            deltaX = event.deltaX * modeScale
            deltaY = event.deltaY * modeScale
        } else if (event.wheelDeltaX !== undefined && event.wheelDeltaY !== undefined) {
            // Webkit browsers: wheelDeltaX, wheelDeltaY (inverted sign)
            deltaX = -event.wheelDeltaX
            deltaY = -event.wheelDeltaY
        } else if (event.wheelDelta !== undefined) {
            // Legacy browsers: wheelDelta (vertical only, inverted sign)
            deltaY = -event.wheelDelta
        } else if (event.detail !== undefined) {
            // Firefox legacy API: detail (vertical only)
            deltaY = event.detail * 40 // Scale to approximate pixels
        }
        
        return { x: deltaX, y: deltaY }
    }
    
    /**
     * Apply panning to the canvas viewport
     * @param {number} deltaX - Horizontal pan delta (from scroll event)
     * @param {number} deltaY - Vertical pan delta (from scroll event)
     *
     * The canvas origin (ox, oy) is the pixel offset of the canvas content.
     * To make content follow the finger/wheel naturally (natural scroll):
     *   - Swipe right  → deltaX > 0 → content moves right → ox decreases
     *   - Swipe left   → deltaX < 0 → content moves left  → ox increases
     *   - Swipe down   → deltaY > 0 → content moves down  → oy decreases
     *   - Swipe up     → deltaY < 0 → content moves up    → oy increases
     * So we subtract the delta from the origin.
     */
    function applyCanvasPan(deltaX, deltaY) {
        globalScope.ox -= deltaX
        globalScope.oy -= deltaY

        // Round to avoid subpixel rendering issues
        globalScope.ox = Math.round(globalScope.ox)
        globalScope.oy = Math.round(globalScope.oy)
    }
    
    /**
     * Update canvas and minimap after panning
     */
    function updateAfterPan() {
        gridUpdateSet(true)
        updateCanvasSet(true)
        scheduleUpdate()
        
        // Show minimap temporarily (if enabled)
        if (!embed && !lightMode) {
            findDimensions(globalScope)   
            miniMapArea.setup()
            const miniMapElement = document.querySelector('#miniMap')
            if (miniMapElement) {
                miniMapElement.style.display = 'block'
                updatelastMinimapShown()
                setTimeout(removeMiniMap, 2000)
            }
        }
    }

    // Register wheel/trackpad event listeners for canvas panning
    const simulationAreaElement = document.getElementById('simulationArea')
    simulationAreaElement.addEventListener('wheel', handleCanvasPan, { passive: false })
    simulationAreaElement.addEventListener('mousewheel', handleCanvasPan, { passive: false })
    simulationAreaElement.addEventListener('DOMMouseScroll', handleCanvasPan, { passive: false })

    document.addEventListener('cut', (e) => {
        if (verilogModeGet()) return
        if (document.activeElement.tagName == 'INPUT') return
        if (document.activeElement.tagName != 'BODY') return

        if (listenToSimulator) {
            simulationArea.copyList =
                simulationArea.multipleObjectSelections.slice()
            if (
                simulationArea.lastSelected &&
                simulationArea.lastSelected !== simulationArea.root &&
                !simulationArea.copyList.includes(simulationArea.lastSelected)
            ) {
                simulationArea.copyList.push(simulationArea.lastSelected)
            }

            const textToPutOnClipboard = copy(simulationArea.copyList, true)

            // Updated restricted elements
            updateRestrictedElementsInScope()
            localStorage.setItem('clipboardData', textToPutOnClipboard)
            e.preventDefault()
            if (textToPutOnClipboard == undefined) return
            if (isIe) {
                window.clipboardData.setData('Text', textToPutOnClipboard)
            } else {
                e.clipboardData.setData('text/plain', textToPutOnClipboard)
            }
        }
    })

    document.addEventListener('copy', (e) => {
        if (verilogModeGet()) return
        if (document.activeElement.tagName == 'INPUT') return
        if (document.activeElement.tagName != 'BODY') return

        if (listenToSimulator) {
            simulationArea.copyList =
                simulationArea.multipleObjectSelections.slice()
            if (
                simulationArea.lastSelected &&
                simulationArea.lastSelected !== simulationArea.root &&
                !simulationArea.copyList.includes(simulationArea.lastSelected)
            ) {
                simulationArea.copyList.push(simulationArea.lastSelected)
            }

            const textToPutOnClipboard = copy(simulationArea.copyList)

            // Updated restricted elements
            updateRestrictedElementsInScope()
            localStorage.setItem('clipboardData', textToPutOnClipboard)
            e.preventDefault()
            if (textToPutOnClipboard == undefined) return
            if (isIe) {
                window.clipboardData.setData('Text', textToPutOnClipboard)
            } else {
                e.clipboardData.setData('text/plain', textToPutOnClipboard)
            }
        }
    })

    document.addEventListener('paste', (e) => {
        if (document.activeElement.tagName == 'INPUT') return
        if (document.activeElement.tagName != 'BODY') return

        if (listenToSimulator) {
            var data
            if (isIe) {
                data = window.clipboardData.getData('Text')
            } else {
                data = e.clipboardData.getData('text/plain')
            }

            paste(data)

            // Updated restricted elements
            updateRestrictedElementsInScope()

            e.preventDefault()
        }
    })

    // 'drag and drop' event listener for subcircuit elements in layout mode
    $('#subcircuitMenu').on('dragstop', '.draggableSubcircuitElement', function (event, ui) {
        const sideBarWidth = $('#guide_1')[0].clientWidth;
        let tempElement;

        if (ui.position.top > 10 && ui.position.left > sideBarWidth) {
            // Make a shallow copy of the element with the new coordinates
            tempElement = globalScope[this.dataset.elementName][this.dataset.elementId];
            // Changing the coordinate doesn't work yet, nodes get far from element
            tempElement.x = ui.position.left - sideBarWidth;
            tempElement.y = ui.position.top;
            for (const node of tempElement.nodeList) {
                node.x = ui.position.left - sideBarWidth;
                node.y = ui.position.top;
            }

            tempBuffer.subElements.push(tempElement);
            this.parentElement.removeChild(this);
        }
    });

    restrictedElements.forEach((element) => {
        $(`#${element}`).mouseover(() => {
            showRestricted()
        })

        $(`#${element}`).mouseout(() => {
            hideRestricted()
        })
    })

    // zoomSliderListeners() (jQuery-based) disabled here - zoom slider handling has moved to Vue
    // Vue components (QuickButton.vue / QuickButtonMobile.vue) now manage the zoom slider and +/- buttons
    if (!embed) {
        setupTimingListeners()
    }
}

function resizeTabs() {
    const $windowsize = $('body').width()
    const $sideBarsize = $('.side').width()
    const $maxwidth = $windowsize - $sideBarsize
    $('#tabsBar div').each(function (e) {
        $(this).css({ 'max-width': $maxwidth - 30 })
    })
}

window.addEventListener('resize', resizeTabs)
resizeTabs()

/**
 * Apply zoom change in the specified direction
 * @param {number} direction - Direction and magnitude of zoom change (1 = zoom in, -1 = zoom out)
 */
const MIN_ZOOM_SCALE = 0.5
const MAX_ZOOM_SCALE = 4 * DPR

function applyZoomChange(direction) {
    const zoomDelta = direction * 0.1 * DPR
    const targetScale = Math.max(
        MIN_ZOOM_SCALE,
        Math.min(MAX_ZOOM_SCALE, globalScope.scale + zoomDelta)
    )

    if (targetScale !== globalScope.scale) {
        changeScale(targetScale - globalScope.scale)
        gridUpdateSet(true)
        scheduleUpdate()
    }
}


/**
 * Zoom in - increases the canvas scale
 * Can be called from keyboard shortcuts or UI buttons
 */
export function ZoomIn() {
    applyZoomChange(1)
}

/**
 * Zoom out - decreases the canvas scale
 * Can be called from keyboard shortcuts or UI buttons
 */
export function ZoomOut() {
    applyZoomChange(-1)
}

/**
 * Set zoom level from a slider value
 * Converts a slider value (typically 0-200) to the internal zoom scale (0.5-4.0 * DPR)
 * and applies it centered on the viewport.
 * 
 * @param {number} sliderValue - The value from a zoom slider
 * @param {number} minSliderValue - Minimum slider value (default: 0)
 * @param {number} maxSliderValue - Maximum slider value (default: 10)
 * @param {number} minZoom - Minimum zoom scale (default: 0.5 * DPR)
 * @param {number} maxZoom - Maximum zoom scale (default: 4 * DPR)
 * 
 * Example: setZoomFromSlider(100, 0, 200) // Sets zoom to middle of range
 */
export function setZoomFromSlider(
    sliderValue,
    minSliderValue = 0,
    maxSliderValue = 10,
    minZoom = 0.5 * DPR,
    maxZoom = 4 * DPR
) {
    // Guard against invalid inputs and degenerate ranges
    const inputs = [sliderValue, minSliderValue, maxSliderValue, minZoom, maxZoom]
    if (
        !inputs.every(Number.isFinite) ||
        maxSliderValue === minSliderValue ||
        maxZoom === minZoom
    ) {
        return
    }

    // Normalize slider value to 0-1 range
    const normalizedValue =
        (sliderValue - minSliderValue) / (maxSliderValue - minSliderValue)

    // Map to zoom scale range
    const targetScale = minZoom + normalizedValue * (maxZoom - minZoom)

    // Clamp to valid zoom range
    const clampedScale = Math.max(minZoom, Math.min(maxZoom, targetScale))

    // Calculate delta from current scale
    const scaleDelta = clampedScale - globalScope.scale

    // Avoid applying invalid or zero delta
    if (!Number.isFinite(scaleDelta) || scaleDelta === 0) return

    // Apply zoom centered on viewport (method = 3)
    changeScale(scaleDelta, 'zoomButton', 'zoomButton', 3)

    // Update display
    gridUpdateSet(true)
    updateCanvasSet(true)
    scheduleUpdate()
}


/**
 * Get the current zoom level as a slider value
 * Inverse of setZoomFromSlider - converts internal scale to slider value
 * Useful for initializing or syncing a zoom slider UI
 * 
 * @param {number} minSliderValue - Minimum slider value (default: 0)
 * @param {number} maxSliderValue - Maximum slider value (default: 10)
 * @param {number} minZoom - Minimum zoom scale (default: 0.5 * DPR)
 * @param {number} maxZoom - Maximum zoom scale (default: 4 * DPR)
 * @returns {number} The slider value corresponding to current zoom level
 * 
 * Example: const sliderValue = getZoomSliderValue(0, 200) // Returns 0-200
 */
export function getZoomSliderValue(
    minSliderValue = 0,
    maxSliderValue = 10,
    minZoom = 0.5 * DPR,
    maxZoom = 4 * DPR
) {
    const inputs = [minSliderValue, maxSliderValue, minZoom, maxZoom, globalScope.scale]  
    if (                                                                                  
        !inputs.every(Number.isFinite) ||                                                 
        maxSliderValue === minSliderValue ||                                              
        maxZoom === minZoom                                                               
    ) {                                                                                   
        return minSliderValue                                                             
    }                                                                                     

    const currentScale = globalScope.scale

    // Clamp current scale to valid range
    const clampedScale = Math.max(minZoom, Math.min(maxZoom, currentScale))

    // Normalize scale to 0-1 range
    const normalizedScale = (clampedScale - minZoom) / (maxZoom - minZoom)

    // Map to slider value range
    const sliderValue =
        minSliderValue + normalizedScale * (maxSliderValue - minSliderValue)

    if (!Number.isFinite(sliderValue)) {        
        return minSliderValue                   
    }                                           

    return sliderValue
}


