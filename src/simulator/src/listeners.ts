/* eslint-disable no-shadow */
/* eslint-disable no-negated-condition */
/* eslint-disable no-alert */
/* eslint-disable new-cap */
/* eslint-disable no-undef */
/* eslint-disable eqeqeq */
/* eslint-disable prefer-template */
/* eslint-disable no-param-reassign */
// Most Listeners are stored here
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
import { removeMiniMap, updatelastMinimapShown } from './minimap'
import undo from './data/undo'
import redo from './data/redo'
import { copy, paste, selectAll } from './events'
import { verilogModeGet } from './Verilog2CV'
import { setupTimingListeners } from './plotArea'
import logixFunction from './data'
import { listen } from '@tauri-apps/api/event'
import { useSimulatorMobileStore } from '../../store/simulatorMobileStore'
import { toRefs } from 'vue'
import type Scope from './circuit'

declare const DPR: number;
declare const width: number;
declare const height: number;
declare const lightMode: boolean;
declare const embed: boolean;
declare const restrictedElements: string[];
declare function saveOffline(): void;
declare function showProperties(element: unknown): void;
declare var globalScope: Scope;

type Coordinate = { 
    x: number; 
    y: number 
};
type Direction = 1 | -1;
type PointerEvent = MouseEvent | TouchEvent;

const unit = 10
let listenToSimulator = true
let coordinate: Coordinate;
const returnCoordinate: Coordinate = {
    x: 0,
    y: 0
}

let currDistance = 0;
let distance = 0;
let pinchZ = 0;
let centreX = 0;
let centreY = 0;
let timeout: ReturnType<typeof setTimeout> | undefined;
let lastTap = 0;

/**
 *
 * @param {event} e
 * function for double click or double tap
 */
function onDoubleClickorTap(e: PointerEvent) {
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
function getTap(e: PointerEvent) {
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
export function getCoordinate(e: PointerEvent): Coordinate {
    if (simulationArea.touch && 'touches' in e) {
        returnCoordinate.x = e.touches[0].clientX;
        returnCoordinate.y = e.touches[0].clientY;
        return returnCoordinate;
    }

    if (!simulationArea.touch && 'clientX' in e) {
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
export function pinchZoom(e: TouchEvent, globalScope: Scope) {
    e.preventDefault();
    gridUpdateSet(true);
    scheduleUpdate();
    updateSimulationSet(true);
    updatePositionSet(true);
    updateCanvasSet(true);
    // Calculating distance between touch to see if its pinchIN or pinchOut
    distance = Math.sqrt((e.touches[1].clientX - e.touches[0].clientX) ** 2 + (e.touches[1].clientY - e.touches[0].clientY) ** 2);
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
export function panStart(e: PointerEvent) {
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
    simulationArea.hover = false;
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

export function panMove(e: PointerEvent) {
    // If only one  it touched
    // pan left or right
    if (!simulationArea.touch || ('touches' in e && e.touches.length === 1)) {
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
    if (simulationArea.touch && 'touches' in e && e.touches.length === 2) {
        pinchZoom(e as TouchEvent, globalScope);
    }
}

export function panStop(e: PointerEvent) {
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
    $(document).on("keyup", (e: JQuery.KeyUpEvent) => {
        if (e.key === 'Escape') exitFullView()
    })

    $('#projectName').on('click', () => {
        simulationArea.lastSelected = globalScope.root;
        setTimeout(() => {
            const input = document.getElementById("projname");
            if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
                input.select();
            }
        }, 100);
    });

    const simulationCanvas = document.getElementById('simulationArea') as HTMLCanvasElement | null
    if (simulationCanvas) {
        simulationCanvas.addEventListener('mouseup', (e: MouseEvent) => {
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
    }

    window.addEventListener('keyup', (e: KeyboardEvent) => {
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
        (e: KeyboardEvent) => {
            if (document.activeElement?.tagName == 'INPUT') return
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
                const active = document.activeElement;
                if (active instanceof HTMLInputElement && active.type === 'number') {
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

                // zoom in (+)
                if (
                    (simulationArea.controlDown &&
                        (e.keyCode == 187 || e.keyCode == 171)) ||
                    e.keyCode == 107
                ) {
                    e.preventDefault()
                    ZoomIn()
                }
                // zoom out (-)
                if (
                    (simulationArea.controlDown &&
                        (e.keyCode == 189 || e.keyCode == 173)) ||
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
                    simulationArea.lastSelected = null
                    e.preventDefault()
                }

                if (
                    (e.keyCode == 113 || e.keyCode == 81) &&
                    simulationArea.lastSelected != undefined
                ) {
                    if (simulationArea.lastSelected.bitWidth !== undefined) {
                        simulationArea.lastSelected.newBitWidth(
                            parseInt(prompt('Enter new bitWidth') ?? '0', 10)
                        )
                    }
                }

                if (
                    simulationArea.controlDown &&
                    (e.key == 'T' || e.key == 't')
                ) {
                    // e.preventDefault(); //browsers normally open a new tab
                    simulationArea.changeClockTime(parseInt(prompt('Enter Time:') ?? '0'))
                }
            }

            if (e.keyCode == 8 || e.key == 'Delete') {
                deleteSelected()
            }
        },
        true
    )

    if (simulationCanvas) {
        simulationCanvas.addEventListener('dblclick', (e: MouseEvent) => {
            onDoubleClickorTap(e);
        });
    }

    function MouseScroll(event: WheelEvent & { wheelDelta?: number; detail?: number }) {
        updateCanvasSet(true)
        event.preventDefault()
        var deltaY = event.wheelDelta ? event.wheelDelta : -event.detail
        event.preventDefault()
        var deltaY = event.wheelDelta ? event.wheelDelta : -event.detail
        const direction = deltaY > 0 ? 1 : -1
        handleZoom(direction)
        updateCanvasSet(true)
        gridUpdateSet(true)

        if (layoutModeGet()) layoutUpdate()
        else update() // Schedule update not working, this is INEFFICIENT
    }

    if (simulationCanvas) {
        simulationCanvas.addEventListener('mousewheel', MouseScroll as EventListener)
        simulationCanvas.addEventListener('DOMMouseScroll', MouseScroll as EventListener)
    }

    document.addEventListener('cut', (e: ClipboardEvent) => {
        if (verilogModeGet()) return
        if (document.activeElement?.tagName == 'INPUT') return
        if (document.activeElement?.tagName != 'BODY') return

        if (listenToSimulator) {
            simulationArea.copyList =
                simulationArea.multipleObjectSelections.slice()
            if (
                simulationArea.lastSelected &&
                simulationArea.lastSelected !== globalScope.root &&
                !simulationArea.copyList.includes(simulationArea.lastSelected)
            ) {
                simulationArea.copyList.push(simulationArea.lastSelected)
            }

            const textToPutOnClipboard = JSON.parse(copy(simulationArea.copyList, true))

            // Updated restricted elements
            updateRestrictedElementsInScope()
            localStorage.setItem('clipboardData', textToPutOnClipboard)
            e.preventDefault()
            if (textToPutOnClipboard == undefined) return
            if (isIe) {
                (window as any).clipboardData.setData('Text', textToPutOnClipboard)
            } else {
                e?.clipboardData?.setData('text/plain', textToPutOnClipboard)
            }
        }
    })

    document.addEventListener('copy', (e: ClipboardEvent) => {
        if (verilogModeGet()) return
        if (document?.activeElement?.tagName == 'INPUT') return
        if (document?.activeElement?.tagName != 'BODY') return

        if (listenToSimulator) {
            simulationArea.copyList =
                simulationArea.multipleObjectSelections.slice()
            if (
                simulationArea.lastSelected &&
                simulationArea.lastSelected !== globalScope.root &&
                !simulationArea.copyList.includes(simulationArea.lastSelected)
            ) {
                simulationArea.copyList.push(simulationArea.lastSelected)
            }

            const textToPutOnClipboard = JSON.parse(copy(simulationArea.copyList))

            // Updated restricted elements
            updateRestrictedElementsInScope()
            localStorage.setItem('clipboardData', textToPutOnClipboard)
            e.preventDefault()
            if (textToPutOnClipboard == undefined) return
            if (isIe) {
                (window as any).clipboardData.setData('Text', textToPutOnClipboard)
            } else {
                e?.clipboardData?.setData('text/plain', textToPutOnClipboard)
            }
        }
    })

    document.addEventListener('paste', (e: ClipboardEvent) => {
        if (document?.activeElement?.tagName == 'INPUT') return
        if (document?.activeElement?.tagName != 'BODY') return

        if (listenToSimulator) {
            var data
            if (isIe) {
                data = (window as any).clipboardData.getData('Text')
            } else {
                data = e?.clipboardData?.getData('text/plain')
            }

            paste(data)

            // Updated restricted elements
            updateRestrictedElementsInScope()

            e.preventDefault()
        }
    })

    // 'drag and drop' event listener for subcircuit elements in layout mode
    $('#subcircuitMenu').on('dragstop', '.draggableSubcircuitElement', function (event: JQuery.TriggeredEvent, ui: any) {
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

    zoomSliderListeners()
    if (!embed) {
        setupTimingListeners()
    }
}

function resizeTabs() {
    const $windowsize = $('body').width() || 0
    const $sideBarsize = $('.side').width() || 0
    const $maxwidth = $windowsize - $sideBarsize
    $('#tabsBar div').each(function () {
        $(this).css({ 'max-width': $maxwidth - 30 })
    })
}

window.addEventListener('resize', resizeTabs)
resizeTabs()

// direction is only 1 or -1
function handleZoom(direction: Direction) {
    if (globalScope.scale > 0.5 * DPR) {
        changeScale(direction * 0.1 * DPR);
    } else if (globalScope.scale < 4 * DPR) {
        changeScale(direction * 0.1 * DPR);
    }
    gridUpdateSet(true);
    scheduleUpdate();
}
export function ZoomIn() {
    handleZoom(1);
}
export function ZoomOut() {
    handleZoom(-1);
}
function zoomSliderListeners() {
    const zoomInput = document.getElementById('customRange1') as HTMLInputElement | null;
    const simulationCanvas = document.getElementById('simulationArea') as HTMLCanvasElement | null;
    if (!zoomInput || !simulationCanvas) return;

    zoomInput.value = '5';
    simulationCanvas.addEventListener('DOMMouseScroll', zoomSliderScroll as EventListener);
    simulationCanvas.addEventListener('mousewheel', zoomSliderScroll as EventListener);

    let curLevel = Number(zoomInput.value);
    $(document).on('input change', '#customRange1', function () {
        const rawValue = $(this).val();
        const newValue = typeof rawValue === 'number' ? rawValue : Number(rawValue);
        const changeInScale = newValue - curLevel;
        updateCanvasSet(true);
        changeScale(changeInScale * 0.1, 'zoomButton', 'zoomButton', 3)
        gridUpdateSet(true);
        curLevel = newValue;
    });
    function zoomSliderScroll(e: WheelEvent & { wheelDelta?: number; detail?: number }) {
        let zoomLevel = Number(zoomInput?.value);
        const deltaY = e.wheelDelta ?? -Number(e.detail ?? 0);
        const directionY = deltaY > 0 ? 1 : -1;
        if (directionY > 0) zoomLevel++
        else zoomLevel--
        if (zoomLevel >= 45) {
            zoomLevel = 45;
            if (zoomInput) zoomInput.value = '45';
        } else if (zoomLevel <= 0) {
            zoomLevel = 0;
            if (zoomInput) zoomInput.value = '0';
        } else {
            if (zoomInput) zoomInput.value = String(zoomLevel);
            curLevel = zoomLevel;
        }
    }
    function sliderZoomButton(direction: Direction) {
        const zoomSlider = $('#customRange1');
        const raw = zoomSlider.val();
        let currentSliderValue = parseInt(String(raw), 10);
        if (direction === -1) {
            currentSliderValue--;
        } else {
            currentSliderValue++;
        }
        zoomSlider.val(currentSliderValue).change();
    }
    $('#decrement').click(() => {
        sliderZoomButton(-1);
    });
    $('#increment').click(() => {
        sliderZoomButton(1);
    });
}

// Desktop App Listeners

listen('new-project', () => {
    logixFunction.newProject(true);
});

listen('save-online', () => {
    logixFunction.save();
});

listen('save-offline', () => {
    logixFunction.saveOffline();
});

listen('open-offline', () => {
    logixFunction.createOpenLocalPrompt();
});

listen('export', () => {
    logixFunction.ExportProject();
});

listen('import', () => {
    logixFunction.ImportProject();
});

listen('recover', () => {
    logixFunction.recoverProject();
});

listen('clear', () => {
    logixFunction.clearProject();
});

listen('preview-circuit', () => {
    logixFunction.fullViewOption();
});

listen('new-circuit', () => {
    logixFunction.createNewCircuitScope();
});

listen('new-verilog-module', () => {
    logixFunction.newVerilogModule();
});

listen('insert-sub-circuit', () => {
    logixFunction.createSubCircuitPrompt();
});

listen('combinational-analysis', () => {
    logixFunction.createCombinationalAnalysisPrompt();
});

listen('hex-bin-dec', () => {
    logixFunction.bitconverter();
});

listen('download-image', () => {
    logixFunction.createSaveAsImgPrompt();
});

listen('themes', () => {
    logixFunction.colorThemes();
});

listen('custom-shortcut', () => {
    logixFunction.customShortcut();
});

listen('export-verilog', () => {
    logixFunction.generateVerilog();
});

listen('tutorial', () => {
    logixFunction.showTourGuide();
});

listen('user-manual', () => {
    logixFunction.showUserManual();
});

listen('learn-digital-circuit', () => {
    logixFunction.showDigitalCircuit();
});

listen('discussion-forum', () => {
    logixFunction.showDiscussionForum();
});
