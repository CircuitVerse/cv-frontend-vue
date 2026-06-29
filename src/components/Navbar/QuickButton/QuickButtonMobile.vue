<template>
  <div class="quick-mobile">
    <div class="quick-btn-mobile">
      <div class="btn-container">
          <button
              type="button"
              class="quick-btn-save-online"
              title="Save Online"
              @click="saveOnline"
          ></button>
      </div>
      <div class="btn-container">
          <button
              type="button"
              class="quick-btn-save"
              title="Save Offline"
              @click="saveOffline"
          ></button>
      </div>
      <div class="btn-container">
          <button
              type="button"
              class="quick-btn-delete"
              title="Delete Selected"
              @click="deleteSelectedItem"
          ></button>
      </div>
      <div class="btn-container">
          <button
              type="button"
              class="quick-btn-download"
              title="Download as Image"
              @click="createSaveAsImgPrompt"
          ></button>
      </div>
      <div class="btn-container">
          <button
              type="button"
              class="quick-btn-zoom-fit"
              title="Fit to Screen"
              @click="zoomToFit"
          ></button>
      </div>
      <div class="btn-container">
          <button
              type="button"
              class="quick-btn-undo"
              title="Undo"
              @click="undoit"
          ></button>
      </div>
      <div class="btn-container">
          <button
              type="button"
              class="quick-btn-redo"
              title="Redo"
              @click="redoit"
          ></button>
      </div>
      <div class="btn-container">
          <button
              type="button"
              class="quick-btn-view"
              title="Preview Circuit"
              @click="view"
          >
          <i :style="{ color: '#ddd', transform: simulatorMobileStore.showMobileView ? 'scale(1)' : 'scale(1.25)' }" class="fas fa-expand-arrows-alt"></i>
          </button>
      </div>
      <div class="btn-container">
          <button
              type="button"
              class="quick-btn-timing"
              @mousedown="simulatorMobileStore.showTimingDiagram = !simulatorMobileStore.showTimingDiagram"
          >
          <i :style="{ transform: simulatorMobileStore.showMobileView ? 'scale(1)' : 'scale(1.25)' }" class="fa-solid fa-timeline"></i>
          </button>
    </div>
    <nav class="navbar mobile-nav navbar-expand-lg navbar-dark">
      <Hamburger2 v-if="simulatorMobileStore.showMobileView" :navbar-data="navbarData" />
    </nav>
    </div>
    <!-- Zoom controls: +/- buttons -->
    <div class="slider-container">
      <div class="zoom-controls">
          <button class="zoom-button-decrement" @click="decrement" title="Zoom Out">−</button>
          <button class="zoom-button-increment" @click="increment" title="Zoom In">+</button>
      </div>
  </div>
  </div>
  <div id="exitView"></div>
</template>

<script lang="ts" setup>
import Hamburger2 from '../Hamburger/Hamburger2.vue'
import navbarData from '../../../assets/constants/Navbar/NAVBAR_DATA.json'
import { useSimulatorMobileStore } from '../../../store/simulatorMobileStore'
import { saveOnline, saveOffline, deleteSelectedItem, createSaveAsImgPrompt, zoomToFit, undoit, redoit, view, increment, decrement } from './QuickButton'

const simulatorMobileStore = useSimulatorMobileStore()
</script>

<style scoped>
/* @import url('./QuickButton.css'); */

.mobile-nav {
  padding: 0 0 !important;
}

.slider-container {
  display: flex;
  justify-content: center;
}

.quick-btn-mobile {
  background: var(--bg-navbar);
  border-top: 1.5px solid var(--qp-br-tl);
  border-left: 1.5px solid var(--qp-br-tl);
  border-right: 1.5px solid var(--qp-br-rd);
  border-bottom: 1.5px solid var(--qp-br-rd);
}

.quick-btn-mobile {
  display: flex;
  align-items: center;
  z-index: 99;
  justify-content: space-between;
  padding: 0 1.5rem;
}

.quick-btn-mobile > div > button {
  border: none;
}

.quick-mobile {
  display: flex;
  flex-direction: column;
  background: var(--bg-navbar);
}

.btn-container {
  padding: 0.75rem 0;
}

.quick-btn-view, .quick-btn-timing {
  color: white;
}

/* Zoom controls with slider (1-100% display) */
.zoom-controls {
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: center;
  padding: 0.5rem 0;
}

.zoom-button-decrement,
.zoom-button-increment {
  background: transparent;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 24px;
  font-weight: bold;
  padding: 0 8px;
  line-height: 1;
  min-width: 32px;
}

.zoom-button-decrement:hover,
.zoom-button-increment:hover {
  opacity: 0.7;
}

.zoom-slider {
  width: 120px;
  height: 6px;
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
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.15s ease-in-out;
}

.zoom-slider::-webkit-slider-thumb:hover {
  background: #ddd;
}

.zoom-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
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
  font-size: 14px;
  font-weight: 500;
  min-width: 45px;
  text-align: right;
}

@media (max-width: 768px) {
  .quick-btn-mobile {
    padding: 0 0.75rem;
  }
}
</style>
