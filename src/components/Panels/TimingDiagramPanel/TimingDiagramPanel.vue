<template>
    <div class="timing-diagram-panel draggable-panel">
        <!-- Timing Diagram Panel -->
        <PanelHeader title="Timing Diagram" />
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
                    :value="cycleUnits"
                    @change="handleUnitsChange"
                    @paste="handleUnitsChange"
                    @keyup="handleUnitsChange"
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
import _plotArea from '#/simulator/src/plotArea'
import { timingDiagramButtonActions } from '#/simulator/src/plotArea'
import TimingDiagramButtons from './TimingDiagramButtons.vue'
import buttonsJSON from '#/assets/constants/Panels/TimingDiagramPanel/buttons.json'
import PanelHeader from '../Shared/PanelHeader.vue'

interface TimingDiagramButton {
    title: string
    icon: string
    class: string
    type: string
    click: string
}

interface PlotArea {
    resize: () => void
    [key: string]: () => void
}

const plotArea: PlotArea = _plotArea
const buttons = ref<TimingDiagramButton[]>(buttonsJSON)
const plotRef = ref<HTMLElement | null>(null)
const cycleUnits = ref(1000)

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
        timingDiagramButtonActions.smallHeight()
    } else if (button === 'largeHeight') {
        timingDiagramButtonActions.largeHeight()
    } else {
        plotArea[button]()
    }
}

function handleUnitsChange(event: Event) {
    const inputElem = event.target as HTMLInputElement
    const timeUnits = parseInt(inputElem.value, 10)
    if (isNaN(timeUnits) || timeUnits < 1) return
    plotArea.cycleUnit = timeUnits
}
</script>

<style scoped>
.timing-diagram-panel-button {
    margin-right: 5px;
}
</style>

<!-- TODO: input element to vue, remove remaining dom manipulation, header component -->
