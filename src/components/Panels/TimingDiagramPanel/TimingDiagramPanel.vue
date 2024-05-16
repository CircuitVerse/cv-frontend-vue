<template>
    <div class="timing-diagram-panel draggable-panel">
        <!-- Timing Diagram Panel -->
        <PanelHeader
            :header-title="$t('simulator.panel_header.timing_diagram')"
        />
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
                {{ $t('simulator.panel_body.timing_diagram.one_cycle') }}
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
                {{ $t('simulator.panel_body.timing_diagram.units') }}
                <span id="timing-diagram-log"></span>
            </div>
            <div id="plot" :style="{ width: plotWidth + 'px', height: plotHeight + 'px' }">
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
import { sh } from '#/simulator/src/plotArea.js'

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
const plotWidth = ref(sh(560));
const plotHeight = ref(sh(20));

function handleButtonClick(button: string) {
    if (button === 'smaller') {
        plotWidth.value = Math.max(plotWidth.value - sh(20), sh(560));
        plotArea.resize();
    } else if (button === 'larger') {
        plotWidth.value += sh(20);
        plotArea.resize()
    } else if (button === 'smallHeight') {
        plotHeight.value = Math.max(plotHeight.value - sh(20), sh(20));
        plotArea.resize()
    } else if (button === 'largeHeight') {
        plotHeight.value = Math.min(plotHeight.value + sh(20), sh(100));
        plotArea.resize()
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
