<template>
    <div class="timing-diagram-panel draggable-panel">
        <!-- Timing Diagram Panel -->
        <div class="panel-header">
            Timing Diagram
            <span class="fas fa-minus-square minimize panel-button"></span>
            <span
                class="fas fa-external-link-square-alt maximize panel-button-icon"
            ></span>
        </div>
        <div class="panel-body">
            <div class="timing-diagram-toolbar noSelect">
                <TimingDiagramButtons
                    v-for="button in buttons"
                    :key="button.title"
                    :title="button.title"
                    :icon="button.icon"
                    :btn-class="button.class"
                    class="timing-diagram-panel-button"
                    :type="button.type"
                    @click="
                        () => {
                            handleButtonClick(button.click)
                        }
                    "
                />
                1 cycle =
                <input
                    id="timing-diagram-units"
                    type="number"
                    min="1"
                    autocomplete="off"
                    value="1000"
                />
                Units
                <span id="timing-diagram-log"></span>
            </div>
            <div id="plot" ref="plotRef">
                <canvas id="plotArea"></canvas>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import plotArea from '#/simulator/src/plotArea'
import { buttonActions } from '#/simulator/src/plotArea'
import TimingDiagramButtons from './TimingDiagramButtons.vue'
import buttonsJSON from '#/assets/constants/Panels/TimingDiagramPanel/buttons.json'

const buttons = ref(buttonsJSON)
const plotRef = ref<HTMLElement | null>(null)

function handleButtonClick(button: string) {
    console.log('clicked', button)
    if (button === 'smaller') {
        if (plotRef.value) {
            plotRef.value.style.width = `${Math.max(
                plotRef.value.offsetWidth - 20,
                560
            )}px`
        }
        plotArea.resize()
    } else if (button === 'larger') {
        if (plotRef.value) {
            plotRef.value.style.width = `${plotRef.value.offsetWidth + 20}px`
        }
        plotArea.resize()
    } else if (button === 'smallHeight') {
        buttonActions.smallHeight()
    } else if (button === 'largeHeight') {
        buttonActions.largeHeight()
    } else {
        plotArea[button]()
    }
}
</script>

<style scoped>
.timing-diagram-panel-button {
    margin-right: 5px;
}
</style>

<!-- TODO: input element to vue, remove remaining dom manipulation, header component -->
