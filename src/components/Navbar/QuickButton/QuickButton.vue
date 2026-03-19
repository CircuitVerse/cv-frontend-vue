<template>
    <div class="quick-btn" id='quick-btn-id' @ondragover="dragover">
        <div id="dragQPanel" class="panel-drag">
            <!-- <DragSvgDots /> -->
            <div class="drag-dot-svg"></div>
        </div>
        <div>
            <button
                type="button"
                class="quick-btn-save-online"
                title="Save Online"
                @click="saveOnline"
            ></button>
        </div>
        <div>
            <button
                type="button"
                class="quick-btn-save"
                title="Save Offline"
                @click="saveOffline"
            ></button>
        </div>
        <div>
            <button
                type="button"
                class="quick-btn-delete"
                title="Delete Selected"
                @click="deleteSelectedItem"
            ></button>
        </div>
        <div>
            <button
                type="button"
                class="quick-btn-download"
                title="Download as Image"
                @click="createSaveAsImgPrompt"
            ></button>
        </div>
        <div>
            <button
                type="button"
                class="quick-btn-zoom-fit"
                title="Fit to Screen"
                @click="zoomToFit"
            ></button>
        </div>
        <div>
            <button
                type="button"
                class="quick-btn-undo"
                title="Undo"
                @click="undoit"
            ></button>
        </div>
        <div>
            <button
                type="button"
                class="quick-btn-redo"
                title="Redo"
                @click="redoit"
            ></button>
        </div>
        <div>
            <button
                type="button"
                class="quick-btn-view"
                title="Preview Circuit"
                @click="view"
            >
                <i style="color: #ddd" class="fas fa-expand-arrows-alt"></i>
            </button>
        </div>
        <!-- Zoom controls: +/- buttons -->
        <div class="zoom-controls">
            <button class="zoom-button-decrement" @click="decrement" title="Zoom Out">−</button>
            <button class="zoom-button-increment" @click="increment" title="Zoom In">+</button>
        </div>
    </div>
    <div id="exitView"></div>
</template>

<script lang="ts" setup>
import { saveOnline, saveOffline, deleteSelectedItem, createSaveAsImgPrompt, zoomToFit, undoit, redoit, view, increment, decrement } from './QuickButton'

function dragover(): void {
    const quickBtn: HTMLElement | null = document.querySelector('.quick-btn')
    if (quickBtn) {
        quickBtn.style.boxShadow = 'none'
        quickBtn.style.background = 'var(--bg-navbar)'
    }
}
</script>

<style>
/* @import url('./QuickButton.css'); */

.panel-drag {
    cursor: move;
    opacity: 0.6;
    /* display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr 1fr 1fr 1fr;
  padding: 6px 0;
  width: 1px; */
}
.quick-btn {
    background: var(--bg-navbar);
    border-top: 1.5px solid var(--qp-br-tl);
    border-left: 1.5px solid var(--qp-br-tl);
    border-right: 1.5px solid var(--qp-br-rd);
    border-bottom: 1.5px solid var(--qp-br-rd);
}

.quick-btn {
    display: flex;
    position: absolute;
    width: 400px;
    height: 33px;
    top: 90px;
    right: 280px;
    border-radius: 7px;
    z-index: 100;
}

.quick-btn > div {
    margin: auto;
}

.quick-btn > div > button {
    margin: auto;
    border: none;
}

.drag-dot-svg {
    width: 12px;
    height: 20px;
    background: url(../../../styles/css/assets/shortcuts/dragDots.svg)
        center/contain;
    display: block;
    margin-left: 4px;
}

.quick-btn-save-online {
    background: url(../../../styles/css/assets/shortcuts/save-online.svg)
        center/cover;
    width: 21.43px;
    height: 15.2px;
    display: block;
}

.quick-btn-save {
    background: url(../../../styles/css/assets/shortcuts/save.svg) center/cover;
    width: 15.2px;
    height: 15.2px;
    display: block;
}

.quick-btn-delete {
    background: url(../../../styles/css/assets/shortcuts/delete.svg) center/cover;
    width: 20px;
    height: 15.2px;
    display: block;
}

.quick-btn-download {
    background: url(../../../styles/css/assets/shortcuts/download.svg)
        center/cover;
    width: 15.2px;
    height: 15.2px;
    display: block;
}

.quick-btn-zoom-fit {
    background: url(../../../styles/css/assets/shortcuts/fit.svg) center/cover;
    width: 15.2px;
    height: 15.2px;
    display: block;
}

.quick-btn-undo {
    background: url(../../../styles/css/assets/shortcuts/undo.svg) center/cover;
    width: 15.2px;
    height: 16.2px;
    display: block;
}

.quick-btn-redo {
    background: url(../../../styles/css/assets/shortcuts/redo.svg) center/cover;
    width: 15.2px;
    height: 16.2px;
    display: block;
}

.quick-btn-view {
    color: white
}

/* Zoom controls with slider (1-100% display) */
.zoom-controls {
    display: flex;
    gap: 8px;
    align-items: center;
}

.zoom-button-decrement,
.zoom-button-increment {
    background: transparent;
    color: white;
    border: none;
    cursor: pointer;
    font-size: 20px;
    font-weight: bold;
    padding: 0 6px;
    line-height: 1;
    min-width: 24px;
}

.zoom-button-decrement:hover,
.zoom-button-increment:hover {
    opacity: 0.7;
}

.zoom-slider {
    width: 100px;
    height: 5px;
    -webkit-appearance: none;
    appearance: none;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
    outline: none;
    cursor: pointer;
}

.zoom-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    background: white;
    border-radius: 50%;
    cursor: pointer;
    transition: background 0.15s ease-in-out;
}

.zoom-slider::-webkit-slider-thumb:hover {
    background: #ddd;
}

.zoom-slider::-moz-range-thumb {
    width: 14px;
    height: 14px;
    background: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    transition: background 0.15s ease-in-out;
}

.zoom-slider::-moz-range-thumb:hover {
    background: #ddd;
}

.zoom-label {
    color: white;
    font-size: 12px;
    font-weight: 500;
    min-width: 40px;
    text-align: right;
}

@media (max-width: 991px) {
    .quick-btn-save-online {
        background: url(../../../styles/css/assets/shortcuts/save-online.svg) center/cover;
        width: 25.45px;
        height: 17.85px;
        display: block;
    }

    .quick-btn-save {
        background: url(../../../styles/css/assets/shortcuts/save.svg) center/cover;
        width: 19px;
        height: 19px;
        display: block;
    }

    .quick-btn-delete {
        background: url(../../../styles/css/assets/shortcuts/delete.svg) center/cover;
        width: 25px;
        height: 19px;
        display: block;
    }

    .quick-btn-download {
        background: url(../../../styles/css/assets/shortcuts/download.svg) center/cover;
        width: 19px;
        height: 19px;
        display: block;
    }

    .quick-btn-zoom-fit {
        background: url(../../../styles/css/assets/shortcuts/fit.svg) center/cover;
        width: 19px;
        height: 19px;
        display: block;
    }

    .quick-btn-undo {
        background: url(../../../styles/css/assets/shortcuts/undo.svg) center/cover;
        width: 19px;
        height: 20.25px;
        display: block;
    }

    .quick-btn-redo {
        background: url(../../../styles/css/assets/shortcuts/redo.svg) center/cover;
        width: 19px;
        height: 20.25px;
        display: block;
    }

    .quick-btn-timing {
        font-size: 1.2rem;
    }

    .quick-btn-view {
        font-size: 1.25rem;
    }
}
</style>
