<template>
    <div class="testbench-manual-panel draggable-panel noSelect defaultCursor">
        <div class="panel-header">
            Testbench
            <span class="fas fa-minus-square minimize panel-button"></span>
            <span class="fas fa-external-link-square-alt maximize panel-button-icon"></span>
        </div>
        <div v-if="testBenchStore.showTestbenchUI" class="panel-body tb-test-not-null tb-panel-hidden">
            <div class="tb-manual-test-data">
                <div style="margin-bottom: 10px; overflow: auto">
                    <span id="data-title" class="tb-data"><b>Test:</b> <span>{{ testData.title || 'Untitled'
                            }}</span></span>
                    <span id="data-type" class="tb-data"><b>Type:</b> <span>{{ testData.type === 'comb' ?
                            'Combinational' : 'Sequential' }}</span></span>
                </div>
                <button id="edit-test-btn" @mousedown="buttonListenerFunctions.editTestButton()"
                    class="custom-btn--basic panel-button tb-dialog-button">
                    Edit
                </button>
                <button id="remove-test-btn" @mousedown="buttonListenerFunctions.removeTestButton()"
                    class="custom-btn--tertiary panel-button tb-dialog-button">
                    Remove
                </button>
            </div>
            <div style="overflow: auto; margin-bottom: 10px">
                <div class="tb-manual-test-buttons tb-group-buttons">
                    <span style="line-height: 24px; margin-right: 5px"><b>Group: </b></span>
                    <button id="prev-group-btn" @mousedown="buttonListenerFunctions.previousGroupButton()"
                        class="custom-btn--basic panel-button tb-case-button-left tb-case-button">
                        <i class="tb-case-arrow tb-case-arrow-left"></i>
                    </button>
                    <span class="tb-test-label group-label"> {{ testData.groups[testBenchStore.testbenchData.currentGroup].label
                        }}</span>
                    <button id="next-group-btn" @mousedown="buttonListenerFunctions.nextGroupButton()"
                        class="custom-btn--basic panel-button tb-case-button-right tb-case-button">
                        <i class="tb-case-arrow tb-case-arrow-right"></i>
                    </button>
                </div>
                <div class="tb-manual-test-buttons tb-case-buttons">
                    <span style="line-height: 24px; margin-right: 5px"><b>Case: </b></span>
                    <button id="prev-case-btn" @mousedown="buttonListenerFunctions.previousCaseButton()"
                        class="custom-btn--basic panel-button tb-case-button-left tb-case-button">
                        <i class="tb-case-arrow tb-case-arrow-left"></i>
                    </button>
                    <span class="tb-test-label case-label"> {{ testBenchStore.testbenchData.currentCase + 1 }}</span>
                    <button id="next-case-btn" @mousedown="buttonListenerFunctions.nextCaseButton()"
                        class="custom-btn--basic panel-button tb-case-button-right tb-case-button">
                        <i class="tb-case-arrow tb-case-arrow-right"></i>
                    </button>
                </div>
            </div>
            <div style="text-align: center">
                <table class="tb-manual-table">
                    <tr id="tb-manual-table-labels">
                        <th>LABELS</th>
                        <th v-for="io in combinedIO" :key="io.label">{{ io.label }}</th>
                    </tr>
                    <tr id="tb-manual-table-bitwidths">
                        <td>Bitwidth</td>
                        <td v-for="io in combinedIO" :key="io.label">{{ io.bitWidth }}</td>
                    </tr>
                    <tr id="tb-manual-table-current-case">
                        <td>Current Case</td>
                        <td v-for="input in inputs" :key="input.label">{{
                            input.values[testBenchStore.testbenchData.currentCase] }}</td>
                        <td v-for="output in outputs" :key="output.label">{{
                            output.values[testBenchStore.testbenchData.currentCase] }}</td>
                    </tr>
                    <tr id="tb-manual-table-test-result">
                        <td>Result</td>
                    </tr>
                </table>
            </div>
            <div style="display: table; margin-top: 20px; margin-left: 8px">
                <div class="testbench-manual-panel-buttons">
                    <button id="validate-btn" @mousedown="buttonListenerFunctions.validateButton()"
                        class="custom-btn--basic panel-button tb-dialog-button">
                        Validate
                    </button>
                    <button id="runall-btn" @mousedown="buttonListenerFunctions.runAllButton()"
                        class="custom-btn--primary panel-button tb-dialog-button">
                        Run All
                    </button>
                </div>
                <span class="testbench-runall-label">
                    <span id="runall-summary">placeholder</span> Tests Passed
                    <span id="runall-detailed-link" style="color: #18a2cd">View Detailed</span>
                </span>
            </div>
        </div>
        <div v-else class="panel-body tb-test-null">
            <div class="tb-manual-test-data">
                <div style="margin-bottom: 10px; overflow: auto">
                    <p><i>No Test is attached to the current circuit</i></p>
                </div>
                <button id="attach-test-btn" @mousedown="buttonListenerFunctions.attachTestButton()"
                    class="custom-btn--primary panel-button tb-dialog-button">
                    Attach Test
                </button>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
/**
 * This file contains all functions related the the testbench
 * Contains the the testbench engine and UI modules
 */

import { changeClockEnable } from '#/simulator/src/sequential'
import { play } from '#/simulator/src/engine'
import { showMessage, escapeHtml } from '#/simulator/src/utils'
import { confirmOption } from '#/components/helpers/confirmComponent/ConfirmComponent.vue'
import { useTestBenchStore } from '#/store/testBenchStore'
import { TestData } from "#/store/testBenchStore";
import { TestBenchData } from '#/store/testBenchStore'
import { computed } from 'vue'

const testBenchStore = useTestBenchStore();
const testData = computed(() => testBenchStore.testbenchData?.testData);

const combinedIO = computed(() => {
    const group = testData.value.groups[0];
    return group.inputs.concat(group.outputs);
});

const inputs = computed(() => testData.value.groups[0].inputs);
const outputs = computed(() => testData.value.groups[0].outputs);

const VALIDATION_ERRORS = {
    NOTPRESENT: 0, // Element is not present in the circuit
    WRONGBITWIDTH: 1, // Element is present but has incorrect bitwidth
    DUPLICATE_ID_DATA: 2, // Duplicate identifiers in test data
    DUPLICATE_ID_SCOPE: 3, // Duplicate identifiers in scope
    NO_RST: 4, // Sequential circuit but no reset(RST) in scope
}

// Do we have any other function to do this?
// Utility function. Converts decimal number to binary string
function dec2bin(dec: number | undefined, bitWidth = undefined) {
    if (dec === undefined) return 'X'
    const bin = (dec >>> 0).toString(2)
    if (!bitWidth) return bin

    return '0'.repeat(bitWidth - bin.length) + bin
}

/**
 * Defines all the functions called as event listeners for buttons on the UI
 */
const buttonListenerFunctions = {
    previousCaseButton: () => {
        const isValid = validate(
            testBenchStore.testbenchData.testData,
            globalScope
        )
        if (!isValid.ok) {
            showMessage(
                'Testbench: Some elements missing from circuit. Click Validate to know more'
            )
            return
        }
        if (testBenchStore.testbenchData && testBenchStore.testbenchData.casePrev) {
            testBenchStore.testbenchData.casePrev()
        }
        buttonListenerFunctions.computeCase()
    },

    nextCaseButton: () => {
        const isValid = validate(
            testBenchStore.testbenchData.testData,
            globalScope
        )
        if (!isValid.ok) {
            showMessage(
                'Testbench: Some elements missing from circuit. Click Validate to know more'
            )
            return
        }
        if (testBenchStore.testbenchData && testBenchStore.testbenchData.caseNext) {
            testBenchStore.testbenchData.caseNext()
        }
        buttonListenerFunctions.computeCase()
    },

    previousGroupButton: () => {
        const isValid = validate(
            testBenchStore.testbenchData.testData,
            globalScope
        )
        if (!isValid.ok) {
            showMessage(
                'Testbench: Some elements missing from circuit. Click Validate to know more'
            )
            return
        }
        if (testBenchStore.testbenchData && testBenchStore.testbenchData.groupPrev) {
            testBenchStore.testbenchData.groupPrev()
        }
        buttonListenerFunctions.computeCase()
    },

    nextGroupButton: () => {
        const isValid = validate(
            testBenchStore.testbenchData.testData,
            globalScope
        )
        if (!isValid.ok) {
            showMessage(
                'Testbench: Some elements missing from circuit. Click Validate to know more'
            )
            return
        }
        if (testBenchStore.testbenchData && testBenchStore.testbenchData.groupNext) {
            testBenchStore.testbenchData.groupNext()
        }
        buttonListenerFunctions.computeCase()
    },

    changeTestButton: () => {
        openCreator('create')
    },

    runAllButton: () => {
        const isValid = validate(
            testBenchStore.testbenchData.testData,
            globalScope
        )
        if (!isValid.ok) {
            showMessage(
                'Testbench: Some elements missing from circuit. Click Validate to know more'
            )
            return
        }
        const results = runAll(testBenchStore.testbenchData.testData, globalScope)
        const { passed } = results.summary
        const { total } = results.summary
        const resultString = JSON.stringify(results.detailed)
        $('#runall-summary').text(`${passed} out of ${total}`)
        $('#runall-detailed-link').on('click', () => {
            openCreator('result', resultString)
        })
        $('.testbench-runall-label').css('display', 'table-cell')
        $('.testbench-runall-label').delay(5000).fadeOut('slow')
    },

    editTestButton: () => {
        const editDataString = JSON.stringify(
            testBenchStore.testbenchData.testData
        )
        openCreator('edit', editDataString)
    },

    validateButton: () => {
        const isValid = validate(
            testBenchStore.testbenchData.testData,
            globalScope
        )
        showValidationUI(isValid)
    },

    removeTestButton: async () => {
        if (
            await confirmOption(
                'Are you sure you want to remove the test from the circuit?'
            )
        ) {
            testBenchStore.testbenchData = {
                testData: {
                    type: "",
                    title: "",
                    groups: [],
                },
                currentGroup: 0,
                currentCase: 0,
            }
            testBenchStore.showTestbenchUI = false
        }
    },

    attachTestButton: () => {
        openCreator('create')
    },

    rerunTestButton: () => {
        buttonListenerFunctions.computeCase()
    },

    computeCase: () => {
        setUICurrentCase(testBenchStore.testbenchData)
        const result = runSingleTest(testBenchStore.testbenchData, globalScope)
        setUIResult(testBenchStore.testbenchData, result)
    },
}

/**
 * Runs single test
 */
function runSingleTest(testbenchData: TestBenchData, scope) {
    const data = testbenchData.testData

    let result
    if (data.type === 'comb') {
        result = runSingleCombinational(testbenchData, scope)
    } else if (data.type === 'seq') {
        result = runSingleSequential(testbenchData, scope)
    }

    return result
}

/**
 * Runs single combinational test
 */
function runSingleCombinational(testbenchData: TestBenchData, scope) {
    const data = testbenchData.testData
    const groupIndex = testbenchData.currentGroup
    const caseIndex = testbenchData.currentCase

    const { inputs, outputs } = bindIO(data, scope)
    const group = data.groups[groupIndex]

    // Stop the clocks
    changeClockEnable(false)

    // Set input values according to the test
    setInputValues(inputs, group, caseIndex, scope)
    // Check output values
    const result = getOutputValues(data, outputs)
    // Restart the clocks
    changeClockEnable(true)
    return result
}

/**
 * Runs single sequential test and all tests above it in the group
 * Used in MANUAL mode
 */
function runSingleSequential(testbenchData: TestBenchData, scope) {
    const data = testbenchData.testData
    const groupIndex = testbenchData.currentGroup
    const caseIndex = testbenchData.currentCase

    const { inputs, outputs, reset } = bindIO(data, scope)
    const group = data.groups[groupIndex]

    // Stop the clocks
    changeClockEnable(false)

    // Trigger reset
    triggerReset(reset, scope)

    // Run the test and tests above in the same group
    for (let case_i = 0; case_i <= caseIndex; case_i++) {
        setInputValues(inputs, group, case_i, scope)
        tickClock(scope)
    }

    const result = getOutputValues(data, outputs)

    // Restart the clocks
    changeClockEnable(true)

    return result
}

/**
 * Set and propogate the input values according to the testcase.
 * Called by runSingle() and runAll()
 */
function setInputValues(inputs, group, caseIndex: number, scope) {
    group.inputs.forEach((input) => {
        inputs[input.label].state = parseInt(input.values[caseIndex], 2)
    })

    // Propagate inputs
    play(scope)
}

/**
 * Gets Output values as a Map with keys as output name and value as output state
 */
function getOutputValues(data: TestData, outputs) {
    const values = new Map()

    data.groups[0].outputs.forEach((dataOutput) => {
        // Using node value because output state only changes on rendering
        const resultValue = outputs[dataOutput.label].nodeList[0].value
        const resultBW = outputs[dataOutput.label].nodeList[0].bitWidth
        values.set(dataOutput.label, dec2bin(resultValue, resultBW))
    })

    return values
}

interface ValidationErrors {
    ok: boolean
    invalids?: {
        type: number
        identifier: string
        message: string
        extraInfo?: any
    }[]
}

/**
 * UI Function
 * Shows validation UI
 */
function showValidationUI(validationErrors: ValidationErrors) {
    const checkSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" fill="white" class="bi bi-check" viewBox="0 0 16 16">
      <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
    </svg>
    `

    let s = `
    <div style="text-align: center; color: white;">
        <div style="margin: 20px;">
            ${checkSVG}
        </div>
        All good. No validation errors
    </div>
    `

    if (!validationErrors.ok) {
        s = `
        <div style="text-align: center; color: white;">
            <p>Please fix these errors to run tests</p>
            <table class="validation-ui-table">
                <tr>
                    <th><b>Identifier</b></th>
                    <th><b>Error</b></th>
                </tr>
        `

        validationErrors?.invalids?.forEach((vError) => {
            s += `
                <tr>
                    <td>${vError.identifier}</td>
                    <td>${vError.message}</td>
                </tr>
            `
        })

        s += '</table></div>'
    }

    $('#testbenchValidate').dialog({
        resizable: false,
        width: 'auto',
        buttons: [
            {
                text: 'Ok',
                click() {
                    $(this).dialog('close')
                },
            },
            {
                text: 'Auto Fix',
                click() {
                    const fixes = validationAutoFix(validationErrors)
                    showMessage(`Testbench: Auto fixed ${fixes} errors`)
                    $(this).dialog('close')
                },
            },
        ],
    })

    $('#testbenchValidate').empty()
    $('#testbenchValidate').append(s)
}

/**
 * Validate if all inputs and output elements are present with correct bitwidths
 */
function validate(data: TestData, scope) {
    let invalids = []

    // Check for duplicate identifiers
    if (!checkDistinctIdentifiersData(data)) {
        invalids.push({
            type: VALIDATION_ERRORS.DUPLICATE_ID_DATA,
            identifier: '-',
            message: 'Duplicate identifiers in test data',
        })
    }

    if (!checkDistinctIdentifiersScope(scope)) {
        invalids.push({
            type: VALIDATION_ERRORS.DUPLICATE_ID_SCOPE,
            identifier: '-',
            message: 'Duplicate identifiers in circuit',
        })
    }

    // Don't do further checks if duplicates
    if (invalids.length > 0) return { ok: false, invalids }

    // Validate inputs and outputs
    const inputsValid = validateInputs(data, scope)
    const outputsValid = validateOutputs(data, scope)

    invalids = inputsValid.ok ? invalids : invalids.concat(inputsValid.invalids)
    invalids = outputsValid.ok
        ? invalids
        : invalids.concat(outputsValid.invalids)

    // Validate presence of reset if test is sequential
    if (data.type === 'seq') {
        const resetPresent = scope.Input.some(
            (simulatorReset) =>
                simulatorReset.label === 'RST' &&
                simulatorReset.bitWidth === 1 &&
                simulatorReset.objectType === 'Input'
        )

        if (!resetPresent) {
            invalids.push({
                type: VALIDATION_ERRORS.NO_RST,
                identifier: 'RST',
                message: 'Reset(RST) not present in circuit',
            })
        }
    }

    if (invalids.length > 0) return { ok: false, invalids }
    return { ok: true }
}

/**
 * Autofix whatever is possible in validation errors.
 * returns number of autofixed errors
 */
function validationAutoFix(validationErrors: ValidationErrors) {
    // Currently only autofixes bitwidths
    let fixedErrors = 0
    // Return if no errors
    if (validationErrors.ok) return fixedErrors

    const bitwidthErrors = validationErrors?.invalids?.filter(
        (vError) => vError.type === VALIDATION_ERRORS.WRONGBITWIDTH
    )

    bitwidthErrors?.forEach((bwError) => {
        const { element, expectedBitWidth } = bwError.extraInfo
        element.newBitWidth(expectedBitWidth)
        fixedErrors++
    })

    return fixedErrors
}

/**
 * Checks if all the labels in the test data are unique. Called by validate()
 */
function checkDistinctIdentifiersData(data: TestData) {
    const inputIdentifiersData = data.groups[0].inputs.map(
        (input) => input.label
    )
    const outputIdentifiersData = data.groups[0].outputs.map(
        (output) => output.label
    )
    const identifiersData = inputIdentifiersData.concat(outputIdentifiersData)

    return new Set(identifiersData).size === identifiersData.length
}

/**
 * Checks if all the input/output labels in the scope are unique. Called by validate()
 * TODO: Replace with identifiers
 */
function checkDistinctIdentifiersScope(scope) {
    const inputIdentifiersScope = scope.Input.map((input) => input.label)
    const outputIdentifiersScope = scope.Output.map((output) => output.label)
    let identifiersScope = inputIdentifiersScope.concat(outputIdentifiersScope)

    // Remove identifiers which have not been set yet (ie. empty strings)
    identifiersScope = identifiersScope.filter((identifer) => identifer != '')

    return new Set(identifiersScope).size === identifiersScope.length
}

interface Invalids {
    type: number
    identifier: string
    message: string
    extraInfo?: any
}

/**
 * Validates presence and bitwidths of test inputs in the circuit.
 * Called by validate()
 */
function validateInputs(data: TestData, scope) {
    const invalids: Invalids[] = []

    data.groups[0].inputs.forEach((dataInput) => {
        const matchInput = scope.Input.find(
            (simulatorInput) => simulatorInput.label === dataInput.label
        )

        if (matchInput === undefined) {
            invalids.push({
                type: VALIDATION_ERRORS.NOTPRESENT,
                identifier: dataInput.label,
                message: 'Input is not present in the circuit',
            })
        } else if (matchInput.bitWidth !== dataInput.bitWidth) {
            invalids.push({
                type: VALIDATION_ERRORS.WRONGBITWIDTH,
                identifier: dataInput.label,
                extraInfo: {
                    element: matchInput,
                    expectedBitWidth: dataInput.bitWidth,
                },
                message: `Input bitwidths don't match in circuit and test (${matchInput.bitWidth} vs ${dataInput.bitWidth})`,
            })
        }
    })

    if (invalids.length > 0) return { ok: false, invalids }
    return { ok: true }
}

/**
 * Validates presence and bitwidths of test outputs in the circuit.
 * Called by validate()
 */
function validateOutputs(data: TestData, scope) {
    const invalids: Invalids[] = []

    data.groups[0].outputs.forEach((dataOutput) => {
        const matchOutput = scope.Output.find(
            (simulatorOutput) => simulatorOutput.label === dataOutput.label
        )

        if (matchOutput === undefined) {
            invalids.push({
                type: VALIDATION_ERRORS.NOTPRESENT,
                identifier: dataOutput.label,
                message: 'Output is not present in the circuit',
            })
        } else if (matchOutput.bitWidth !== dataOutput.bitWidth) {
            invalids.push({
                type: VALIDATION_ERRORS.WRONGBITWIDTH,
                identifier: dataOutput.label,
                extraInfo: {
                    element: matchOutput,
                    expectedBitWidth: dataOutput.bitWidth,
                },
                message: `Output bitwidths don't match in circuit and test (${matchOutput.bitWidth} vs ${dataOutput.bitWidth})`,
            })
        }
    })

    if (invalids.length > 0) return { ok: false, invalids }
    return { ok: true }
}

/**
 * Returns object of scope inputs and outputs keyed by their labels
 */
function bindIO(data: TestData, scope) {
    const inputs: { [key: string]: any } = {}
    const outputs: { [key: string]: any } = {}
    let reset

    data.groups[0].inputs.forEach((dataInput) => {
        inputs[dataInput.label] = scope.Input.find(
            (simulatorInput) => simulatorInput.label === dataInput.label
        )
    })

    data.groups[0].outputs.forEach((dataOutput) => {
        outputs[dataOutput.label] = scope.Output.find(
            (simulatorOutput) => simulatorOutput.label === dataOutput.label
        )
    })

    if (data.type === 'seq') {
        reset = scope.Input.find(
            (simulatorOutput) => simulatorOutput.label === 'RST'
        )
    }

    return { inputs, outputs, reset }
}

/**
 * Ticks clock recursively one full cycle (Only used in testbench context)
 */
function tickClock(scope: any) {
    scope.clockTick()
    play(scope)
    scope.clockTick()
    play(scope)
}

/**
 * Triggers reset (Only used in testbench context)
 */
function triggerReset(reset: any, scope: any) {
    reset.state = 1
    play(scope)
    reset.state = 0
    play(scope)
}

/**
 * UI Function
 * Set the current test case result on the UI
 */
function setUIResult(testbenchData: TestBenchData, result) {
    const data = testbenchData.testData
    const groupIndex = testbenchData.currentGroup
    const caseIndex = testbenchData.currentCase
    const resultElement = $('#tb-manual-table-test-result')
    let inputCount = data.groups[0].inputs.length
    resultElement.empty()
    resultElement.append('<td>Result</td>')
    while (inputCount--) {
        resultElement.append('<td> - </td>')
    }

    for (const output of result.keys()) {
        const resultValue = result.get(output)
        const outputData = data.groups[groupIndex].outputs.find(
            (dataOutput) => dataOutput.label === output
        );

        const expectedValue = outputData ? outputData.values[caseIndex] : undefined;
        const color = resultValue === expectedValue ? '#17FC12' : '#FF1616'
        resultElement.append(
            `<td style="color: ${color}">${escapeHtml(resultValue)}</td>`
        )
    }
}

type openCreatorType = 'create' | 'edit' | 'result'

function openCreator(type: openCreatorType, dataString: string = '') {
    if (type === 'create') {
        testBenchStore.toggleTestBenchCreator(true);
        testBenchStore.createCreator(globalScope.id, true);
    }

    if (type === 'edit') {
        testBenchStore.toggleTestBenchCreator(true);
        testBenchStore.createCreator(globalScope.id, true, dataString, "data");
    }

    if (type === 'result') {
        testBenchStore.toggleTestBenchCreator(true);
        testBenchStore.createCreator(globalScope.id, true, dataString, "result");
    }
}
</script>
