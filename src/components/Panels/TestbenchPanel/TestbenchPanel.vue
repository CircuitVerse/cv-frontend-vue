<template>
    <div class="testbench-manual-panel draggable-panel noSelect defaultCursor">
        <div class="panel-header">
            Testbench
            <span class="fas fa-minus-square minimize panel-button"></span>
            <span
                class="fas fa-external-link-square-alt maximize panel-button-icon"
            ></span>
        </div>
        <div class="panel-body tb-test-not-null tb-panel-hidden">
            <div class="tb-manual-test-data">
                <div style="margin-bottom: 10px; overflow: auto">
                    <span id="data-title" class="tb-data"
                        ><b>Test:</b> <span></span
                    ></span>
                    <span id="data-type" class="tb-data"
                        ><b>Type:</b> <span></span
                    ></span>
                </div>
                <button
                    id="edit-test-btn"
                    class="custom-btn--basic panel-button tb-dialog-button"
                >
                    Edit
                </button>
                <button
                    id="remove-test-btn"
                    class="custom-btn--tertiary panel-button tb-dialog-button"
                >
                    Remove
                </button>
            </div>
            <div style="overflow: auto; margin-bottom: 10px">
                <div class="tb-manual-test-buttons tb-group-buttons">
                    <span style="line-height: 24px; margin-right: 5px"
                        ><b>Group: </b></span
                    >
                    <button
                        id="prev-group-btn"
                        class="custom-btn--basic panel-button tb-case-button-left tb-case-button"
                    >
                        <i class="tb-case-arrow tb-case-arrow-left"></i>
                    </button>
                    <span class="tb-test-label group-label"></span>
                    <button
                        id="next-group-btn"
                        class="custom-btn--basic panel-button tb-case-button-right tb-case-button"
                    >
                        <i class="tb-case-arrow tb-case-arrow-right"></i>
                    </button>
                </div>
                <div class="tb-manual-test-buttons tb-case-buttons">
                    <span style="line-height: 24px; margin-right: 5px"
                        ><b>Case: </b></span
                    >
                    <button
                        id="prev-case-btn"
                        class="custom-btn--basic panel-button tb-case-button-left tb-case-button"
                    >
                        <i class="tb-case-arrow tb-case-arrow-left"></i>
                    </button>
                    <span class="tb-test-label case-label"></span>
                    <button
                        id="next-case-btn"
                        class="custom-btn--basic panel-button tb-case-button-right tb-case-button"
                    >
                        <i class="tb-case-arrow tb-case-arrow-right"></i>
                    </button>
                </div>
            </div>
            <div style="text-align: center">
                <table class="tb-manual-table">
                    <tr id="tb-manual-table-labels">
                        <th>LABELS</th>
                    </tr>
                    <tr id="tb-manual-table-bitwidths">
                        <td>Bitwidth</td>
                    </tr>
                    <tr id="tb-manual-table-current-case">
                        <td>Current Case</td>
                    </tr>
                    <tr id="tb-manual-table-test-result">
                        <td>Result</td>
                    </tr>
                </table>
            </div>
            <div style="display: table; margin-top: 20px; margin-left: 8px">
                <div class="testbench-manual-panel-buttons">
                    <button
                        id="validate-btn"
                        class="custom-btn--basic panel-button tb-dialog-button"
                    >
                        Validate
                    </button>
                    <button
                        id="runall-btn"
                        class="custom-btn--primary panel-button tb-dialog-button"
                    >
                        Run All
                    </button>
                </div>
                <span class="testbench-runall-label">
                    <span id="runall-summary">placeholder</span> Tests Passed
                    <span id="runall-detailed-link" style="color: #18a2cd"
                        >View Detailed</span
                    >
                </span>
            </div>
        </div>
        <div class="panel-body tb-test-null">
            <div class="tb-manual-test-data">
                <div style="margin-bottom: 10px; overflow: auto">
                    <p><i>No Test is attached to the current circuit</i></p>
                </div>
                <button
                    id="attach-test-btn"
                    class="custom-btn--primary panel-button tb-dialog-button"
                >
                    Attach Test
                </button>
            </div>
        </div>
    </div>
</template>

<script setup></script>

<style lang="scss" scoped></style>
