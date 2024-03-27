/*
    This file contains all javascript related to the test creator UI
    at /testbench
*/

import _ from '../vendor/table2csv'

const CREATORMODE = {
    NORMAL: 0,
    SIMULATOR_POPUP: 1,
}

var testMode = 'comb'
var groupIndex = 0
var inputCount = 0
var nextInputIndex = 0
var outputCount = 0
var nextOutputIndex = 0
var cases = [0]
var creatorMode = CREATORMODE.NORMAL
var circuitScopeID

function dataReset() {
    groupIndex = -1
    cases = [0]
}

/**
 * Onload, check if it is opened in a popup.
 * Check if test is being edited, or created
 */
window.onload = () => {
    const query = new URLSearchParams(window.location.search)
    if (query.has('popUp')) {
        if (query.get('popUp') == 'true') {
            creatorMode = CREATORMODE.SIMULATOR_POPUP
            let rightButtonGroup = document.querySelector('.right-button-group')
            let button = document.createElement('button')
            button.className = 'lower-button save-buton'
            button.textContent = 'Attach'
            button.addEventListener('click', saveData)
            rightButtonGroup.appendChild(button)
        }
    }
    let creatorHead = document.querySelector('#tb-creator-head')
    if (query.has('data')) {
        creatorHead.innerHTML = '<b>Edit Test</b>'
        circuitScopeID = query.get('scopeID')
        loadData(query.get('data'))
        return
    }

    if (query.has('result')) {
        creatorHead.innerHTML = '<b>Test Result</b>'
        loadResult(query.get('result'))
        readOnlyUI()
        return
    }

    circuitScopeID = query.get('scopeID')
    addInput()
    addOutput()
    makeSortable()
}

/* Change UI testMode between Combinational(comb) and Sequential(seq) */
function changeTestMode(m) {
    if (testMode === m) return false
    dataReset()
    testMode = m
    document.querySelector('#combSelect').classList.remove('tab-selected')
    document.querySelector('#seqSelect').classList.remove('tab-selected')
    document.querySelector('#tb-new-group').style.visibility =
        m === 'seq' ? 'visible' : 'hidden'
    document.querySelector(`#${m}Select`).classList.add('tab-selected')
    document.querySelector('#dataGroup').innerHTML = ''

    return true
}

/* Adds case to a group */
function addCase(grp) {
    const currentGroupTable = document.querySelector(`#data-table-${grp + 1}`)

    let s =
        '<tr><td class="tb-handle"><div onclick="deleteCase($(this))"class="fa fa-minus-square tb-minus"></div></td>\n'
    for (let i = 0; i < inputCount + outputCount; i++)
        s += '<td contenteditable="true">0</td>'
    s += '</tr>'

    // Sortable hack
    currentGroupTable.querySelector('tbody').remove()
    currentGroupTable.appendChild(s)
}

/* Deletes case from a group */
function deleteCase(element) {
    const row = element.parent().parent()
    const grp = Number(row.parent().attr('id').split('-').pop())

    row.remove()
}

/* Adds group with default name 'Group N' or name supplied in @param groupName */
/* Used without params by UI, used with params by loadData() */
function addGroup(
    groupName = `${testMode === 'comb' ? 'Group' : 'Set'} ${groupIndex + 2}`
) {
    document.querySelector('.plus-button').classList.remove('latest-button')
    groupIndex++

    const s = `
    <div id="data-group-${groupIndex + 1}" class="data-group">
        <h3 id="data-group-title-${
            groupIndex + 1
        }" contenteditable="true">${escapeHtml(groupName)}</h3>
        <h5 class="data-group-info">Click + to add tests to the ${
            testMode === 'comb' ? 'group' : 'set'
        }</h5>
        <table class="tb-table" id="data-table-${groupIndex + 1}">
        <tbody></tbody>
        </table>
        <button class="lower-button plus-button latest-button" id="plus-${
            groupIndex + 1
        }" onclick="addCase(${groupIndex})" style="font-size: 25px;">+</button>
    </div>
    `
    cases[groupIndex] = 0
    document.querySelector('#dataGroup').appendChild(s)

    makeSortable()
}

/* Deletes a group */
function deleteGroup(element) {
    const groupDiv = element.parent()
    const grp = Number(groupDiv.attr('id').split('-').pop())
    groupDiv.remove()
}

/* Adds input with default value 0 or values supplied in @param inputData */
/* Used without params for UI, used with params by loadData() */
function addInput(
    label = `inp${nextInputIndex + 1}`,
    bitwidth = 1,
    inputData = []
) {
    nextInputIndex++
    inputCount++
    // Change head table contents
    const sHead = `<th style="background-color: #aaf" id="tb-inp-label-${nextInputIndex}"><span contenteditable="true">${escapeHtml(
        label
    )}</span> <a onclick="deleteInput($(this));"><span class="fa fa-minus-square tb-minus"></span></a></th>`
    const sData = `<td contenteditable="true">${escapeHtml(
        bitwidth.toString()
    )}</td>`
    let testBenchTable = document.querySelector('#testBenchTable')
    testBenchTable
        .querySelector('tr')[1]
        .querySelector('th')
        [inputCount - 1].insertAdjacentHTML('afterend', sHead)
    testBenchTable
        .querySelector('tr')[2]
        .querySelector('td')
        [inputCount - 1].insertAdjacentHTML('afterend', sData)

    let inputHead = document.querySelector('#tb-inputs-head')
    inputHead.setAttribute('colspan', inputCount)

    // Change data tables' contents

    let dataGroup = document.querySelector('#dataGroup')
    let tables = dataGroup.querySelector('table')

    for (let group_i = 0; group_i < tables.length; group_i++) {
        let currentTable = tables[group_i]

        let rows = currentTable.querySelector('tr')

        for (let case_i = 0; case_i < rows.length; case_i++) {
            let currentRow = rows[case_i]

            let newTd = document.createElement('td')
            newTd.setAttribute('contenteditable', 'true')

            let content = inputData.length
                ? escapeHtml(inputData[group_i][case_i])
                : 0
            newTd.innerHTML = content

            let targetTd = currentRow.getElementsByTagName('td')[inputCount - 1]
            targetTd.parentNode.insertBefore(newTd, targetTd.nextSibling)
        }
    }
}

/* Adds output with default value 0 or values supplied in @param outputData */
/* Used without params for UI, used with params by loadData() */
/* Used with resultData and result=true for setting result */
function addOutput(
    label = `out${nextOutputIndex + 1}`,
    bitwidth = 1,
    outputData = [],
    result = false,
    resultData = []
) {
    nextOutputIndex++
    outputCount++
    // Change head table contents
    let sHead = `<th style="background-color: #afa" id="tb-out-label-${nextOutputIndex}"><span contenteditable="true">${escapeHtml(
        label
    )}</span> <a onclick="deleteOutput($(this));"><span class="fa fa-minus-square tb-minus"></span></a></th>`
    let sData = `<td contenteditable="true">${escapeHtml(
        bitwidth.toString()
    )}</td>`

    // If result then set colspan to 2
    if (result) {
        sHead = `<th style="background-color: #afa" id="tb-out-label-${nextOutputIndex}" colspan="2"><span contenteditable="true">${escapeHtml(
            label
        )}</span> <a onclick="deleteOutput($(this));"><span class="fa fa-minus-square tb-minus"></span></a></th>`
        sData = `<td contenteditable="true" colspan="2">${escapeHtml(
            bitwidth.toString()
        )}</td>`
    }
    testBenchTable
        .querySelector('tr')[1]
        .querySelector('th')
        [inputCount + outputCount - 1].insertAdjacentHTML('afterend', sHead)
    testBenchTable
        .querySelector('tr')[2]
        .querySelector('td')
        [inputCount + outputCount - 1].insertAdjacentHTML('afterend', sData)
    // If not result then colspan is outputCount
    let outputHead = document.querySelector('tb-outputs-head')
    outputHead.setAttribute('colspan', outputCount)
    // else it's 2*outputCount
    if (result) {
        outputHead.setAttribute('colspan', 2 * outputCount)
    }

    // Change data tables' contents

    // If not result just add the outputs

    if (!result) {
        for (let group_i = 0; group_i < tables.length; group_i++) {
            let currentTable = tables[group_i]

            let rows = currentTable.querySelector('tr')

            for (let case_i = 0; case_i < rows.length; case_i++) {
                let currentRow = rows[case_i]

                let newTd = document.createElement('td')
                newTd.setAttribute('contenteditable', 'true')

                let content = outputData.length
                    ? escapeHtml(outputData[group_i][case_i])
                    : 0
                newTd.innerHTML = content

                let targetTd =
                    currentRow.getElementsByTagName('td')[
                        inputCount + outputCount - 1
                    ]
                targetTd.parentNode.insertBefore(newTd, targetTd.nextSibling)
            }
        }

        // If result then add results besides the outputs
        // Hacky
    } else {
        for (let group_i = 0; group_i < tables.length; group_i++) {
            let currentTable = tables[group_i]

            let rows = currentTable.getElementsByTagName('tr')

            for (let case_i = 0; case_i < rows.length; case_i++) {
                let currentRow = rows[case_i]

                let outputCellData = document.createElement('td')
                outputCellData.innerHTML = escapeHtml(
                    outputData[group_i][case_i]
                )
                currentRow.insertBefore(
                    outputCellData,
                    currentRow.getElementsByTagName('td')[
                        inputCount + 2 * (outputCount - 1)
                    ].nextSibling
                )

                let resultColor =
                    resultData[group_i][case_i] === outputData[group_i][case_i]
                        ? 'green'
                        : 'red'
                let resultCellData = document.createElement('td')
                resultCellData.style.color = resultColor
                resultCellData.innerHTML = escapeHtml(
                    resultData[group_i][case_i]
                )
                currentRow.insertBefore(
                    resultCellData,
                    currentRow.getElementsByTagName('td')[
                        inputCount + 2 * outputCount - 1
                    ].nextSibling
                )
            }
        }
    }
}

/* Deletes input unless there's only one input */
function deleteInput(element) {
    if (inputCount === 1) return
    const columnIndex = element.parent().eq(0).index()

    let testBenchTableRows = document.querySelectorAll(
        '#testBenchTable tr, .data-group tr'
    )

    for (let i = 1; i < testBenchTableRows.length; i++) {
        let currentRow = testBenchTableRows[i]

        let cells = currentRow.querySelectorAll('td, th')

        let targetCell = cells[columnIndex]
        targetCell.parentNode.removeChild(targetCell)
    }

    inputCount--
    inputHead.setAttribute('colspan', inputCount)
}

/* Deletes output unless there's only one output */
function deleteOutput(element) {
    if (outputCount === 1) return
    const columnIndex = element.parent().eq(0).index()

    for (let i = 1; i < testBenchTableRows.length; i++) {
        let currentRow = testBenchTableRows[i]

        let cells = currentRow.querySelectorAll('td, th')

        let targetCell = cells[columnIndex]
        targetCell.parentNode.removeChild(targetCell)
    }

    outputCount--
    outputHead.setAttribute('colspan', outputCount)
}

/* Returns input/output(keys) and their bitwidths(values) */
/* Called by getData() */
function getBitWidths() {
    const bitwidths = {}
    let secondRow = testBenchTable.querySelector('tr')[1]
    let thElements = secondRow.querySelectorAll('th')
    thElements = Array.from(thElements).slice(1)

    thElements.forEach(function (th, index) {
        let inp = th.textContent

        let tdElement = testBenchTable
            .querySelector('tr')[2]
            .querySelectorAll('td')[index + 1]

        let bw = tdElement.innerHTML
        bitwidths[inp] = Number(bw)
    })
    return bitwidths
}

/* Returns data for all the groups for all inputs and outputs */
/* Called by parse() */
function getData() {
    const bitwidths = getBitWidths()
    const groups = []
    const groupCount = document.querySelector('#dataGroup').childElementCount
    for (let group_i = 0; group_i < groupCount; group_i++) {
        const group = {}
        group.label = getGroupTitle(group_i)
        group.inputs = []
        group.outputs = []

        const group_table = document.querySelector(`#data-table-${group_i + 1}`)
        group.n = group_table.querySelectorAll('tr').length

        // Push all the inputs in the group
        for (let inp_i = 0; inp_i < inputCount; inp_i++) {
            const label = Object.keys(bitwidths)[inp_i]
            const input = {
                label: label.slice(0, label.length - 1),
                bitWidth: bitwidths[label],
                values: [],
            }

            group_table.querySelectorAll('tr').forEach((row) => {
                let cells = row.querySelectorAll('td')
                cells = Array.from(cells).slice(1)

                let cellValue = cells[inp_i].innerHTML
                input.push(cellValue)
            })

            group.inputs.push(input)
        }

        // Push all the outputs in the group
        for (let out_i = 0; out_i < outputCount; out_i++) {
            const label = Object.keys(bitwidths)[inputCount + out_i]
            const output = {
                label: label.slice(0, label.length - 1),
                bitWidth: bitwidths[label],
                values: [],
            }

            group_table.querySelectorAll('tr').forEach((row) => {
                let cells = row.querySelectorAll('td')
                cells = Array.from(cells).slice(1)

                let cellValue = cells[inputCount + out_i].innerHTML

                output.push(cellValue)
            })

            group.outputs.push(output)
        }

        groups.push(group)
    }

    return groups
}

function getTestTitle() {
    return document.querySelector('#test-title-label').textContent
}

function getGroupTitle(group_i) {
    return document.querySelector(`#data-group-title-${group_i + 1}`)
        .textContent
}

/* Parse UI table into Javascript Object */
function parse() {
    const data = {}
    const tableData = getData()
    data.type = testMode
    data.title = getTestTitle()
    data.groups = tableData
    return data
}

/* Export test data as a CSV file */
function exportAsCSV() {
    let csvData = ''
    csvData += 'Title,Test Type,Input Count,Output Count\n'
    csvData += `${getTestTitle()},${testMode},${inputCount},${outputCount}\n\n\n`
    csvData += document.querySelector('table')[0].table2CSV()
    csvData += '\n\n'

    document
        .querySelectorAll('table:not(:first-of-type)')
        .forEach(function (table, group_i) {
            csvData += getGroupTitle(group_i)
            csvData += '\n'

            csvData += tableToCSV(table)
            csvData += '\n\n'
        })

    download(`${getTestTitle()}.csv`, csvData)
    return csvData
}

/*
 Imports data from CSV and loads into the table
 To achieve this, first converts to JSON then uses request param to load json to table
*/
function importFromCSV() {
    const file = document.querySelector('csvFileInput').files[0]
    const reader = new FileReader()

    // If circuitScopeID exists, ie. if popup opened from testbench, then use that to redirect
    const query = new URLSearchParams(window.location.search)
    // Preserve popup status while redirecting
    const isPopup = query.get('popUp') || false

    // When the file is read, redirect to the data location
    reader.onload = () => {
        const csvContent = reader.result
        const jsonData = csv2json(csvContent, 1, 1)

        window.location = `/testbench?scopeID=${
            circuitScopeID || ''
        }&data=${jsonData}&popUp=${isPopup}`
    }

    reader.readAsText(file)
}

// Clicks the hidden upload file button, entrypoint into importFromCSV()
// The hidden button in-turn calls importFromCSV()
function clickUpload() {
    document.querySelector('csvFileInput').click()
}

/* Converts CSV to JSON to be loaded into the table */
function csv2json(csvFileData) {
    const stripQuotes = (str) => str.replaceAll('"', '')

    /* Extracts bitwidths from the csv data */
    const getBitWidthsCSV = (csvDataBW) => {
        const testMetadata = csvDataBW.split('\n\n')[0].split('\n')
        const labels = testMetadata[1]
            .split(',')
            .slice(1)
            .map((label) => stripQuotes(label))
        const bitWidths = testMetadata[2]
            .split(',')
            .slice(1)
            .map((bw) => Number(stripQuotes(bw)))

        return { labels, bitWidths }
    }

    const csvMetadata = csvFileData.split('\n\n\n')[0].split('\n')[1].split(',')
    const csvData = csvFileData.split('\n\n\n')[1]
    const jsonData = {}

    jsonData.title = csvMetadata[0]
    jsonData.type = csvMetadata[1]
    const inputCountCSV = Number(csvMetadata[2])
    const outputCountCSV = Number(csvMetadata[3])

    jsonData.groups = []
    const { labels, bitWidths } = getBitWidthsCSV(csvData)

    const groups = csvData.split('\n\n').slice(1)
    for (let group_i = 0; group_i < groups.length - 1; group_i++) {
        const rows = groups[group_i].split('\n')
        jsonData.groups[group_i] = {
            label: rows[0],
            n: rows.length - 1,
            inputs: [],
            outputs: [],
        }

        // Parse Inputs
        for (let input_i = 0; input_i < inputCountCSV; input_i++) {
            const thisInput = {
                label: labels[input_i],
                bitWidth: bitWidths[input_i],
                values: [],
            }
            for (let case_i = 1; case_i < rows.length; case_i++)
                thisInput.values.push(
                    stripQuotes(rows[case_i].split(',')[input_i + 1])
                )

            jsonData.groups[group_i].inputs.push(thisInput)
        }

        // Parse Outputs
        for (
            let output_i = inputCountCSV;
            output_i < inputCountCSV + outputCountCSV;
            output_i++
        ) {
            const thisOutput = {
                label: labels[output_i],
                bitWidth: bitWidths[output_i],
                values: [],
            }
            for (let case_i = 1; case_i < rows.length; case_i++) {
                thisOutput.values.push(
                    stripQuotes(rows[case_i].split(',')[output_i + 1])
                )
            }

            jsonData.groups[group_i].outputs.push(thisOutput)
        }
    }

    return JSON.stringify(jsonData)
}

/* Helper function to download generated file */
function download(filename, text) {
    var element = document.createElement('a')
    element.setAttribute(
        'href',
        `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`
    )
    element.setAttribute('download', filename)

    element.style.display = 'none'
    document.body.appendChild(element)

    element.click()

    document.body.removeChild(element)
}

/**
 * Called when Save is clicked. If opened in popup, sends message to parent window
 * to attach test to the testbench.
 */
function saveData() {
    const testData = parse()

    if (creatorMode === CREATORMODE.SIMULATOR_POPUP) {
        const postData = { scopeID: circuitScopeID, testData }
        window.opener.postMessage(
            { type: 'testData', data: JSON.stringify(postData) },
            '*'
        )
        window.close()
    }
}

/* Loads data from JSON string into the table */
function loadData(dataJSON) {
    const data = JSON.parse(dataJSON)
    if (data.title) {
        document.querySelector('#test-title-label').textContent = data.title
    }
    changeTestMode()
    changeTestMode(data.type)
    for (let group_i = 0; group_i < data.groups.length; group_i++) {
        const group = data.groups[group_i]
        addGroup(group.label)
        for (let case_i = 0; case_i < group.inputs[0].values.length; case_i++) {
            addCase(group_i)
        }
    }

    // Add input values
    for (let input_i = 0; input_i < data.groups[0].inputs.length; input_i++) {
        const input = data.groups[0].inputs[input_i]
        const values = data.groups.map((group) => group.inputs[input_i].values)

        addInput(input.label, input.bitWidth, values)
    }

    // Add output values
    for (
        let output_i = 0;
        output_i < data.groups[0].outputs.length;
        output_i++
    ) {
        const output = data.groups[0].outputs[output_i]
        const values = data.groups.map(
            (group) => group.outputs[output_i].values
        )

        addOutput(output.label, output.bitWidth, values)
    }
}

/**
 * Loads result from JSON string into the testbench creator UI
 */
function loadResult(dataJSON) {
    const data = JSON.parse(dataJSON)
    if (data.title) {
        document.querySelector('#test-title-label').textContent = data.title
    }
    changeTestMode()
    changeTestMode(data.type)
    for (let group_i = 0; group_i < data.groups.length; group_i++) {
        const group = data.groups[group_i]
        addGroup(group.label)
        for (let case_i = 0; case_i < group.inputs[0].values.length; case_i++) {
            addCase(group_i)
        }
    }

    // Add input values
    for (let input_i = 0; input_i < data.groups[0].inputs.length; input_i++) {
        const input = data.groups[0].inputs[input_i]
        const values = data.groups.map((group) => group.inputs[input_i].values)

        addInput(input.label, input.bitWidth, values)
    }

    // Add output values
    for (
        let output_i = 0;
        output_i < data.groups[0].outputs.length;
        output_i++
    ) {
        const output = data.groups[0].outputs[output_i]
        const values = data.groups.map(
            (group) => group.outputs[output_i].values
        )
        const results = data.groups.map(
            (group) => group.outputs[output_i].results
        )
        const expectedOutputs = []
        const actualOutputs = []

        for (let group_i = 0; group_i < values.length; group_i++) {
            const groupExpectedOuts = []
            const groupActualOuts = []
            for (let val_i = 0; val_i < values[group_i].length; val_i++) {
                groupExpectedOuts.push(values[group_i][val_i])
                groupActualOuts.push(results[group_i][val_i])
            }

            expectedOutputs.push(groupExpectedOuts)
            actualOutputs.push(groupActualOuts)
        }
        addOutput(
            `${output.label}`,
            output.bitWidth,
            expectedOutputs,
            true,
            actualOutputs
        )
    }
}

/**
 * Makes the UI read only for displaying results
 */
function readOnlyUI() {
    makeContentUneditable()
    makeUnsortable()
    document.querySelectorAll(
        '.lower-button, .table-button, .tb-minus'
    ).style.display = 'none'
    document.querySelectorAll('.tablink').forEach((tablink) => {
        tablink.disabled = true
    })

    document.querySelectorAll('.tablink').forEach((tablink) => {
        tablink.classList.remove('tablink-no-override')
    })
    document.querySelector('.data-group-info').textContent = ' '
}

function makeContentUneditable() {
    let elements = document.querySelectorAll(
        'body td, body th, body span, body h3, body div'
    )

    elements.forEach(function (element) {
        element.setAttribute('contenteditable', 'false')
    })
}

function makeSortable() {
    const helper = function (e, ui) {
        const helperE = ui.clone()
        helperE.children().each(function (child_i) {
            $(this).width(ui.children().eq(child_i).width())
        })

        return helperE
    }

    function makePlaceholder(e, ui) {
        ui.placeholder.children().each(function () {
            $(this).css('border', '0px')
        })
    }

    /*
        Sortable hack: To allow sorting inside empty tables, the tables should have some height.
        But it is not possible to give tables height without having rows, so we add a tbody.
        tbody gives the table height but messes up all the other things. So we only keep tbody
        if the table has no rows, and once table gets rows, we remove that tbody
     */
    function removeTbody(e, ui) {
        e.target.querySelectorAll('tbody').forEach((tbodyElement) => {
            tbodyElement.parentNode.removeChild(tbodyElement)
        })
    }

    function createTbody(e, ui) {
        if (e.target.querySelectorAll('tr, body').length === 0) {
            e.target.appendChild(document.createElement('tbody'))
        }
    }

    var dataGroupTables = document.querySelectorAll('.data-group table')

    dataGroupTables.forEach(function (table) {
        table.addEventListener('dragstart', function (event) {
            var tr = event.target.closest('tr')
            if (tr) {
                event.dataTransfer.setData('text/plain', '')
                event.dataTransfer.effectAllowed = 'move'
                tr.classList.add('dragging')
            }
        })

        table.addEventListener('dragover', function (event) {
            event.preventDefault()
            var tr = event.target.closest('tr')
            var draggingElement = table.querySelector('.dragging')
            if (tr && draggingElement) {
                var rect = tr.getBoundingClientRect()
                var offsetY = event.clientY - rect.top
                if (offsetY > rect.height / 2) {
                    tr.parentNode.insertBefore(draggingElement, tr.nextSibling)
                } else {
                    tr.parentNode.insertBefore(draggingElement, tr)
                }
            }
        })

        table.addEventListener('dragend', function (event) {
            var draggingElement = table.querySelector('.dragging')
            if (draggingElement) {
                draggingElement.classList.remove('dragging')
            }
        })
    })
}

function makeUnsortable() {
var dataGroupTables = document.querySelectorAll('.data-group table');

dataGroupTables.forEach(function(table) {
    table.draggable = false;  

    table.addEventListener('dragstart', (event) => {
        event.preventDefault();
    });
});

}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

// Making HTML called functions global

window.addGroup = addGroup
window.deleteGroup = deleteGroup
window.addCase = addCase
window.deleteCase = deleteCase
window.addInput = addInput
window.deleteInput = deleteInput
window.addOutput = addOutput
window.deleteOutput = deleteOutput
window.parse = parse
window.saveData = saveData
window.changeTestMode = changeTestMode
window.exportAsCSV = exportAsCSV
window.importFromCSV = importFromCSV
window.csv2json = csv2json
window.clickUpload = clickUpload
