/* eslint-disable import/no-cycle */
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
} from './engine'
import { changeScale } from './canvasApi'
import { copy, paste } from './events'
import { ZoomIn, ZoomOut } from './listeners'
import { SimulationareaStore } from '#/store/SimulationareaCanvas/SimulationareaStore'

var unit = 10

export default function startListeners() {
    const simulationAreaStore = SimulationareaStore()
    window.addEventListener('keyup', (e) => {
        scheduleUpdate(1)
        if (e.keyCode == 16) {
            simulationAreaStore.shiftDown = false
        }
        if (e.key == 'Meta' || e.key == 'Control') {
            simulationAreaStore.controlDown = false
        }
    })

    document
        .getElementById('simulationArea')
        .addEventListener('mousedown', (e) => {
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
            simulationAreaStore.mouseDown = true
            simulationAreaStore.oldx = globalScope.ox
            simulationAreaStore.oldy = globalScope.oy

            e.preventDefault()
            scheduleUpdate(1)
        })

    document
        .getElementById('simulationArea')
        .addEventListener('mousemove', () => {
            var ele = document.getElementById('elementName')
            if (
                globalScope &&
                simulationAreaStore &&
                simulationAreaStore.objectList
            ) {
                var { objectList } = simulationAreaStore
                objectList = objectList.filter((val) => val !== 'wires')

                for (var i = 0; i < objectList.length; i++) {
                    for (
                        var j = 0;
                        j < globalScope[objectList[i]].length;
                        j++
                    ) {
                        if (globalScope[objectList[i]][j].isHover()) {
                            ele.style.display = 'block'
                            if (objectList[i] === 'SubCircuit') {
                                ele.innerHTML = `Subcircuit: ${globalScope.SubCircuit[j].data.name}`
                            } else {
                                ele.innerHTML = `CircuitElement: ${objectList[i]}`
                            }
                            return
                        }
                    }
                }
            }

            ele.style.display = 'none'
            document.getElementById('elementName').innerHTML = ''
        })

    window.addEventListener('mousemove', (e) => {
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
        if (simulationAreaStore.lastSelected == globalScope.root) {
            updateCanvasSet(true)
            var fn
            fn = function () {
                updateSelectionsAndPane()
            }
            scheduleUpdate(0, 20, fn)
        } else {
            scheduleUpdate(0, 200)
        }
    })
    window.addEventListener('keydown', (e) => {
        errorDetectedSet(false)
        updateSimulationSet(true)
        updatePositionSet(true)

        // zoom in (+)
        if (e.key == 'Meta' || e.key == 'Control') {
            simulationAreaStore.controlDown = true
        }

        if (
            simulationAreaStore.controlDown &&
            (e.keyCode == 187 || e.KeyCode == 171)
        ) {
            e.preventDefault()
            ZoomIn()
        }

        // zoom out (-)
        if (
            simulationAreaStore.controlDown &&
            (e.keyCode == 189 || e.Keycode == 173)
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

        if (
            simulationAreaStore.lastSelected &&
            simulationAreaStore.lastSelected.keyDown
        ) {
            if (
                e.key.toString().length == 1 ||
                e.key.toString() == 'Backspace'
            ) {
                simulationAreaStore.lastSelected.keyDown(e.key.toString())
                return
            }
        }
        if (
            simulationAreaStore.lastSelected &&
            simulationAreaStore.lastSelected.keyDown2
        ) {
            if (e.key.toString().length == 1) {
                simulationAreaStore.lastSelected.keyDown2(e.key.toString())
                return
            }
        }

        // if (simulationAreaStore.lastSelected && simulationAreaStore.lastSelected.keyDown3) {
        //     if (e.key.toString() != "Backspace" && e.key.toString() != "Delete") {
        //         simulationAreaStore.lastSelected.keyDown3(e.key.toString());
        //         return;
        //     }

        // }

        if (e.key == 'T' || e.key == 't') {
            simulationAreaStore.changeClockTime(prompt('Enter Time:'))
        }
    })
    document
        .getElementById('simulationArea')
        .addEventListener('dblclick', (e) => {
            scheduleUpdate(2)
            if (
                simulationAreaStore.lastSelected &&
                simulationAreaStore.lastSelected.dblclick !== undefined
            ) {
                simulationAreaStore.lastSelected.dblclick()
            }
        })

    window.addEventListener('mouseup', (e) => {
        simulationAreaStore.mouseDown = false
        errorDetectedSet(false)
        updateSimulationSet(true)
        updatePositionSet(true)
        updateCanvasSet(true)
        gridUpdateSet(true)
        wireToBeCheckedSet(1)

        scheduleUpdate(1)
    })
    window.addEventListener('mousedown', function (e) {
        this.focus()
    })

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
        var scrolledUp = deltaY < 0
        var scrolledDown = deltaY > 0

        if (event.ctrlKey) {
            if (scrolledUp && globalScope.scale > 0.5 * DPR) {
                changeScale(-0.1 * DPR)
            }
            if (scrolledDown && globalScope.scale < 4 * DPR) {
                changeScale(0.1 * DPR)
            }
        } else {
            if (scrolledUp && globalScope.scale < 4 * DPR) {
                changeScale(0.1 * DPR)
            }
            if (scrolledDown && globalScope.scale > 0.5 * DPR) {
                changeScale(-0.1 * DPR)
            }
        }

        updateCanvasSet(true)
        gridUpdateSet(true)
        update() // Schedule update not working, this is INEFFICENT
    }
}

var isIe =
    navigator.userAgent.toLowerCase().indexOf('msie') != -1 ||
    navigator.userAgent.toLowerCase().indexOf('trident') != -1
