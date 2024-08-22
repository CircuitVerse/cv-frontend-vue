<template>
    <QuickButtonMobile v-if="simulatorMobileStore.showMobileView" />
    <TimingDiagramMobile v-if="simulatorMobileStore.showMobileView" v-show="simulatorMobileStore.showTimingDiagram" />
    <!-- --------------------------------------------------------------------------------------------- -->
    <!-- TabsBar -->
    <TabsBar />
    <!-- --------------------------------------------------------------------------------------------- -->

    <!-- --------------------------------------------------------------------------------------------- -->
    <!-- Verilog Code Editor -->
    <ExportVerilog />
    <!-- --------------------------------------------------------------------------------------------- -->

    <!-- --------------------------------------------------------------------------------------------- -->
    <!-- Circuit Elements Panel -->
    <ElementsPanel  v-if="!simulatorMobileStore.showMobileView"/>
    <!-- --------------------------------------------------------------------------------------------- -->

    <!-- --------------------------------------------------------------------------------------------- -->
    <!-- Layout Element Panel -->
    <div
        v-if="!simulatorMobileStore.showMobileView"
        class="noSelect defaultCursor layoutElementPanel draggable-panel draggable-panel-css"
        ref="layoutElementPanelRef"
    >
        <div class="panel-header">
            Layout Elements
            <span class="fas fa-minus-square minimize"></span>
            <span class="fas fa-external-link-square-alt maximize"></span>
        </div>
        <div class="panel-body">
            <div class="search-results"></div>
            <div id="subcircuitMenu" class="accordion"></div>
        </div>
    </div>
    <!-- --------------------------------------------------------------------------------------------- -->

    <!-- --------------------------------------------------------------------------------------------- -->
    <!-- Timing Diagram Panel -->
    <TimingDiagramPanel v-if="!simulatorMobileStore.showMobileView" />
    <!-- --------------------------------------------------------------------------------------------- -->

    <!-- --------------------------------------------------------------------------------------------- -->
    <!-- Testbench -->
    <TestBenchPanel v-if="!simulatorMobileStore.showMobileView" />
    <!-- --------------------------------------------------------------------------------------------- -->
    <TestBenchCreator v-if="!simulatorMobileStore.showMobileView" />
    <!-- --------------------------------------------------------------------------------------------- -->

    <!-- --------------------------------------------------------------------------------------------- -->
    <!-- Message Display -->
    <div id="MessageDiv"></div>
    <!-- --------------------------------------------------------------------------------------------- -->

    <!-- --------------------------------------------------------------------------------------------- -->
    <!-- Verilog Editor Panel -->
    <VerilogEditorPanel />
    <!-- --------------------------------------------------------------------------------------------- -->

    <!-- --------------------------------------------------------------------------------------------- -->
    <!-- Element Properties Panel -->
    <PropertiesPanel v-if="!simulatorMobileStore.showMobileView" />
    <!-- --------------------------------------------------------------------------------------------- -->

    <!-- --------------------------------------------------------------------------------------------- -->
    <CustomShortcut />
    <!-- --------------------------------------------------------------------------------------------- -->

    <!-- --------------------------------------------------------------------------------------------- -->
    <!-- Dialog Box - Save -->
    <SaveImage />
    <!-- --------------------------------------------------------------------------------------------- -->

    <!-- --------------------------------------------------------------------------------------------- -->
    <!-- Dialog Box - Custom Themes -->
    <!-- <div
        id="colorThemesDialog"
        class="customScroll colorThemesDialog"
        tabindex="0"
        style="display: none"
        title="Select Theme"
    ></div> -->
    <ApplyThemes />
    <div id="CustomColorThemesDialog" class="customScroll" tabindex="0" style="display: none" title="Custom Theme">
    </div>
    <input id="importThemeFile" type="file" name="themeFile" style="display: none" multiple />
    <!-- --------------------------------------------------------------------------------------------- -->

    <!-- --------------------------------------------------------------------------------------------- -->
    <!-- Simulation Area - Canvas (3) + Help Section-->
    <div id="simulation" class="simulation">
        <!-- <div id="restrictedDiv" class="alert alert-danger display--none"></div> -->
        <div id="canvasArea" class="canvasArea">
            <canvas id="backgroundArea" style="
                    position: absolute;
                    left: 0;
                    top: 0;
                    z-index: 0;
                    width: 100%;
                    height: 100%;
                "></canvas>
            <canvas
                    id="simulationArea"
                    style="
                    position: absolute;
                    left: 0;
                    top: 0;
                    z-index: 1;
                    width: 100%;
                    height: 100%;
                    "
                    @touchstart="(e) => {
                        simulationArea.touch = true;
                        panStart(e)
                    }"
                    @touchend="(e) => {
                        simulationArea.touch = true;
                        panStop(e)
                    }"
                    @touchmove="(e) => {
                        simulationArea.touch = true;
                        panMove(e)
                    }"
                    @mousedown="(e) => {
                        simulationArea.touch = false;
                        panStart(e)
                    }"
                    @mousemove="(e) => {
                        simulationArea.touch = false;
                        panMove(e)
                    }"
                    @mouseup="(e) => {
                        simulationArea.touch = false;
                        panStop(e)
                    }"
            ></canvas>
            <div id="miniMap">
                <canvas id="miniMapArea" style="position: absolute; left: 0; top: 0; z-index: 3"></canvas>
            </div>

            <div id="Help"></div>
            <div class="sk-folding-cube loadingIcon" style="
                    display: none;
                    position: absolute;
                    right: 50%;
                    bottom: 50%;
                    z-index: 100;
                ">
                <div class="sk-cube1 sk-cube"></div>
                <div class="sk-cube2 sk-cube"></div>
                <div class="sk-cube4 sk-cube"></div>
                <div class="sk-cube3 sk-cube"></div>
            </div>
        </div>
    </div>
    <!-- --------------------------------------------------------------------------------------------- -->

    <!-- --------------------------------------------------------------------------------------------- -->
    <!-- Dialog Box - Combinational Analysis -->
    <CombinationalAnalysis />
    <!-- --------------------------------------------------------------------------------------------- -->

    <!-- --------------------------------------------------------------------------------------------- -->
    <!-- Dialog Box - Testbench -->
     <TestBenchValidator />
    <!-- --------------------------------------------------------------------------------------------- -->

    <!-- --------------------------------------------------------------------------------------------- -->
    <!-- Dialog Box - Insert Subcircuit -->
    <InsertSubcircuit />
    <!-- --------------------------------------------------------------------------------------------- -->

    <!-- --------------------------------------------------------------------------------------------- -->
    <!-- Dialog Box - Open Project -->
    <OpenOffline />
    <!-- --------------------------------------------------------------------------------------------- -->

    <!-- Dialog Box - Hex Bin Dec --------------------------------------------------------------------------------------------- -->
    <HexBinDec />
    <!-- --------------------------------------------------------------------------------------------- -->

    <!-- --------------------------------------------------------------------------------------------- -->
    <!---issue reporting-system----->
    <ReportIssue />
    <!-- --------------------------------------------------------------------------------------------- -->

    <v-btn
      class="cir-ele-btn"
      @mousedown="simulatorMobileStore.showElementsPanel = !simulatorMobileStore.showElementsPanel"
      :style="{bottom: simulatorMobileStore.showElementsPanel ? '10rem' : '2rem'}"
      v-if="simulatorMobileStore.showMobileView"
    >
        <i class="fas fa-bezier-curve"></i>
    </v-btn>

    <v-btn
      class="select-mul-btn"
      @mousedown="(e: React.MouseEvent) => {
        if(simulationArea.shiftDown == false) {
            simulationArea.shiftDown = true;
        }
        else {
            simulationArea.shiftDown = false;
            e.preventDefault();
        }
      }"
      :style="{bottom: simulatorMobileStore.showElementsPanel ? '10rem' : '2rem'}"
      v-if="simulatorMobileStore.showMobileView"
    >
    <i class="fa-solid fa-vector-square"></i>
    </v-btn>

    <v-btn
      class="select-mul-btn"
      @mousedown="copyBtnClick()"
      :style="{bottom: simulatorMobileStore.showElementsPanel ? '16rem' : '8rem'}"
      v-if="simulatorMobileStore.showMobileView && !simulatorMobileStore.isCopy"
    >
    <i class="fa-solid fa-copy"></i>
    </v-btn>

    <v-btn
      class="select-mul-btn"
      @mousedown="pasteBtnClick()"
      :style="{bottom: simulatorMobileStore.showElementsPanel ? '16rem' : '8rem'}"
      v-if="simulatorMobileStore.showMobileView && simulatorMobileStore.isCopy"
    >
    <i class="fa-solid fa-paste"></i>
    </v-btn>

    <v-btn
      class="select-mul-btn"
      @mousedown="propertiesBtnClick()"
      :style="{bottom: simulatorMobileStore.showElementsPanel ? '22rem' : '14rem'}"
      v-if="simulatorMobileStore.showMobileView"
    >
    <i class="fa-solid fa-sliders"></i>
    </v-btn>

    <ElementsPanelMobile v-if="simulatorMobileStore.showMobileView" />
    <PropertiesPanelMobile v-if="simulatorMobileStore.showMobileView" />
</template>

<script lang="ts" setup>
import VerilogEditorPanel from './Panels/VerilogEditorPanel/VerilogEditorPanel.vue'
import ElementsPanel from './Panels/ElementsPanel/ElementsPanel.vue'
import PropertiesPanel from './Panels/PropertiesPanel/PropertiesPanel.vue'
import TimingDiagramPanel from './Panels/TimingDiagramPanel/TimingDiagramPanel.vue'
import TabsBar from './TabsBar/TabsBar.vue'
import CombinationalAnalysis from './DialogBox/CombinationalAnalysis.vue'
import HexBinDec from './DialogBox/HexBinDec.vue'
import SaveImage from './DialogBox/SaveImage.vue'
import ApplyThemes from './DialogBox/Themes/ApplyThemes.vue'
import ExportVerilog from './DialogBox/ExportVerilog.vue'
import CustomShortcut from './DialogBox/CustomShortcut.vue'
import InsertSubcircuit from './DialogBox/InsertSubcircuit.vue'
import OpenOffline from './DialogBox/OpenOffline.vue'
import ReportIssue from './ReportIssue/ReportIssue.vue'
import TestBenchPanel from './Panels/TestBenchPanel/TestBenchPanel.vue'
import TestBenchCreator from './Panels/TestBenchPanel/TestBenchCreator.vue'
import TestBenchValidator from './Panels/TestBenchPanel/TestBenchValidator.vue'
import QuickButtonMobile from './Navbar/QuickButton/QuickButtonMobile.vue'
import TimingDiagramMobile from './Panels/TimingDiagramPanel/TimingDiagramMobile.vue'
import ElementsPanelMobile from './Panels/ElementsPanel/ElementsPanelMobile.vue'
import PropertiesPanelMobile from './Panels/PropertiesPanel/PropertiesPanelMobile.vue'
import { simulationArea } from '#/simulator/src/simulationArea'
import { paste } from '#/simulator/src/events'
import { useLayoutStore } from '#/store/layoutStore'
import  { panStart, panMove, panStop } from '#/simulator/src/listeners'
import { useSimulatorMobileStore } from '#/store/simulatorMobileStore'
import { onMounted, ref } from 'vue'

const layoutStore = useLayoutStore()
const simulatorMobileStore = useSimulatorMobileStore()

const layoutElementPanelRef = ref<HTMLElement | null>(null);

onMounted(() => {
    layoutStore.layoutElementPanelRef = layoutElementPanelRef.value
})

const copyBtnClick = () => {
    window.document.execCommand('copy')
    simulationArea.shiftDown = false
    simulatorMobileStore.isCopy = true
}

const pasteBtnClick = () => {
    paste(localStorage.getItem('clipboardData'));
    simulatorMobileStore.isCopy = false
}

const propertiesBtnClick = () => {
    simulatorMobileStore.showPropertiesPanel = !simulatorMobileStore.showPropertiesPanel
}
</script>

<style scoped>
.cir-ele-btn{
    position: absolute;
    right: 1.5rem;
    bottom: 15rem;
    z-index: 100;
    background-color: var(--bg-toggle-btn-primary);
    color: white;
    border-radius: 100%;
    font-size: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: 0.3s;
    padding: 1rem;
    height: 4rem;
    width: 4rem;
}

.select-mul-btn{
    position: absolute;
    left: 1.5rem;
    bottom: 2rem;
    z-index: 100;
    background-color: var(--bg-toggle-btn-primary);
    color: white;
    border-radius: 100%;
    font-size: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: 0.3s;
    padding: 1rem;
    height: 4rem;
    width: 4rem;
}
</style>