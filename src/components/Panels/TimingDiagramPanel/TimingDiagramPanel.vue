<template>
    <div class="timing-diagram-panel draggable-panel" ref="timingDiagramPanelRef">
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
            <div id="plot" ref="plotRef">
                <canvas id="plotArea"></canvas>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import _plotArea from '#/simulator/src/plotArea'
import { timingDiagramButtonActions } from '#/simulator/src/plotArea'
import TimingDiagramButtons from './TimingDiagramButtons.vue'
import buttonsJSON from '#/assets/constants/Panels/TimingDiagramPanel/buttons.json'
import PanelHeader from '../Shared/PanelHeader.vue'
import { useLayoutStore } from '#/store/layoutStore'

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
const timingDiagramPanelRef = ref<HTMLElement | null>(null);
const layoutStore = useLayoutStore()

onMounted(() => {
    layoutStore.timingDiagramPanelRef = timingDiagramPanelRef.value
})

function handleButtonClick(button: string) {
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

<style>
#plotArea {
    padding: 3px;
    width: 100%;
}

.timing-diagram-panel-button {
    margin-right: 5px;
}

.timing-diagram-panel {
    border-radius: 5px;
    z-index: 70;
    transition: background 0.5s ease-out;
    position: fixed;
    cursor: pointer;
    left: 300px;
    top: 90px;
}

#plot {
    width: 800px;
}

.timing-diagram-toolbar {
    padding-left: 4px;
    padding: 2px;
    cursor: default;
}

.timing-diagram-toolbar input {
    width: 80px;
    background: transparent !important;
}

#timing-diagram-log {
    font-size: 12.5px;
    padding: 3px;
    margin-left: 5px;
    /* margin-bottom: 5px; */
    border-radius: 3px;
}

.timing-diagram-panel .panel-header {
    border-radius: 5px;
    border-top-right-radius: 5px;
    padding: 3px;
    font-weight: bold;
    font-size: 16px;
    text-transform: uppercase;
    text-align: left;
    cursor: move;
}
</style>

<!-- TODO: input element to vue, remove remaining dom manipulation, header component -->
