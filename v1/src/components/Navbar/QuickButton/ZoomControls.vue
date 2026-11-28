<template>
  <div class="zoom-slider">
    <button class="zoom-slider-decrement" @click="decrement">-</button>
    <input
      type="range"
      class="custom-range"
      min="0"
      :max="maxZoomLevel"
      step="1"
      v-model.number="zoomLevel"
      @input="onSliderChange"
    />
    <span id="slider_value"></span>
    <button class="zoom-slider-increment" @click="increment">+</button>
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import { changeScale } from "../../../simulator/src/canvasApi";
import { updateCanvasSet, gridUpdateSet } from "../../../simulator/src/engine";
import { layoutModeGet } from "../../../simulator/src/layoutMode";
import {
  zoomLevel,
  maxZoomLevel,
  getMaxZoomLevel,
  getCurLevel,
  setCurLevel,
  syncZoomSlider,
  increment,
  decrement,
} from "../../../simulator/src/commands/zoom";

const onSliderChange = () => {
  const changeInScale = zoomLevel.value - getCurLevel();
  updateCanvasSet(true);
  changeScale(changeInScale * 0.1, "zoomButton", "zoomButton", 3);
  gridUpdateSet(true);
  if (layoutModeGet()) setCurLevel(zoomLevel.value);
  else syncZoomSlider();
};

onMounted(() => {
  maxZoomLevel.value = getMaxZoomLevel();
});
</script>

<style scoped>
.zoom-slider {
  color: white;
  font-size: 20px;
  padding-top: 0.2rem;
  display: inline-block;
}

.zoom-slider-decrement {
  position: relative;
  padding-right: 4px;
  bottom: 0.3rem;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  outline: none;
}
.zoom-slider-increment {
  position: relative;
  padding-left: 4px;
  bottom: 0.3rem;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  outline: none;
}
.zoom-slider-increment {
  position: relative;
  padding-left: 4px;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  outline: none;
}

.custom-range {
  width: var(--zoom-range-width, 80px) !important;
}
.custom-range::-moz-range-track {
  height: 1px;
}

.custom-range::-moz-range-thumb {
  width: 10px;
  height: 10px;
  background-color: white;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
}
.custom-range:focus::-moz-range-thumb {
  box-shadow:
    0 0 0 1px #fff,
    0 0 0 0.2rem rgba(75, 86, 99, 0.25);
}

input[type="range"] {
  -webkit-appearance: none;
}

input[type="range"]::-webkit-slider-runnable-track {
  height: 1px;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 10px;
  height: 10px;
  background-color: white;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
}
</style>

