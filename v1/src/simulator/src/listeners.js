/* eslint-disable no-shadow */
/* eslint-disable no-negated-condition */
/* eslint-disable no-alert */
/* eslint-disable new-cap */
/* eslint-disable no-undef */
/* eslint-disable eqeqeq */
/* eslint-disable prefer-template */
/* eslint-disable no-param-reassign */
// Most Listeners are stored here

import { simulationArea } from './simulationArea'
import {
    scheduleUpdate,
    wireToBeCheckedSet,
    updatePositionSet,
    updateSimulationSet,
    updateCanvasSet,
    errorDetectedSet,
} from './engine'
import { hideProperties, deleteSelected, exitFullView } from './ux';
import { updateRestrictedElementsInScope, hideRestricted, showRestricted } from './restrictedElementDiv';
import undo from './data/undo'
import redo from './data/redo'
import { copy, paste, selectAll } from './events'
import { verilogModeGet } from './Verilog2CV'
import { setupTimingListeners } from './plotArea'
import logixFunction from './data'
import { listen } from '@tauri-apps/api/event'

// Canvas pointer input now lives in commands/pointer.ts and is bound by
// components/SimulatorCanvas.vue. Re-exported here for backwards compatibility.
export { getCoordinate, pinchZoom, panStart, panMove, panStop } from './commands/pointer'

let listenToSimulator = true
const isIe = (navigator.userAgent.toLowerCase().indexOf('msie') != -1 || navigator.userAgent.toLowerCase().indexOf('trident') != -1);

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
restrictedElements.forEach((element) => {
        $(`#${element}`).mouseover(() => {
            showRestricted()
        })

        $(`#${element}`).mouseout(() => {
            hideRestricted()
        })
    })

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

import { ZoomIn, ZoomOut } from './commands/zoom';
export { ZoomIn, ZoomOut };

// Desktop App Listeners

listen('new-project', () => {
    logixFunction.newProject();
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
