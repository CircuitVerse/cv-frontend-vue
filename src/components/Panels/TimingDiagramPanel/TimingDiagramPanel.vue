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
                <button
                    class="custom-btn--primary panel-button"
                    title="Decrease Size"
                >
                    <span
                        class="fas fa-chevron-left timing-diagram-smaller panel-button-icon"
                    ></span>
                </button>
                <button
                    class="custom-btn--primary panel-button"
                    title="Increase Size"
                >
                    <span
                        class="fas fa-chevron-right timing-diagram-larger panel-button-icon"
                    ></span>
                </button>
                <button
                    class="custom-btn--primary panel-button"
                    title="Decrease Height"
                >
                    <span
                        class="fas fa-chevron-up timing-diagram-small-height panel-button-icon"
                    ></span>
                </button>
                <button
                    class="custom-btn--primary panel-button"
                    title="Increase Height"
                >
                    <span
                        class="fas fa-chevron-down timing-diagram-large-height panel-button-icon"
                    ></span>
                </button>
                <button
                    class="custom-btn--primary panel-button"
                    title="Download As Image"
                >
                    <span
                        class="fas fa-download timing-diagram-download"
                    ></span>
                </button>
                <button
                    class="custom-btn--tertiary panel-button"
                    title="Reset Timing Diagram"
                >
                    <span class="fas fa-undo timing-diagram-reset"></span>
                </button>
                <button
                    class="custom-btn--tertiary panel-button"
                    title="Autocalibrate Cycle Units"
                >
                    <span class="fas fa-magic timing-diagram-calibrate"></span>
                </button>
                <button
                    class="custom-btn--primary panel-button"
                    title="Zoom In"
                >
                    <span
                        class="fas fa-search-plus timing-diagram-zoom-in"
                    ></span>
                </button>
                <button
                    class="custom-btn--primary panel-button"
                    title="Zoom Out"
                >
                    <span
                        class="fas fa-search-minus timing-diagram-zoom-out"
                    ></span>
                </button>
                <button
                    class="custom-btn--primary panel-button"
                    title="Resume auto-scroll"
                >
                    <span class="fas fa-play timing-diagram-resume"></span>
                </button>
                <button
                    class="custom-btn--primary panel-button"
                    title="Pause auto-scroll"
                >
                    <span class="fas fa-pause timing-diagram-pause"></span>
                </button>
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
            <div id="plot">
                <canvas id="plotArea"></canvas>
            </div>
        </div>
    </div>
</template>

<script setup></script>

<style lang="scss" scoped></style>
