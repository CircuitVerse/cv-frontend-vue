<template>
  <div class="zoom-slider">
    <button class="zoom-slider-decrement" @click="decrement">-</button>
    <input
      type="range"
      class="custom-range"
      min="0"
      max="45"
      step="1"
      v-model.number="zoomLevel"
      @input="onSliderChange"
    />
    <span id="slider_value"></span>
    <button class="zoom-slider-increment" @click="increment">+</button>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from "vue";
import { changeScale } from "../../../simulator/src/canvasApi";
import { updateCanvasSet, gridUpdateSet } from "../../../simulator/src/engine";

const zoomLevel = ref(5);
let curLevel = 5;

const onSliderChange = () => {
  const changeInScale = zoomLevel.value - curLevel;
  updateCanvasSet(true);
  changeScale(changeInScale * 0.1, "zoomButton", "zoomButton", 3);
  gridUpdateSet(true);
  curLevel = zoomLevel.value;
};

const decrement = () => {
  if (zoomLevel.value > 0) {
    zoomLevel.value--;
    onSliderChange();
  }
};

const increment = () => {
  if (zoomLevel.value < 45) {
    zoomLevel.value++;
    onSliderChange();
  }
};

// Sync UI slider if user zooms canvas with mouse wheel
const handleWheel = (e: WheelEvent | any) => {
  const deltaY = e.type === "wheel" ? -e.deltaY : -e.detail;
  if (deltaY === 0) return;
  const directionY = Math.sign(deltaY);
  if (directionY > 0 && zoomLevel.value < 45) zoomLevel.value++;
  else if (directionY < 0 && zoomLevel.value > 0) zoomLevel.value--;
  curLevel = zoomLevel.value;
};

onMounted(() => {
  const simArea = document.getElementById("simulationArea");
  if (simArea) {
    simArea.addEventListener("wheel", handleWheel);
    simArea.addEventListener("DOMMouseScroll", handleWheel);
  }
});

onUnmounted(() => {
  const simArea = document.getElementById("simulationArea");
  if (simArea) {
    simArea.removeEventListener("wheel", handleWheel);
    simArea.removeEventListener("DOMMouseScroll", handleWheel);
  }
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

