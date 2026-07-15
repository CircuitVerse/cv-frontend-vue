<template>
   <div class="timing-diagram-panel draggable-panel" ref="timingDiagramPanelRef" id="time-Diagram">
        <PanelHeader
            :header-title="$t('simulator.panel_header.timing_diagram')"
        />
        <div class="panel-body">
            <div class="timing-diagram-toolbar noSelect">
                <TimingDiagramButtons
                    v-for="button in timingDiagramPanelStore.buttons"
                    :key="button.title"
                    :title="button.title"
                    :icon="button.icon"
                    :btn-class="button.class"
                    class="timing-diagram-panel-button"
                    :type="button.type"
                    @click="() => { handleButtonClick(button.click) }"
                />
                {{ $t('simulator.panel_body.timing_diagram.one_cycle') }}
                <input
                    id="timing-diagram-units"
                    type="number"
                    min="1"
                    autocomplete="off"
                    v-model.number="timingDiagramPanelStore.cycleUnits"
                    @change="handleUnitsChange"
                    @paste="handleUnitsChange"
                    @keyup="handleUnitsChange"
                />
                {{ $t('simulator.panel_body.timing_diagram.units') }}
                <span
                    v-if="timingDiagramPanelStore.logMessage"
                    class="timing-diagram-log"
                    :style="{ backgroundColor: timingDiagramPanelStore.logColor }"
                >
                    {{ timingDiagramPanelStore.logMessage }}
                </span>
            </div>
            <div id="plot" ref="plotRef">
                <canvas id="plotArea"></canvas>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import _plotArea from '#/simulator/src/plotArea'
import TimingDiagramButtons from './TimingDiagramButtons.vue'
import PanelHeader from '../Shared/PanelHeader.vue'
import { handleButtonClick, handleUnitsChange } from './TimingDiagramPanel'
import { useLayoutStore } from '#/store/layoutStore'
import { useTimingDiagramPanelStore } from '#/store/timingDiagramPanelStore'
import { setupPanelListeners, minimizePanel } from '#/simulator/src/ux'

const layoutStore = useLayoutStore()
const timingDiagramPanelStore = useTimingDiagramPanelStore()

onMounted(() => {
    layoutStore.timingDiagramPanelRef = timingDiagramPanelStore.timingDiagramPanelRef
    setupPanelListeners('.timing-diagram-panel')
    minimizePanel('.timing-diagram-panel')
})
</script>

<style>
.timing-diagram-panel-button {
    margin-right: 5px;
}

.timing-diagram-log {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
    color: #fff;
    margin-left: 6px;
}
</style>
