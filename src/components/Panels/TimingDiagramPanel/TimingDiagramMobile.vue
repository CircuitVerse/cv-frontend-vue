<template>
    <div class="panel-body">
        <div class="timing-diagram-toolbar noSelect">
            <div class="timing-btn-container">
                <TimingDiagramButtons
                  v-for="button in buttons"
                  :key="button.title"
                  :title="button.title"
                  :icon="button.icon"
                  :btn-class="button.class"
                  class="timing-diagram-panel-button"
                  :type="button.type"
                  @click="() => {
                    handleButtonClick(button.click)
                  }
                 " />
            </div>
            {{ $t('simulator.panel_body.timing_diagram.one_cycle') }}
            <div>
                <input id="timing-diagram-units" type="number" min="1" autocomplete="off" :value="cycleUnits"
                    @change="handleUnitsChange" @paste="handleUnitsChange" @keyup="handleUnitsChange" />
                {{ $t('simulator.panel_body.timing_diagram.units') }}
            </div>
            <span v-show="simulatorMobileStore.showCanvas" id="timing-diagram-log"></span>
        </div>
        <div id="plot" ref="plotRef">
            <canvas v-show="simulatorMobileStore.showCanvas" id="plotArea" :style="{ height: '100%'}"></canvas>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import _plotArea from '#/simulator/src/plotArea'
import { timingDiagramButtonActions } from '#/simulator/src/plotArea'
import TimingDiagramButtons from './TimingDiagramButtons.vue'
import buttonsJSON from '#/assets/constants/Panels/TimingDiagramPanel/buttons.json'
import { useLayoutStore } from '#/store/layoutStore'
import { useSimulatorMobileStore } from '#/store/simulatorMobileStore'

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
const simulatorMobileStore = useSimulatorMobileStore()

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

<style scoped>
.timing-diagram-panel-button {
    margin-right: 2px;
}

.timing-btn-container {
    white-space: nowrap;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.timing-btn-container::-webkit-scrollbar {
    height: 0px;
}

.timing-btn-container::-webkit-scrollbar-thumb {
    background-color: transparent;
    border-radius: 4px;
}

.timing-btn-container::-webkit-scrollbar-track {
    background-color: transparent;
}

.timing-btn-container > * {
    display: inline-block;
}
</style>
