<template>
    <div class="timing-diagram-panel draggable-panel">
        <!-- Timing Diagram Panel -->
        <div class="panel-header">
            Timing Diagram
            <span class="fas fa-minus-square minimize panel-button"></span>
            <span class="fas fa-external-link-square-alt maximize panel-button-icon"></span>
        </div>
        <div class="panel-body">
            <div class="timing-diagram-toolbar noSelect">
                <button class="custom-btn--primary panel-button" title="Decrease Size" @click="decreasePlotWidth">
                    <span class="fas fa-chevron-left timing-diagram-smaller panel-button-icon"></span>
                </button>
                <button class="custom-btn--primary panel-button" title="Increase Size" @click="increasePlotWidth">
                    <span class="fas fa-chevron-right timing-diagram-larger panel-button-icon"></span>
                </button>
                <button class="custom-btn--primary panel-button" title="Decrease Height" @click="decreasePlotHeight">
                    <span class="fas fa-chevron-up timing-diagram-small-height panel-button-icon"></span>
                </button>
                <button class="custom-btn--primary panel-button" title="Increase Height" @click="increasePlotHeight">
                    <span class="fas fa-chevron-down timing-diagram-large-height panel-button-icon"></span>
                </button>
                <button class="custom-btn--primary panel-button" title="Download As Image" @click="downloadPlot">
                    <span class="fas fa-download timing-diagram-download"></span>
                </button>
                <button class="custom-btn--tertiary panel-button" title="Reset Timing Diagram" @click="resetPlot">
                    <span class="fas fa-undo timing-diagram-reset"></span>
                </button>
                <button class="custom-btn--tertiary panel-button" title="Autocalibrate Cycle Units" @click="calibratePlot">
                    <span class="fas fa-magic timing-diagram-calibrate"></span>
                </button>
                <button class="custom-btn--primary panel-button" title="Zoom In" @click="zoomInPlot">
                    <span class="fas fa-search-plus timing-diagram-zoom-in"></span>
                </button>
                <button class="custom-btn--primary panel-button" title="Zoom Out" @click="zoomOutPlot">
                    <span class="fas fa-search-minus timing-diagram-zoom-out"></span>
                </button>
                <button class="custom-btn--primary panel-button" title="Resume auto-scroll" @click="resumePlot">
                    <span class="fas fa-play timing-diagram-resume"></span>
                </button>
                <button class="custom-btn--primary panel-button" title="Pause auto-scroll" @click="pausePlot">
                    <span class="fas fa-pause timing-diagram-pause"></span>
                </button>
                1 cycle =
                <input id="timing-diagram-units" type="number" min="1" autocomplete="off" :value="this.cycleUnit"
                    @change="setCycleUnit" />
                Units
                <span id="timing-diagram-log"></span>
            </div>
            <div id="plot">
                <canvas id="plotArea"></canvas>
            </div>
        </div>
    </div>
</template>
  
 

<script>
import plotArea from '#/simulator/src/plotArea'

var DPR = window.devicePixelRatio || 1;

function sh(x) {
            return x * DPR
        };

export default {
    name: 'TimingDiagram',
    data() {
        return {
            plotArea,
            cycleUnit: 1000,
            plotHeight: sh(20),
            waveFormPadding:sh(5),
            waveFormHeight: this.plotHeight - 2 * this.waveFormPadding,

        }
    },
    methods: {
        decreasePlotWidth() {
            const plotElement = document.getElementById('plot')
            const newWidth = Math.max(plotElement.offsetWidth - 20, 560)
            plotElement.style.width = `${newWidth}px`
            plotArea.resize()
        },
        increasePlotWidth() {
            const plotElement = document.getElementById('plot')
            const newWidth = Math.max(plotElement.offsetWidth + 20, 560)
            plotElement.style.width = `${newWidth}px`
            plotArea.resize()
        },

        decreasePlotHeight() {
            this.plotHeight = Math.max(this.plotHeight - 10, 20)
            this.waveFormHeight = this.plotHeight - 2 * this.waveFormPadding
            plotArea.resize()
        },
        increasePlotHeight() {
            this.plotHeight = Math.max(this.plotHeight + 10, 20)
            this.waveFormHeight = this.plotHeight - 2 * this.waveFormPadding
            plotArea.resize()
        },


        resetPlot() {
            plotArea.reset()
        },
        calibratePlot() {
            plotArea.calibrate()
        },
        resumePlot() {
            plotArea.resume()
        },
        pausePlot() {
            plotArea.pause()
        },
        downloadPlot() {
            plotArea.download()
        },
        zoomInPlot() {
            plotArea.zoomIn()
        },
        zoomOutPlot() {
            plotArea.zoomOut()
        },

        setCycleUnit(event) {
            const timeUnits = parseInt(event.target.value, 10);
            if (isNaN(timeUnits) || timeUnits < 1) return;
            this.plotArea.cycleUnit = timeUnits;
        },
        mouseDownHandler(event) {
            const rect = this.$refs.plotArea.canvas.getBoundingClientRect();
            const x = sh(event.clientX - rect.left);
            this.$refs.plotArea.scrollAcc = 0;
            this.$refs.plotArea.autoScroll = false;
            this.$refs.plotArea.mouseDown = true;
            this.$refs.plotArea.mouseX = x;
            this.$refs.plotArea.mouseDownX = x;
            this.$refs.plotArea.mouseDownTime = new Date().getTime();
        },
        mouseUpHandler() {
            this.$refs.plotArea.mouseDown = false;
            const time = new Date().getTime() - this.$refs.plotArea.mouseDownTime;
            const offset = (this.$refs.plotArea.mouseX - this.$refs.plotArea.mouseDownX) / cycleWidth;
            this.$refs.plotArea.scrollAcc = (offset * frameInterval) / time;
        },
        mouseMoveHandler(event) {
            const rect = this.$refs.plotArea.canvas.getBoundingClientRect();
            const x = sh(event.clientX - rect.left);
            if (this.$refs.plotArea.mouseDown) {
                this.$refs.plotArea.cycleOffset -= (x - this.$refs.plotArea.mouseX) / cycleWidth;
                this.$refs.plotArea.mouseX = x;
            } else {
                this.$refs.plotArea.mouseDown = false;
            }
        },

       
       
        // In created:
        created() {
            this.$nextTick(() => {
                const plotArea = this.$refs.plotArea;
                plotArea.canvas.addEventListener('mousedown', this.mouseDownHandler);
                plotArea.canvas.addEventListener('mouseup', this.mouseUpHandler);
                plotArea.canvas.addEventListener('mousemove', this.mouseMoveHandler);
            });
        },
    }
}


</script>