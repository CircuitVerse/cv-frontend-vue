/* eslint-disable import/no-cycle */
// Listeners when circuit is embedded
/* eslint-disable no-plusplus */
/* eslint-disable func-names */
/* eslint-disable prefer-const */
/* eslint-disable max-len */
// Refer listeners.js
import { simulationArea } from './simulationArea';
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
import { changeScale } from './canvasApi';
import { ZoomIn, ZoomOut, pinchZoom, getCoordinate } from './listeners';

declare const globalScope: any;
declare const DPR: any;
declare const width: any;
declare const height: any;

const unit: number = 10;
let embedCoordinate: any;

/** *Function embedPanStart
    *This function hepls to initialize mouse and touch
    *For now variable name starts with mouse like mouseDown are used both
     touch and mouse will change in future
*/
function embedPanStart(e: any): void {
    embedCoordinate = getCoordinate(e);
    errorDetectedSet(false);
    updateSimulationSet(true);
    updatePositionSet(true);
    updateCanvasSet(true);

    simulationArea.lastSelected = undefined as any;
    simulationArea.selected = false;
    simulationArea.hover = undefined as any;
    const rect = (simulationArea as any).canvas.getBoundingClientRect();
    (simulationArea as any).mouseDownRawX = (embedCoordinate.x - rect.left) * (DPR as any);
    (simulationArea as any).mouseDownRawY = (embedCoordinate.y - rect.top) * (DPR as any);
    (simulationArea as any).mouseDownX = Math.round((((simulationArea as any).mouseDownRawX - (globalScope as any).ox) / (globalScope as any).scale) / unit) * unit;
    (simulationArea as any).mouseDownY = Math.round((((simulationArea as any).mouseDownRawY - (globalScope as any).oy) / (globalScope as any).scale) / unit) * unit;
    (simulationArea as any).mouseDown = true;
    (simulationArea as any).oldx = (globalScope as any).ox;
    (simulationArea as any).oldy = (globalScope as any).oy;
    e.preventDefault();
    scheduleUpdate(1);
}
/** *Function embedPanMove
    *This function hepls to move simulator and its elements using touch and mouse
    *For now variable name starts with mouse like mouseDown are used both
     touch and mouse will change in future
*/
function embedPanMove(e: any): void {
    embedCoordinate = getCoordinate(e);
    if (!simulationArea.touch || e.touches.length === 1) {
        const rect = (simulationArea as any).canvas.getBoundingClientRect();
        (simulationArea as any).mouseRawX = (embedCoordinate.x - rect.left) * (DPR as any);
        (simulationArea as any).mouseRawY = (embedCoordinate.y - rect.top) * (DPR as any);
        (simulationArea as any).mouseXf = ((simulationArea as any).mouseRawX - (globalScope as any).ox) / (globalScope as any).scale;
        (simulationArea as any).mouseYf = ((simulationArea as any).mouseRawY - (globalScope as any).oy) / (globalScope as any).scale;
        (simulationArea as any).mouseX = Math.round((simulationArea as any).mouseXf / unit) * unit;
        (simulationArea as any).mouseY = Math.round((simulationArea as any).mouseYf / unit) * unit;
        updateCanvasSet(true);
        if ((simulationArea as any).lastSelected == (globalScope as any).root) {
            updateCanvasSet(true);
            let fn: any;
            fn = function () {
                updateSelectionsAndPane();
            };
            scheduleUpdate(0, 20, fn);
        } else {
            scheduleUpdate(0, 200);
        }
    }
    if (simulationArea.touch && e.touches.length === 2) {
        pinchZoom(e);
    }
}
/** *Function embedPanEnd
    *This function update simulator after mouse and touch end
    *For now variable name starts with mouse like mouseDown are used both
     touch and mouse will change in future
*/
function embedPanEnd(): void {
    (simulationArea as any).mouseDown = false;
    errorDetectedSet(false);
    updateSimulationSet(true);
    updatePositionSet(true);
    updateCanvasSet(true);
    gridUpdateSet(true);
    wireToBeCheckedSet(1);
    scheduleUpdate(1);
}
/** *Function BlockElementPan
    *This function block the pan of elements since in embed simulator you can only view simulator NOT update
*/

function BlockElementPan(): void {
    const ele = document.getElementById('elementName');
    if (globalScope && simulationArea && simulationArea.objectList) {
        let { objectList } = simulationArea;
        objectList = objectList.filter((val: any) => val !== 'wires');
        for (let i = 0; i < objectList.length; i++) {
            for (let j = 0; j < globalScope[objectList[i]].length; j++) {
                if (globalScope[objectList[i]][j].isHover()) {
                    ele!.style.display = 'block';
                    if (objectList[i] === 'SubCircuit') {
                        ele!.innerHTML = `Subcircuit: ${globalScope.SubCircuit[j].data.name}`;
                    } else {
                        ele!.innerHTML = `CircuitElement: ${objectList[i]}`;
                    }
                    return;
                }
            }
        }
    }
    ele!.style.display = 'none';
    document.getElementById('elementName')!.innerHTML = '';
}

export default function startListeners(): void {
    window.addEventListener('keyup', (e: any) => {
        scheduleUpdate(1);
        if (e.keyCode == 16) {
            simulationArea.shiftDown = false;
        }
        if (e.key == 'Meta' || e.key == 'Control') {
            simulationArea.controlDown = false;
        }
    });
    // All event listeners starts from here
    document.getElementById('simulationArea')!.addEventListener('mousedown', (e: any) => {
        simulationArea.touch = false;
        embedPanStart(e);
    });
    document.getElementById('simulationArea')!.addEventListener('mousemove', () => {
        simulationArea.touch = false;
        BlockElementPan();
    });
    document.getElementById('simulationArea')!.addEventListener('touchstart', (e: any) => {
        simulationArea.touch = true;
        embedPanStart(e);
    });
    document.getElementById('simulationArea')!.addEventListener('touchmove', () => {
        simulationArea.touch = true;
        BlockElementPan();
    });
    window.addEventListener('mousemove', (e: any) => {
        embedPanMove(e);
    });
    window.addEventListener('touchmove', (e: any) => {
        embedPanMove(e);
    });
    window.addEventListener('mouseup', () => {
        embedPanEnd();
    });
    window.addEventListener('mousedown', function () {
        this.focus();
    });
    window.addEventListener('touchend', () => {
        embedPanEnd();
    });
    window.addEventListener('touchstart', function () {
        this.focus();
    });
    document.getElementById('simulationArea')!.addEventListener('mousewheel', MouseScroll);
    document.getElementById('simulationArea')!.addEventListener('DOMMouseScroll', MouseScroll);

    window.addEventListener('keydown', (e: any) => {
        errorDetectedSet(false);
        updateSimulationSet(true);
        updatePositionSet(true);

        // zoom in (+)
        if (e.key == 'Meta' || e.key == 'Control') {
            simulationArea.controlDown = true;
        }
        if (simulationArea.controlDown && (e.keyCode == 187 || e.KeyCode == 171)) {
            e.preventDefault();
            ZoomIn();
        }
        // zoom out (-)
        if (simulationArea.controlDown && (e.keyCode == 189 || e.Keycode == 173)) {
            e.preventDefault();
            ZoomOut();
        }

        if (simulationArea.mouseRawX < 0 || simulationArea.mouseRawY < 0 || simulationArea.mouseRawX > width || simulationArea.mouseRawY > height) return;

        scheduleUpdate(1);
        updateCanvasSet(true);

        if (simulationArea.lastSelected && simulationArea.lastSelected.keyDown) {
            if (e.key.toString().length == 1 || e.key.toString() == 'Backspace') {
                simulationArea.lastSelected.keyDown(e.key.toString());
                return;
            }
        }
        if (simulationArea.lastSelected && simulationArea.lastSelected.keyDown2) {
            if (e.key.toString().length == 1) {
                simulationArea.lastSelected.keyDown2(e.key.toString());
                return;
            }
        }

        // if (simulationArea.lastSelected && simulationArea.lastSelected.keyDown3) {
        //     if (e.key.toString() != "Backspace" && e.key.toString() != "Delete") {
        //         simulationArea.lastSelected.keyDown3(e.key.toString());
        //         return;
        //     }

        // }

        if (e.key == 'T' || e.key == 't') {
            const input = prompt('Enter Time:');
            if (input !== null) {
                simulationArea.changeClockTime?.(Number(input));
            }

        }
    });
    document.getElementById('simulationArea')!.addEventListener('dblclick', () => {
        scheduleUpdate(2);
        if (simulationArea.lastSelected && simulationArea.lastSelected.dblclick !== undefined) {
            simulationArea.lastSelected.dblclick();
        }
    });
    function MouseScroll(event: any): void {
        updateCanvasSet(true);

        event.preventDefault();
        const deltaY = event.wheelDelta ? event.wheelDelta : -event.detail;
        const scrolledUp = deltaY < 0;
        const scrolledDown = deltaY > 0;

        if (event.ctrlKey) {
            if (scrolledUp && globalScope.scale > 0.5 * DPR) {
                changeScale(-0.1 * DPR);
            }
            if (scrolledDown && globalScope.scale < 4 * DPR) {
                changeScale(0.1 * DPR);
            }
        } else {
            if (scrolledUp && globalScope.scale < 4 * DPR) {
                changeScale(0.1 * DPR);
            }
            if (scrolledDown && globalScope.scale > 0.5 * DPR) {
                changeScale(-0.1 * DPR);
            }
        }

        updateCanvasSet(true);
        gridUpdateSet(true);
        update(); // Schedule update not working, this is INEFFICENT
    }
}

// eslint-disable-next-line no-unused-vars
var isIe =
    navigator.userAgent.toLowerCase().indexOf('msie') != -1 ||
    navigator.userAgent.toLowerCase().indexOf('trident') != -1;