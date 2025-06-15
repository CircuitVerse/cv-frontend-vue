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
        <div class="zoom-slider">
            <button class="zoom-slider-decrement" @click="decrement">-</button>
            <input
                id="customRange1"
                type="range"
                class="custom-range"
                min="0"
                max="45"
                step="1"
            />
            <span id="slider_value"></span>
            <button class="zoom-slider-increment" @click="increment">+</button>
        </div>
    </div>
    <div id="exitView"></div>
</template>

<script lang="ts" setup>
import { saveOnline, saveOffline, deleteSelectedItem, createSaveAsImgPrompt, zoomToFit, undoit, redoit, view, decrement, increment } from './QuickButton';

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
    background: url(../../../styles/css/assets/shorcuts/dragDots.svg)
        center/contain;
    display: block;
    margin-left: 4px;
}

.quick-btn-save-online {
    background: url(../../../styles/css/assets/shorcuts/save-online.svg)
        center/cover;
    width: 21.43px;
    height: 15.2px;
    display: block;
}

.quick-btn-save {
    background: url(../../../styles/css/assets/shorcuts/save.svg) center/cover;
    width: 15.2px;
    height: 15.2px;
    display: block;
}

.quick-btn-delete {
    background: url(../../../styles/css/assets/shorcuts/delete.svg) center/cover;
    width: 20px;
    height: 15.2px;
    display: block;
}

.quick-btn-download {
    background: url(../../../styles/css/assets/shorcuts/download.svg)
        center/cover;
    width: 15.2px;
    height: 15.2px;
    display: block;
}

.quick-btn-zoom-fit {
    background: url(../../../styles/css/assets/shorcuts/fit.svg) center/cover;
    width: 15.2px;
    height: 15.2px;
    display: block;
}

.quick-btn-undo {
    background: url(../../../styles/css/assets/shorcuts/undo.svg) center/cover;
    width: 15.2px;
    height: 16.2px;
    display: block;
}

.quick-btn-redo {
    background: url(../../../styles/css/assets/shorcuts/redo.svg) center/cover;
    width: 15.2px;
    height: 16.2px;
    display: block;
}

.quick-btn-view {
    color: white
}

.zoom-slider {
    color: white;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 2px;
    font-weight: 500;
}

.zoom-slider-decrement,
.zoom-slider-increment {
    background: none;
    color: white;
    border: none;
    font-size: 14px;
    font-weight: 500;
    line-height: 1;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    opacity: 0.8;
    transition: opacity 0.2s;
}

.zoom-slider-decrement:hover,
.zoom-slider-increment:hover {
    opacity: 1;
}

.custom-range {
    width: 100px !important;
    margin: 0 4px;
    height: 16px;
}

.custom-range::-moz-range-track {
    height: 2px;
    background: rgba(255, 255, 255, 0.4);
    border: none;
    border-radius: 1px;
}

.custom-range::-moz-range-thumb {
    width: 12px;
    height: 12px;
    background-color: white;
    border: 0;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
}

.custom-range:focus::-moz-range-thumb {
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
    outline: none;
}

input[type='range'] {
    -webkit-appearance: none;
    background: transparent;
    cursor: pointer;
    outline: none;
}

input[type='range']::-webkit-slider-runnable-track {
    height: 2px;
    background: white;
    border-radius: 1px;
    border: none;
}

input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    background-color: white;
    border: 0;
    border-radius: 50%;
    cursor: pointer;
    margin-top: -5px;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
    transition: box-shadow 0.2s;
}

input[type='range']:focus::-webkit-slider-thumb {
    outline: none;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
}

@media (max-width: 991px) {
    .quick-btn-save-online {
        background: url(../../../styles/css/assets/shorcuts/save-online.svg) center/cover;
        width: 25.45px;
        height: 17.85px;
        display: block;
    }

    .quick-btn-save {
        background: url(../../../styles/css/assets/shorcuts/save.svg) center/cover;
        width: 19px;
        height: 19px;
        display: block;
    }

    .quick-btn-delete {
        background: url(../../../styles/css/assets/shorcuts/delete.svg) center/cover;
        width: 25px;
        height: 19px;
        display: block;
    }

    .quick-btn-download {
        background: url(../../../styles/css/assets/shorcuts/download.svg) center/cover;
        width: 19px;
        height: 19px;
        display: block;
    }

    .quick-btn-zoom-fit {
        background: url(../../../styles/css/assets/shorcuts/fit.svg) center/cover;
        width: 19px;
        height: 19px;
        display: block;
    }

    .quick-btn-undo {
        background: url(../../../styles/css/assets/shorcuts/undo.svg) center/cover;
        width: 19px;
        height: 20.25px;
        display: block;
    }

    .quick-btn-redo {
        background: url(../../../styles/css/assets/shorcuts/redo.svg) center/cover;
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