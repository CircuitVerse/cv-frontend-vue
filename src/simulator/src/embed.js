// Helper functions for when circuit is embedded
import { scopeList, circuitProperty } from './circuit';
import simulationArea from './simulationArea';
import {
    scheduleUpdate,
    wireToBeCheckedSet,
    updateCanvasSet,
    gridUpdateSet,
} from './engine';
import { prevPropertyObjGet, prevPropertyObjSet } from './ux';
import { ZoomIn, ZoomOut } from './listeners';

document.addEventListener('DOMContentLoaded', () => {
    const simulationElements = simulationArea.elements;
    const clockProperty = simulationElements && simulationElements.clockProperty;
    if (clockProperty) {
        // Clock features
        clockProperty.insertAdjacentHTML(
            'beforeend',
            `<input type='button' class='objectPropertyAttributeEmbed custom-btn--secondary embed-fullscreen-btn' name='toggleFullScreen' value='Full Screen'> </input>`
        );
        clockProperty.insertAdjacentHTML(
            'beforeend',
            `<div>Time: <input class='objectPropertyAttributeEmbed' min='50' type='number' style='width:48px' step='10' name='changeClockTime'  value='${simulationArea.timePeriod}'></div>`
        );
        clockProperty.insertAdjacentHTML(
            'beforeend',
            `<div>Clock: <label class='switch'> <input type='checkbox' ${
                ['', 'checked'][simulationArea.clockEnabled + 0]
            } class='objectPropertyAttributeEmbedChecked' name='changeClockEnable' > <span class='slider'></span> </label><div>`
        );

        // Clock event listeners
        clockProperty.addEventListener('change', handleClockChange);
        clockProperty.addEventListener('keyup', handleClockChange);
        clockProperty.addEventListener('paste', handleClockChange);
        clockProperty.addEventListener('click', handleClockChange);
    }
    
    const zoomInButton = document.getElementById('zoom-in-embed');
    if (zoomInButton) {
        zoomInButton.addEventListener('click', ZoomIn);
    }
    
    const zoomOutButton = document.getElementById('zoom-out-embed');
    if (zoomOutButton) {
        zoomOutButton.addEventListener('click', ZoomOut);
    }
    
});

function handleClockChange(event) {
    scheduleUpdate();
    updateCanvasSet(true);
    wireToBeCheckedSet(1);
    const name = event.target.name;
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    if (simulationArea.lastSelected && simulationArea.lastSelected[name]) {
        prevPropertyObjSet(simulationArea.lastSelected[name](value)) || prevPropertyObjGet();
    } else {
        circuitProperty[name](value);
    }
}
// Full screen toggle helper function
function toggleFullScreen(value) {
    if (!getfullscreenelement()) {
        GoInFullscreen(document.documentElement)
    } else {
        GoOutFullscreen()
    }
}
// Center focus accordingly
function exitHandler() {
    setTimeout(() => {
        Object.keys(scopeList).forEach((id) => {
            scopeList[id].centerFocus(true)
        })
        gridUpdateSet(true)
        scheduleUpdate()
    }, 100)
}

function GoInFullscreen(element) {
    if (element.requestFullscreen) {
        element.requestFullscreen()
    } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen()
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen()
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen()
    }
}

function GoOutFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen()
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen()
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen()
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen()
    }
}

function getfullscreenelement() {
    return (
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
    )
}

// Full screen Listeners
if (document.addEventListener) {
    document.addEventListener('webkitfullscreenchange', exitHandler, false)
    document.addEventListener('mozfullscreenchange', exitHandler, false)
    document.addEventListener('fullscreenchange', exitHandler, false)
    document.addEventListener('MSFullscreenChange', exitHandler, false)
}
