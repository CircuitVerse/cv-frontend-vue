<template>
    <canvas
        id="simulationArea"
        style="
            position: absolute;
            left: 0;
            top: 0;
            z-index: 1;
            width: 100%;
            height: 100%;
        "
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
        @dblclick="onDoubleClickorTap"
        @wheel="onCanvasWheel"
    ></canvas>
</template>

<script lang="ts" setup>
import { simulationArea } from '#/simulator/src/simulationArea'
import {
    panStart,
    panMove,
    panStop,
    onCanvasMouseUp,
    onCanvasWheel,
    onDoubleClickorTap,
} from '#/simulator/src/commands/pointer'

// `simulationArea.touch` tells the pointer commands (and circuitElement.js)
// whether to read coordinates from `e.touches` or `e.clientX/Y`.

function onMouseDown(e: MouseEvent) {
    simulationArea.touch = false
    panStart(e)
}

function onMouseMove(e: MouseEvent) {
    simulationArea.touch = false
    panMove(e)
}

function onMouseUp(e: MouseEvent) {
    simulationArea.touch = false
    panStop(e)
    onCanvasMouseUp()
}

function onTouchStart(e: TouchEvent) {
    simulationArea.touch = true
    panStart(e)
}

function onTouchMove(e: TouchEvent) {
    simulationArea.touch = true
    panMove(e)
}

function onTouchEnd(e: TouchEvent) {
    simulationArea.touch = true
    panStop(e)
}
</script>
