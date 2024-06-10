<template>
  <div class="testbench-manual-panel draggable-panel noSelect defaultCursor">
    <div class="panel-header">
      Testbench
      <span class="fas fa-minus-square minimize panel-button"></span>
      <span class="fas fa-external-link-square-alt maximize panel-button-icon"></span>
    </div>
    <div class="panel-body tb-test-not-null tb-panel-hidden">
      <div class="tb-manual-test-data">
        <div style="margin-bottom: 10px; overflow: auto">
          <span id="data-title" class="tb-data"><b>Test:</b> <span></span></span>
          <span id="data-type" class="tb-data"><b>Type:</b> <span></span></span>
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
          <span class="tb-test-label group-label"></span>
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
          <span class="tb-test-label case-label"></span>
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
    <div class="panel-body tb-test-null">
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
    <TestBenchCreator />
  </div>
</template>

<script lang="ts" setup>
import { showMessage, escapeHtml } from '../../../simulator/src/utils';
import { confirmOption } from '#/components/helpers/confirmComponent/ConfirmComponent.vue';
import { scheduleBackup } from '#/simulator/src/data/backupCircuit';
import { changeClockEnable } from '#/simulator/src/sequential';
import { play } from '#/simulator/src/engine';
import TestBenchCreator from "./TestBenchCreator.vue";

/**
 * Checks if all the labels in the test data are unique. Called by validate()
**/
function checkDistinctIdentifiersData(data) {
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
**/
function checkDistinctIdentifiersScope(scope) {
  const inputIdentifiersScope = scope.Input.map((input) => input.label)
  const outputIdentifiersScope = scope.Output.map((output) => output.label)
  let identifiersScope = inputIdentifiersScope.concat(outputIdentifiersScope)

  // Remove identifiers which have not been set yet (ie. empty strings)
  identifiersScope = identifiersScope.filter((identifer) => identifer != '')

  return new Set(identifiersScope).size === identifiersScope.length
}

/**
 * Validates presence and bitwidths of test inputs in the circuit.
 * Called by validate()
**/
function validateInputs(data, scope) {
  const invalids = []

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
**/
function validateOutputs(data, scope) {
  const invalids = []

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
 * Validate if all inputs and output elements are present with correct bitwidths
**/
function validate(data, scope) {
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
 * UI Function
 * Create prompt for the testbench UI when creator is opened
 */
function creatorOpenPrompt(creatorWindow) {
  scheduleBackup()
  const windowSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="white" class="bi bi-window" viewBox="0 0 16 16">
      <path d="M2.5 4a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1zm2-.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0zm1 .5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z"/>
      <path d="M2 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H2zm13 2v2H1V3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1zM2 14a1 1 0 0 1-1-1V6h14v7a1 1 0 0 1-1 1H2z"/>
    </svg>
    `

  const s = `
    <div style="text-align: center;">
        <div style="margin: 20px;">
            ${windowSVG}
        </div>
        <p>A browser pop-up is opened to create the test</p>
        <p>Please save the test to open it here</p>
    </div>
    `

  $('#setTestbenchData').dialog({
    resizable: false,
    width: 'auto',
    buttons: [
      {
        text: 'Close Pop-Up',
        click() {
          $(this).dialog('close')
          creatorWindow.close()
        },
      },
    ],
  })

  $('#setTestbenchData').empty()
  $('#setTestbenchData').append(s)
}

type openCreatorType = 'create' | 'edit' | 'result'
const TESTBENCH_CREATOR_PATH = '/testbench'

/**
 * Use this function to navigate to test creator. This function starts the storage listener
 * so the test is loaded directly into the simulator
**/
function openCreator(type: openCreatorType, dataString: string = '') {
  const popupHeight = 800
  const popupWidth = 1200
  const popupTop = (window.height - popupHeight) / 2
  const popupLeft = (window.width - popupWidth) / 2
  const POPUP_STYLE_STRING = `height=${popupHeight},width=${popupWidth},top=${popupTop},left=${popupLeft}`
  let popUp

  /* Listener to catch testData from pop up and load it onto the testbench */
  const dataListener = (message) => {
    console.log(message);
    if (
      message.origin !== window.origin ||
      message.data.type !== 'testData'
    )
      return

    // Check if the current scope requested the creator pop up
    const data = JSON.parse(message.data.data)

    // Unbind event listener
    window.removeEventListener('message', dataListener)

    // If scopeID does not match, do nothing and return
    if (data.scopeID != globalScope.id) return

    // Load test data onto the scope
    runTestBench(data.testData, globalScope, CONTEXT.CONTEXT_SIMULATOR)

    // Close the 'Pop up is open' dialog
    $('#setTestbenchData').dialog('close')
  }

  if (type === 'create') {
    const url = `${TESTBENCH_CREATOR_PATH}?scopeID=${globalScope.id}&popUp=true`
    popUp = window.open(url, 'popupWindow', POPUP_STYLE_STRING)
    creatorOpenPrompt(popUp)
    window.addEventListener('message', dataListener)
  }

  if (type === 'edit') {
    const url = `${TESTBENCH_CREATOR_PATH}?scopeID=${globalScope.id}&data=${dataString}&popUp=true`
    popUp = window.open(url, 'popupWindow', POPUP_STYLE_STRING)
    creatorOpenPrompt(popUp)
    window.addEventListener('message', dataListener)
  }

  if (type === 'result') {
    const url = `${TESTBENCH_CREATOR_PATH}?scopeID=${globalScope.id}&result=${dataString}&popUp=true`
    popUp = window.open(url, 'popupWindow', POPUP_STYLE_STRING)
  }

  // Check if popup was closed (in case it was closed by window's X button),
  // then close 'popup open' dialog
  if (popUp && type !== 'result') {
    const checkPopUp = setInterval(() => {
      if (popUp.closed) {
        // Close the dialog if it's open
        if ($('#setTestbenchData').dialog('isOpen'))
          $('#setTestbenchData').dialog('close')

        // Remove the event listener that listens for data from popup
        window.removeEventListener('message', dataListener)
        clearInterval(checkPopUp)
      }
    }, 1000)
  }
}

/**
 * Autofix whatever is possible in validation errors.
 * returns number of autofixed errors
**/
function validationAutoFix(validationErrors) {
  // Currently only autofixes bitwidths
  let fixedErrors = 0
  // Return if no errors
  if (validationErrors.ok) return fixedErrors

  const bitwidthErrors = validationErrors.invalids.filter(
    (vError) => vError.type === VALIDATION_ERRORS.WRONGBITWIDTH
  )

  bitwidthErrors.forEach((bwError) => {
    const { element, expectedBitWidth } = bwError.extraInfo
    element.newBitWidth(expectedBitWidth)
    fixedErrors++
  })

  return fixedErrors
}

function showValidationUI(validationErrors) {
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

    validationErrors.invalids.forEach((vError) => {
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
 * UI Function
 * Set current test case data on the UI
 **/
function setUICurrentCase(testbenchData) {
  const data = testbenchData.testData
  const groupIndex = testbenchData.currentGroup
  const caseIndex = testbenchData.currentCase

  const currCaseElement = $('#tb-manual-table-current-case')
  currCaseElement.empty()
  currCaseElement.append('<td>Current Case</td>')
  $('#tb-manual-table-test-result').empty()
  $('#tb-manual-table-test-result').append('<td>Result</td>')

  data.groups[groupIndex].inputs.forEach((input) => {
    currCaseElement.append(
      `<td>${escapeHtml(input.values[caseIndex])}</td>`
    )
  })

  data.groups[groupIndex].outputs.forEach((output) => {
    currCaseElement.append(
      `<td>${escapeHtml(output.values[caseIndex])}</td>`
    )
  })

  $('.testbench-manual-panel .group-label').text(
    data.groups[groupIndex].label
  )
  $('.testbench-manual-panel .case-label').text(caseIndex + 1)
}

/**
 * Set and propogate the input values according to the testcase.
 * Called by runSingle() and runAll()
**/
function setInputValues(inputs, group, caseIndex, scope) {
  group.inputs.forEach((input) => {
    inputs[input.label].state = parseInt(input.values[caseIndex], 2)
  })

  // Propagate inputs
  play(scope)
}

/**
 * Returns object of scope inputs and outputs keyed by their labels
**/
function bindIO(data, scope) {
  const inputs = {}
  const outputs = {}
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

// Do we have any other function to do this?
// Utility function. Converts decimal number to binary string
function dec2bin(dec, bitWidth = undefined) {
  if (dec === undefined) return 'X'
  const bin = (dec >>> 0).toString(2)
  if (!bitWidth) return bin

  return '0'.repeat(bitWidth - bin.length) + bin
}

/**
 * Gets Output values as a Map with keys as output name and value as output state
**/
function getOutputValues(data, outputs) {
  const values = new Map()

  data.groups[0].outputs.forEach((dataOutput) => {
    // Using node value because output state only changes on rendering
    const resultValue = outputs[dataOutput.label].nodeList[0].value
    const resultBW = outputs[dataOutput.label].nodeList[0].bitWidth
    values.set(dataOutput.label, dec2bin(resultValue, resultBW))
  })

  return values
}

/**
 * Runs single combinational test
**/
function runSingleCombinational(testbenchData, scope) {
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
 * Triggers reset (Only used in testbench context)
**/
function triggerReset(reset, scope) {
  reset.state = 1
  play(scope)
  reset.state = 0
  play(scope)
}

/**
 * Ticks clock recursively one full cycle (Only used in testbench context)
**/
function tickClock(scope) {
  scope.clockTick()
  play(scope)
  scope.clockTick()
  play(scope)
}

/**
 * Runs single sequential test and all tests above it in the group
 * Used in MANUAL mode
**/
function runSingleSequential(testbenchData, scope) {
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
 * Runs single test
**/
function runSingleTest(testbenchData, scope) {
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
 * UI Function
 * Set the current test case result on the UI
**/
function setUIResult(testbenchData, result) {
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
    const expectedValue = data.groups[groupIndex].outputs.find(
      (dataOutput) => dataOutput.label === output
    ).values[caseIndex]
    const color = resultValue === expectedValue ? '#17FC12' : '#FF1616'
    resultElement.append(
      `<td style="color: ${color}">${escapeHtml(resultValue)}</td>`
    )
  }
}

const buttonListenerFunctions = {
  previousCaseButton: () => {
    const isValid = validate(
      globalScope.testbenchData.testData,
      globalScope
    )
    if (!isValid.ok) {
      showMessage(
        'Testbench: Some elements missing from circuit. Click Validate to know more'
      )
      return
    }
    globalScope.testbenchData.casePrev()
    buttonListenerFunctions.computeCase()
  },

  nextCaseButton: () => {
    const isValid = validate(
      globalScope.testbenchData.testData,
      globalScope
    )
    if (!isValid.ok) {
      showMessage(
        'Testbench: Some elements missing from circuit. Click Validate to know more'
      )
      return
    }
    globalScope.testbenchData.caseNext()
    buttonListenerFunctions.computeCase()
  },

  previousGroupButton: () => {
    const isValid = validate(
      globalScope.testbenchData.testData,
      globalScope
    )
    if (!isValid.ok) {
      showMessage(
        'Testbench: Some elements missing from circuit. Click Validate to know more'
      )
      return
    }
    globalScope.testbenchData.groupPrev()
    buttonListenerFunctions.computeCase()
  },

  nextGroupButton: () => {
    const isValid = validate(
      globalScope.testbenchData.testData,
      globalScope
    )
    if (!isValid.ok) {
      showMessage(
        'Testbench: Some elements missing from circuit. Click Validate to know more'
      )
      return
    }
    globalScope.testbenchData.groupNext()
    buttonListenerFunctions.computeCase()
  },

  changeTestButton: () => {
    openCreator('create')
  },

  runAllButton: () => {
    const isValid = validate(
      globalScope.testbenchData.testData,
      globalScope
    )
    if (!isValid.ok) {
      showMessage(
        'Testbench: Some elements missing from circuit. Click Validate to know more'
      )
      return
    }
    const results = runAll(globalScope.testbenchData.testData, globalScope)
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
      globalScope.testbenchData.testData
    )
    openCreator('edit', editDataString)
  },

  validateButton: () => {
    const isValid = validate(
      globalScope.testbenchData.testData,
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
      globalScope.testbenchData = undefined
      setupTestbenchUI()
    }
  },

  attachTestButton: () => {
    openCreator('create')
  },

  rerunTestButton: () => {
    buttonListenerFunctions.computeCase()
  },

  computeCase: () => {
    setUICurrentCase(globalScope.testbenchData)
    const result = runSingleTest(globalScope.testbenchData, globalScope)
    setUIResult(globalScope.testbenchData, result)
  },
}
</script>