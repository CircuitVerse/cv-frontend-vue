// Most Listeners are stored here
import {
    layoutModeGet,
    tempBuffer,
    layoutUpdate,
    setupLayoutModePanelListeners,
} from './layoutMode'
// import simulationArea from './simulationArea'
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
import { changeScale } from './canvasApi'
import { scheduleBackup } from './data/backupCircuit'
import {
    hideProperties,
    deleteSelected,
    uxvar,
    fullView,
    exitFullView,
} from './ux'
import {
    updateRestrictedElementsList,
    updateRestrictedElementsInScope,
    hideRestricted,
    showRestricted,
} from './restrictedElementDiv'
import { removeMiniMap, updatelastMinimapShown } from './minimap'
import undo from './data/undo'
import redo from './data/redo'
import { copy, paste, selectAll } from './events'
import save from './data/save'
import { verilogModeGet } from './Verilog2CV'
import { setupTimingListeners } from './plotArea'
import { SimulationareaStore } from '#/store/SimulationareaCanvas/SimulationareaStore'

var unit = 10
var listenToSimulator = true

export default function startListeners() {
    const simulationAreaStore = SimulationareaStore()
    $('#deleteSelected').on('click', () => {
        deleteSelected()
    })

    $('#zoomIn').on('click', () => {
        changeScale(0.2, 'zoomButton', 'zoomButton', 2)
    })

    $('#zoomOut').on('click', () => {
        changeScale(-0.2, 'zoomButton', 'zoomButton', 2)
    })

    $('#undoButton').on('click', () => {
        undo()
    })
    $('#redoButton').on('click', () => {
        redo()
    })
    $('#viewButton').on('click', () => {
        fullView()
    })

    $(document).on('keyup', (e) => {
        if (e.key === 'Escape') exitFullView()
    })

    $('#projectName').on('click', () => {
        simulationAreaStore.lastSelected = globalScope.root
        setTimeout(() => {
            document.getElementById('projname').select()
        }, 100)
    })
    /* Makes tabs reordering possible by making them sortable */
    // $("#tabsBar").sortable({
    //     containment: 'parent',
    //     items: '> div',
    //     revert: false,
    //     opacity: 0.5,
    //     tolerance: 'pointer',
    //     placeholder: 'placeholder',
    //     forcePlaceholderSize: true,
    // });

    document
        .getElementById('simulationArea')
        .addEventListener('mousedown', (e) => {
            simulationAreaStore.mouseDown = true

            // Deselect Input
            if (document.activeElement instanceof HTMLElement)
                document.activeElement.blur()

            errorDetectedSet(false)
            updateSimulationSet(true)
            updatePositionSet(true)
            updateCanvasSet(true)

            simulationAreaStore.lastSelected = undefined
            simulationAreaStore.selected = false
            simulationAreaStore.hover = undefined
            var rect = simulationAreaStore.canvas.getBoundingClientRect()
            simulationAreaStore.mouseDownRawX = (e.clientX - rect.left) * DPR
            simulationAreaStore.mouseDownRawY = (e.clientY - rect.top) * DPR
            simulationAreaStore.mouseDownX =
                Math.round(
                    (simulationAreaStore.mouseDownRawX - globalScope.ox) /
                        globalScope.scale /
                        unit
                ) * unit
            simulationAreaStore.mouseDownY =
                Math.round(
                    (simulationAreaStore.mouseDownRawY - globalScope.oy) /
                        globalScope.scale /
                        unit
                ) * unit
            simulationAreaStore.oldx = globalScope.ox
            simulationAreaStore.oldy = globalScope.oy

            e.preventDefault()
            scheduleBackup()
            scheduleUpdate(1)
            $('.dropdown.open').removeClass('open')
        })
    document
        .getElementById('simulationArea')
        .addEventListener('mouseup', (e) => {
            if (simulationAreaStore.lastSelected)
                simulationAreaStore.lastSelected.newElement = false
            /*
        handling restricted circuit elements
        */

            if (
                simulationAreaStore.lastSelected &&
                restrictedElements.includes(
                    simulationAreaStore.lastSelected.objectType
                ) &&
                !globalScope.restrictedCircuitElementsUsed.includes(
                    simulationAreaStore.lastSelected.objectType
                )
            ) {
                globalScope.restrictedCircuitElementsUsed.push(
                    simulationAreaStore.lastSelected.objectType
                )
                updateRestrictedElementsList()
            }

            //       deselect multible elements with click
            if (
                !simulationAreaStore.shiftDown &&
                simulationAreaStore.multipleObjectSelections.length > 0
            ) {
                if (
                    !simulationAreaStore.multipleObjectSelections.includes(
                        simulationAreaStore.lastSelected
                    )
                ) {
                    simulationAreaStore.multipleObjectSelections = []
                }
            }
        })
    document
        .getElementById('simulationArea')
        .addEventListener('mousemove', onMouseMove)

    window.addEventListener('keyup', (e) => {
        scheduleUpdate(1)
        simulationAreaStore.shiftDown = e.shiftKey
        if (e.keyCode == 16) {
            simulationAreaStore.shiftDown = false
        }
        if (e.key == 'Meta' || e.key == 'Control') {
            simulationAreaStore.controlDown = false
        }
    })

    window.addEventListener(
        'keydown',
        (e) => {
            if (document.activeElement.tagName == 'INPUT') return
            if (document.activeElement != document.body) return

            simulationAreaStore.shiftDown = e.shiftKey
            if (e.key == 'Meta' || e.key == 'Control') {
                simulationAreaStore.controlDown = true
            }

            if (
                simulationAreaStore.controlDown &&
                e.key.charCodeAt(0) == 122 &&
                !simulationAreaStore.shiftDown
            ) {
                // detect the special CTRL-Z code
                undo()
            }
            if (
                simulationAreaStore.controlDown &&
                e.key.charCodeAt(0) == 122 &&
                simulationAreaStore.shiftDown
            ) {
                // detect the special Cmd + shift + z code (macOs)
                redo()
            }
            if (
                simulationAreaStore.controlDown &&
                e.key.charCodeAt(0) == 121 &&
                !simulationAreaStore.shiftDown
            ) {
                // detect the special ctrl + Y code (windows)
                redo()
            }

            if (listenToSimulator) {
                // If mouse is focusing on input element, then override any action
                // if($(':focus').length){
                //     return;
                // }

                if (
                    document.activeElement.tagName == 'INPUT' ||
                    simulationAreaStore.mouseRawX < 0 ||
                    simulationAreaStore.mouseRawY < 0 ||
                    simulationAreaStore.mouseRawX > width ||
                    simulationAreaStore.mouseRawY > height
                ) {
                    return
                }
                // HACK TO REMOVE FOCUS ON PROPERTIES
                if (document.activeElement.type == 'number') {
                    hideProperties()
                    showProperties(simulationAreaStore.lastSelected)
                }

                errorDetectedSet(false)
                updateSimulationSet(true)
                updatePositionSet(true)
                simulationAreaStore.shiftDown = e.shiftKey

                if (e.key == 'Meta' || e.key == 'Control') {
                    simulationAreaStore.controlDown = true
                }

                // zoom in (+)
                if (
                    (simulationAreaStore.controlDown &&
                        (e.keyCode == 187 || e.keyCode == 171)) ||
                    e.keyCode == 107
                ) {
                    e.preventDefault()
                    ZoomIn()
                }
                // zoom out (-)
                if (
                    (simulationAreaStore.controlDown &&
                        (e.keyCode == 189 || e.keyCode == 173)) ||
                    e.keyCode == 109
                ) {
                    e.preventDefault()
                    ZoomOut()
                }

                if (
                    simulationAreaStore.mouseRawX < 0 ||
                    simulationAreaStore.mouseRawY < 0 ||
                    simulationAreaStore.mouseRawX > width ||
                    simulationAreaStore.mouseRawY > height
                )
                    return

                scheduleUpdate(1)
                updateCanvasSet(true)
                wireToBeCheckedSet(1)

                // Needs to be deprecated, moved to more recent listeners
                if (
                    simulationAreaStore.controlDown &&
                    (e.key == 'C' || e.key == 'c')
                ) {
                    //    simulationAreaStore.copyList=simulationAreaStore.multipleObjectSelections.slice();
                    //    if(simulationAreaStore.lastSelected&&simulationAreaStore.lastSelected!==simulationAreaStore.root&&!simulationAreaStore.copyList.contains(simulationAreaStore.lastSelected)){
                    //        simulationAreaStore.copyList.push(simulationAreaStore.lastSelected);
                    //    }
                    //    copy(simulationAreaStore.copyList);
                }

                if (
                    simulationAreaStore.lastSelected &&
                    simulationAreaStore.lastSelected.keyDown
                ) {
                    if (
                        e.key.toString().length == 1 ||
                        e.key.toString() == 'Backspace' ||
                        e.key.toString() == 'Enter'
                    ) {
                        simulationAreaStore.lastSelected.keyDown(
                            e.key.toString()
                        )
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
                    simulationAreaStore.lastSelected &&
                    simulationAreaStore.lastSelected.keyDown2
                ) {
                    if (e.key.toString().length == 1) {
                        simulationAreaStore.lastSelected.keyDown2(
                            e.key.toString()
                        )
                        return
                    }
                }

                if (
                    simulationAreaStore.lastSelected &&
                    simulationAreaStore.lastSelected.keyDown3
                ) {
                    if (
                        e.key.toString() != 'Backspace' &&
                        e.key.toString() != 'Delete'
                    ) {
                        simulationAreaStore.lastSelected.keyDown3(
                            e.key.toString()
                        )
                        return
                    }
                }

                if (e.keyCode == 16) {
                    simulationAreaStore.shiftDown = true
                    if (
                        simulationAreaStore.lastSelected &&
                        !simulationAreaStore.lastSelected.keyDown &&
                        simulationAreaStore.lastSelected.objectType != 'Wire' &&
                        simulationAreaStore.lastSelected.objectType !=
                            'CircuitElement' &&
                        !simulationAreaStore.multipleObjectSelections.contains(
                            simulationAreaStore.lastSelected
                        )
                    ) {
                        simulationAreaStore.multipleObjectSelections.push(
                            simulationAreaStore.lastSelected
                        )
                    }
                }

                // Detect offline save shortcut (CTRL+SHIFT+S)
                if (
                    simulationAreaStore.controlDown &&
                    e.keyCode == 83 &&
                    simulationAreaStore.shiftDown
                ) {
                    saveOffline()
                    e.preventDefault()
                }

                // Detect Select all Shortcut
                if (
                    simulationAreaStore.controlDown &&
                    (e.keyCode == 65 || e.keyCode == 97)
                ) {
                    selectAll()
                    e.preventDefault()
                }

                // deselect all Shortcut
                if (e.keyCode == 27) {
                    simulationAreaStore.multipleObjectSelections = []
                    simulationAreaStore.lastSelected = undefined
                    e.preventDefault()
                }

                if (
                    (e.keyCode == 113 || e.keyCode == 81) &&
                    simulationAreaStore.lastSelected != undefined
                ) {
                    if (
                        simulationAreaStore.lastSelected.bitWidth !== undefined
                    ) {
                        simulationAreaStore.lastSelected.newBitWidth(
                            parseInt(prompt('Enter new bitWidth'), 10)
                        )
                    }
                }

                if (
                    simulationAreaStore.controlDown &&
                    (e.key == 'T' || e.key == 't')
                ) {
                    // e.preventDefault(); //browsers normally open a new tab
                    simulationAreaStore.changeClockTime(prompt('Enter Time:'))
                }
            }

            if (e.keyCode == 8 || e.key == 'Delete') {
                deleteSelected()
            }
        },
        true
    )

    document
        .getElementById('simulationArea')
        .addEventListener('dblclick', (e) => {
            updateCanvasSet(true)
            if (
                simulationAreaStore.lastSelected &&
                simulationAreaStore.lastSelected.dblclick !== undefined
            ) {
                simulationAreaStore.lastSelected.dblclick()
            } else if (!simulationAreaStore.shiftDown) {
                simulationAreaStore.multipleObjectSelections = []
            }
            scheduleUpdate(2)
        })

    document
        .getElementById('simulationArea')
        .addEventListener('mouseup', onMouseUp)

    document
        .getElementById('simulationArea')
        .addEventListener('mousewheel', MouseScroll)
    document
        .getElementById('simulationArea')
        .addEventListener('DOMMouseScroll', MouseScroll)

    function MouseScroll(event) {
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

    document.addEventListener('cut', (e) => {
        if (verilogModeGet()) return
        if (document.activeElement.tagName == 'INPUT') return
        if (document.activeElement.tagName != 'BODY') return

        if (listenToSimulator) {
            simulationAreaStore.copyList =
                simulationAreaStore.multipleObjectSelections.slice()
            if (
                simulationAreaStore.lastSelected &&
                simulationAreaStore.lastSelected !== simulationAreaStore.root &&
                !simulationAreaStore.copyList.contains(
                    simulationAreaStore.lastSelected
                )
            ) {
                simulationAreaStore.copyList.push(
                    simulationAreaStore.lastSelected
                )
            }

            var textToPutOnClipboard = copy(simulationAreaStore.copyList, true)

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
            simulationAreaStore.copyList =
                simulationAreaStore.multipleObjectSelections.slice()
            if (
                simulationAreaStore.lastSelected &&
                simulationAreaStore.lastSelected !== simulationAreaStore.root &&
                !simulationAreaStore.copyList.contains(
                    simulationAreaStore.lastSelected
                )
            ) {
                simulationAreaStore.copyList.push(
                    simulationAreaStore.lastSelected
                )
            }

            var textToPutOnClipboard = copy(simulationAreaStore.copyList)

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
    $('#subcircuitMenu').on(
        'dragstop',
        '.draggableSubcircuitElement',
        function (event, ui) {
            const sideBarWidth = $('#guide_1')[0].clientWidth
            let tempElement

            if (ui.position.top > 10 && ui.position.left > sideBarWidth) {
                // make a shallow copy of the element with the new coordinates
                tempElement =
                    globalScope[this.dataset.elementName][
                        this.dataset.elementId
                    ]

                // Changing the coordinate doesn't work yet, nodes get far from element
                tempElement.x = ui.position.left - sideBarWidth
                tempElement.y = ui.position.top
                for (let node of tempElement.nodeList) {
                    node.x = ui.position.left - sideBarWidth
                    node.y = ui.position.top
                }

                tempBuffer.subElements.push(tempElement)
                this.parentElement.removeChild(this)
            }
        }
    )

    restrictedElements.forEach((element) => {
        $(`#${element}`).mouseover(() => {
            showRestricted()
        })

        $(`#${element}`).mouseout(() => {
            hideRestricted()
        })
    })

    zoomSliderListeners()
    setupLayoutModePanelListeners()
    if (!embed) {
        setupTimingListeners()
    }
}

var isIe =
    navigator.userAgent.toLowerCase().indexOf('msie') != -1 ||
    navigator.userAgent.toLowerCase().indexOf('trident') != -1

function onMouseMove(e) {
    const simulationAreaStore = SimulationareaStore()
    var rect = simulationAreaStore.canvas.getBoundingClientRect()
    simulationAreaStore.mouseRawX = (e.clientX - rect.left) * DPR
    simulationAreaStore.mouseRawY = (e.clientY - rect.top) * DPR
    simulationAreaStore.mouseXf =
        (simulationAreaStore.mouseRawX - globalScope.ox) / globalScope.scale
    simulationAreaStore.mouseYf =
        (simulationAreaStore.mouseRawY - globalScope.oy) / globalScope.scale
    simulationAreaStore.mouseX =
        Math.round(simulationAreaStore.mouseXf / unit) * unit
    simulationAreaStore.mouseY =
        Math.round(simulationAreaStore.mouseYf / unit) * unit

    updateCanvasSet(true)

    if (
        simulationAreaStore.lastSelected &&
        (simulationAreaStore.mouseDown ||
            simulationAreaStore.lastSelected.newElement)
    ) {
        updateCanvasSet(true)
        var fn

        if (simulationAreaStore.lastSelected == globalScope.root) {
            fn = function () {
                updateSelectionsAndPane()
            }
        } else {
            fn = function () {
                if (simulationAreaStore.lastSelected) {
                    simulationAreaStore.lastSelected.update()
                }
            }
        }
        scheduleUpdate(0, 20, fn)
    } else {
        scheduleUpdate(0, 200)
    }
}

function onMouseUp(e) {
    const simulationAreaStore = SimulationareaStore()
    simulationAreaStore.mouseDown = false
    if (!lightMode) {
        updatelastMinimapShown()
        setTimeout(removeMiniMap, 2000)
    }

    errorDetectedSet(false)
    updateSimulationSet(true)
    updatePositionSet(true)
    updateCanvasSet(true)
    gridUpdateSet(true)
    wireToBeCheckedSet(1)

    scheduleUpdate(1)
    simulationAreaStore.mouseDown = false

    for (var i = 0; i < 2; i++) {
        updatePositionSet(true)
        wireToBeCheckedSet(1)
        update()
    }
    errorDetectedSet(false)
    updateSimulationSet(true)
    updatePositionSet(true)
    updateCanvasSet(true)
    gridUpdateSet(true)
    wireToBeCheckedSet(1)

    scheduleUpdate(1)
    var rect = simulationAreaStore.canvas.getBoundingClientRect()

    if (
        !(
            simulationAreaStore.mouseRawX < 0 ||
            simulationAreaStore.mouseRawY < 0 ||
            simulationAreaStore.mouseRawX > width ||
            simulationAreaStore.mouseRawY > height
        )
    ) {
        uxvar.smartDropXX = simulationAreaStore.mouseX + 100 // Math.round(((simulationAreaStore.mouseRawX - globalScope.ox+100) / globalScope.scale) / unit) * unit;
        uxvar.smartDropYY = simulationAreaStore.mouseY - 50 // Math.round(((simulationAreaStore.mouseRawY - globalScope.oy+100) / globalScope.scale) / unit) * unit;
    }
}

function resizeTabs() {
    var $windowsize = $('body').width()
    var $sideBarsize = $('.side').width()
    var $maxwidth = $windowsize - $sideBarsize
    $('#tabsBar div').each(function (e) {
        $(this).css({ 'max-width': $maxwidth - 30 })
    })
}

window.addEventListener('resize', resizeTabs)
resizeTabs()

// $(() => {
//     $('[data-toggle="tooltip"]').tooltip()
// })

// direction is only 1 or -1
function handleZoom(direction) {
    var zoomSlider = $('#customRange1')
    var currentSliderValue = parseInt(zoomSlider.val(), 10)
    currentSliderValue += direction

    if (globalScope.scale > 0.5 * DPR) {
        zoomSlider.val(currentSliderValue).change()
    } else if (globalScope.scale < 4 * DPR) {
        zoomSlider.val(currentSliderValue).change()
    }

    gridUpdateSet(true)
    scheduleUpdate()
}

export function ZoomIn() {
    handleZoom(1)
}

export function ZoomOut() {
    handleZoom(-1)
}

function zoomSliderListeners() {
    document.getElementById('customRange1').value = 5
    document
        .getElementById('simulationArea')
        .addEventListener('DOMMouseScroll', zoomSliderScroll)
    document
        .getElementById('simulationArea')
        .addEventListener('mousewheel', zoomSliderScroll)
    let curLevel = document.getElementById('customRange1').value
    $(document).on('input change', '#customRange1', function (e) {
        let newValue = $(this).val()
        let changeInScale = newValue - curLevel
        updateCanvasSet(true)
        changeScale(changeInScale * 0.1, 'zoomButton', 'zoomButton', 3)
        gridUpdateSet(true)
        curLevel = newValue
    })
    function zoomSliderScroll(e) {
        let zoomLevel = document.getElementById('customRange1').value
        let deltaY = e.wheelDelta ? e.wheelDelta : -e.detail
        const directionY = deltaY > 0 ? 1 : -1
        if (directionY > 0) zoomLevel++
        else zoomLevel--
        if (zoomLevel >= 45) {
            zoomLevel = 45
            document.getElementById('customRange1').value = 45
        } else if (zoomLevel <= 0) {
            zoomLevel = 0
            document.getElementById('customRange1').value = 0
        } else {
            document.getElementById('customRange1').value = zoomLevel
            curLevel = zoomLevel
        }
    }
    function sliderZoomButton(direction) {
        var zoomSlider = $('#customRange1')
        var currentSliderValue = parseInt(zoomSlider.val(), 10)
        if (direction === -1) {
            currentSliderValue--
        } else {
            currentSliderValue++
        }
        zoomSlider.val(currentSliderValue).change()
    }
    $('#decrement').click(() => {
        sliderZoomButton(-1)
    })

    $('#increment').click(() => {
        sliderZoomButton(1)
    })
}
