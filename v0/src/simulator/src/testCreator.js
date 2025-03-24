/*
    This file contains all javascript related to the test creator UI at /testbench
*/

import _ from '../vendor/table2csv'

// Constants for creator mode
const CREATORMODE = {
    NORMAL: 0,
    SIMULATOR_POPUP: 1,
}

// State management object
const state = {
    testMode: 'comb',
    groupIndex: 0,
    inputCount: 0,
    nextInputIndex: 0,
    outputCount: 0,
    nextOutputIndex: 0,
    cases: [0],
    creatorMode: CREATORMODE.NORMAL,
    circuitScopeID: null,
}

function resetData() {
    state.groupIndex = -1
    state.cases = [0]
}

/**
 * Onload, initialize UI based on query parameters
 */
window.onload = () => {
    console.log('window.onload triggered');
    const query = new URLSearchParams(window.location.search);
    console.log('Query params:', Object.fromEntries(query));

    try {
        if (query.has('popUp') && query.get('popUp') === 'true') {
            state.creatorMode = CREATORMODE.SIMULATOR_POPUP;
            const attachButton = '<button class="lower-button save-buton" onclick="saveData();">Attach</button>';
            if ($('.right-button-group').length) {
                $('.right-button-group').append(attachButton);
                console.log('Attach button added');
            } else {
                console.warn('.right-button-group not found');
            }
        }
        if (query.has('data')) {
            $('#tb-creator-head').html('<b>Edit Test</b>');
            state.circuitScopeID = query.get('scopeID');
            loadData(query.get('data'));
            return;
        }
        if (query.has('result')) {
            $('#tb-creator-head').html('<b>Test Result</b>');
            loadResult(query.get('result'));
            readOnlyUI();
            return;
        }
        state.circuitScopeID = query.get('scopeID');
        console.log('Initializing default UI with scopeID:', state.circuitScopeID);
        if ($('#testBenchTable').length) {
            addInput();
            addOutput();
            addGroup(); // Ensure at least one group is added
            makeSortable();
        } else {
            console.error('#testBenchTable not found in DOM');
            alert('Error: Testbench UI failed to initialize. Required DOM elements are missing.');
        }
    } catch (e) {
        console.error('Error in window.onload:', e);
        alert('Failed to load testbench UI. Check console for details.');
    }
}

/**
 * Change UI testMode between Combinational(comb) and Sequential(seq)
 * @param {string} mode - 'comb' or 'seq'
 */
function changeTestMode(mode) {
    if (state.testMode === mode) return false;
    resetData();
    state.testMode = mode;
    $('#combSelect').removeClass('tab-selected');
    $('#seqSelect').removeClass('tab-selected');
    $('#tb-new-group').css('visibility', mode === 'seq' ? 'visible' : 'hidden');
    $(`#${mode}Select`).addClass('tab-selected');
    $('#dataGroup').empty();
    addGroup(); // Add a default group after mode change
    console.log(`Test mode changed to ${mode}`);
    return true;
}

/**
 * Adds a case to a group
 * @param {number} grp - Group index
 */
function addCase(grp) {
    const currentGroupTable = $(`#data-table-${grp + 1}`);
    if (!currentGroupTable.length) {
        console.error(`Group table #data-table-${grp + 1} not found`);
        return;
    }
    const s = `
        <tr>
            <td class="tb-handle"><div onclick="deleteCase($(this))" class="fa fa-minus-square tb-minus"></div></td>
            ${Array(state.inputCount + state.outputCount)
                .fill()
                .map(() => '<td contenteditable="true">0</td>')
                .join('')}
        </tr>
    `;
    currentGroupTable.find('tbody').append(s);
    state.cases[grp]++;
    console.log(`Added case to group ${grp}, total cases: ${state.cases[grp]}`);
}

/**
 * Deletes a case from a group
 * @param {jQuery} element - The minus button element
 */
function deleteCase(element) {
    const row = element.parent().parent();
    const grp = Number(row.parent().parent().attr('id').split('-').pop()) - 1;
    row.remove();
    state.cases[grp]--;
    console.log(`Deleted case from group ${grp}, remaining cases: ${state.cases[grp]}`);
}

/**
 * Adds a group with a default or specified name
 * @param {string} [groupName] - Custom group name
 */
function addGroup(groupName = `${state.testMode === 'comb' ? 'Group' : 'Set'} ${state.groupIndex + 2}`) {
    $('.plus-button').removeClass('latest-button');
    state.groupIndex++;
    const s = `
        <div id="data-group-${state.groupIndex + 1}" class="data-group">
            <h3 id="data-group-title-${state.groupIndex + 1}" contenteditable="true">${escapeHtml(groupName)}</h3>
            <h5 class="data-group-info">Click + to add tests to the ${state.testMode === 'comb' ? 'group' : 'set'}</h5>
            <table class="tb-table" id="data-table-${state.groupIndex + 1}">
                <tbody></tbody>
            </table>
            <button class="lower-button plus-button latest-button" id="plus-${state.groupIndex + 1}" onclick="addCase(${state.groupIndex})" style="font-size: 25px;">+</button>
        </div>
    `;
    state.cases[state.groupIndex] = 0;
    if ($('#dataGroup').length) {
        $('#dataGroup').append(s);
        makeSortable();
        console.log(`Added group ${state.groupIndex + 1}`);
    } else {
        console.error('#dataGroup not found');
    }
}

/**
 * Deletes a group
 * @param {jQuery} element - The delete button element
 */
function deleteGroup(element) {
    const groupDiv = element.parent();
    const grp = Number(groupDiv.attr('id').split('-').pop()) - 1;
    groupDiv.remove();
    state.cases.splice(grp, 1);
    state.groupIndex--;
    console.log(`Deleted group ${grp + 1}`);
}

/**
 * Adds an input with default or specified values
 * @param {string} [label] - Input label
 * @param {number} [bitwidth] - Bit width
 * @param {string[][]} [inputData] - Input values per group
 */
function addInput(label = `inp${state.nextInputIndex + 1}`, bitwidth = 1, inputData = []) {
    state.nextInputIndex++;
    state.inputCount++;
    const sHead = `<th style="background-color: #aaf" id="tb-inp-label-${state.nextInputIndex}"><span contenteditable="true">${escapeHtml(label)}</span> <a onclick="deleteInput($(this));"><span class="fa fa-minus-square tb-minus"></span></a></th>`;
    const sData = `<td contenteditable="true">${escapeHtml(bitwidth.toString())}</td>`;
    $('#testBenchTable tr:eq(1)').append(sHead);
    $('#testBenchTable tr:eq(2)').append(sData);
    $('#tb-inputs-head').attr('colspan', state.inputCount);

    $('#dataGroup table').each(function (group_i) {
        $(this).find('tbody tr').each(function (case_i) {
            const s = `<td contenteditable="true">${inputData.length && inputData[group_i]?.[case_i] ? escapeHtml(inputData[group_i][case_i]) : '0'}</td>`;
            $(this).find('td').eq(state.inputCount - 1).after(s);
        });
    });
    console.log(`Added input ${label}`);
}

/**
 * Adds an output with default or specified values
 * @param {string} [label] - Output label
 * @param {number} [bitwidth] - Bit width
 * @param {string[][]} [outputData] - Output values per group
 * @param {boolean} [result] - Whether to display results
 * @param {string[][]} [resultData] - Actual result values
 */
function addOutput(label = `out${state.nextOutputIndex + 1}`, bitwidth = 1, outputData = [], result = false, resultData = []) {
    state.nextOutputIndex++;
    state.outputCount++;
    const sHead = result
        ? `<th style="background-color: #afa" id="tb-out-label-${state.nextOutputIndex}" colspan="2"><span contenteditable="true">${escapeHtml(label)}</span> <a onclick="deleteOutput($(this));"><span class="fa fa-minus-square tb-minus"></span></a></th>`
        : `<th style="background-color: #afa" id="tb-out-label-${state.nextOutputIndex}"><span contenteditable="true">${escapeHtml(label)}</span> <a onclick="deleteOutput($(this));"><span class="fa fa-minus-square tb-minus"></span></a></th>`;
    const sData = `<td contenteditable="true"${result ? ' colspan="2"' : ''}>${escapeHtml(bitwidth.toString())}</td>`;
    $('#testBenchTable tr:eq(1)').append(sHead);
    $('#testBenchTable tr:eq(2)').append(sData);
    $('#tb-outputs-head').attr('colspan', result ? 2 * state.outputCount : state.outputCount);

    $('#dataGroup table').each(function (group_i) {
        $(this).find('tbody tr').each(function (case_i) {
            if (!result) {
                const s = `<td contenteditable="true">${outputData.length && outputData[group_i]?.[case_i] ? escapeHtml(outputData[group_i][case_i]) : '0'}</td>`;
                $(this).append(s);
            } else {
                const expected = outputData[group_i]?.[case_i] || 'X';
                const actual = resultData[group_i]?.[case_i] || 'X';
                const color = expected === actual ? 'green' : 'red';
                const s = `<td>${escapeHtml(expected)}</td><td style="color: ${color}">${escapeHtml(actual)}</td>`;
                $(this).append(s);
            }
        });
    });
    console.log(`Added output ${label}`);
}

/**
 * Deletes an input unless it's the last one
 * @param {jQuery} element - The delete button element
 */
function deleteInput(element) {
    if (state.inputCount <= 1) return;
    const id = element.parent().attr('id');
    $(`#${id}`).remove();
    $('#testBenchTable tr:eq(2) td:eq(' + state.inputCount + ')').remove();
    $('#dataGroup table tr').each(function () {
        $(this).find('td').eq(state.inputCount).remove();
    });
    state.inputCount--;
    $('#tb-inputs-head').attr('colspan', state.inputCount);
    console.log(`Deleted input ${id}`);
}

/**
 * Deletes an output unless it's the last one
 * @param {jQuery} element - The delete button element
 */
function deleteOutput(element) {
    if (state.outputCount <= 1) return;
    const id = element.parent().attr('id');
    $(`#${id}`).remove();
    $('#testBenchTable tr:eq(2) td:eq(' + (state.inputCount + state.outputCount) + ')').remove();
    $('#dataGroup table tr').each(function () {
        $(this).find('td').eq(state.inputCount + state.outputCount).remove();
    });
    state.outputCount--;
    $('#tb-outputs-head').attr('colspan', state.outputCount);
    console.log(`Deleted output ${id}`);
}

/**
 * Gets input/output bit widths
 * @returns {Object} Bit widths keyed by label
 */
function getBitWidths() {
    const bitwidths = {};
    $('#testBenchTable tr:eq(1) th:gt(0)').each(function (index) {
        const label = $(this).find('span').text();
        const bw = Number($('#testBenchTable tr:eq(2) td:gt(0)').eq(index).text());
        bitwidths[label] = bw;
    });
    return bitwidths;
}

/**
 * Gets test data from UI tables
 * @returns {Object[]} Group data
 */
function getData() {
    const bitwidths = getBitWidths();
    const groups = [];
    const groupCount = $('#dataGroup').children().length;
    for (let group_i = 0; group_i < groupCount; group_i++) {
        const group = {
            label: $(`#data-group-title-${group_i + 1}`).text(),
            inputs: [],
            outputs: [],
            n: $(`#data-table-${group_i + 1} tr`).length,
        };
        const groupTable = $(`#data-table-${group_i + 1}`);
        for (let inp_i = 0; inp_i < state.inputCount; inp_i++) {
            const label = Object.keys(bitwidths)[inp_i];
            const input = { label, bitWidth: bitwidths[label], values: [] };
            groupTable.find('tr').each(function () {
                input.values.push($(this).find('td').eq(inp_i + 1).text());
            });
            group.inputs.push(input);
        }
        for (let out_i = 0; out_i < state.outputCount; out_i++) {
            const label = Object.keys(bitwidths)[state.inputCount + out_i];
            const output = { label, bitWidth: bitwidths[label], values: [] };
            groupTable.find('tr').each(function () {
                output.values.push($(this).find('td').eq(state.inputCount + out_i + 1).text());
            });
            group.outputs.push(output);
        }
        groups.push(group);
    }
    return groups;
}

/**
 * Parses UI into a test data object
 * @returns {Object|null} Test data or null on error
 */
function parse() {
    try {
        return {
            type: state.testMode,
            title: $('#test-title-label').text() || 'Untitled',
            groups: getData(),
        };
    } catch (e) {
        console.error('Failed to parse test data:', e);
        alert('Error parsing test data. Check console for details.');
        return null;
    }
}

/**
 * Exports test data as CSV
 */
function exportAsCSV() {
    let csvData = `Title,Test Type,Input Count,Output Count\n${$('#test-title-label').text() || 'Untitled'},${state.testMode},${state.inputCount},${state.outputCount}\n\n\n`;
    csvData += $('#testBenchTable').table2CSV();
    csvData += '\n\n';
    $('#dataGroup table').each(function (group_i) {
        csvData += $(`#data-group-title-${group_i + 1}`).text() + '\n';
        csvData += $(this).table2CSV() + '\n\n';
    });
    download(`${$('#test-title-label').text() || 'Untitled'}.csv`, csvData);
}

/**
 * Imports test data from CSV
 */
function importFromCSV() {
    const file = $('#csvFileInput').prop('files')[0];
    if (!file) {
        alert('Please select a CSV file.');
        return;
    }
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const csvContent = reader.result;
            const jsonData = csv2json(csvContent);
            window.location = `/testbench?scopeID=${state.circuitScopeID || ''}&data=${jsonData}&popUp=${state.creatorMode === CREATORMODE.SIMULATOR_POPUP}`;
        } catch (e) {
            console.error('Failed to import CSV:', e);
            alert('Error importing CSV. Please ensure the file is valid.');
        }
    };
    reader.readAsText(file);
}

/**
 * Triggers hidden file input for CSV upload
 */
function clickUpload() {
    $('#csvFileInput').click();
}

/**
 * Converts CSV to JSON for loading into UI
 * @param {string} csvFileData - CSV content
 * @returns {string} JSON string
 */
function csv2json(csvFileData) {
    const stripQuotes = (str) => str.replace(/"/g, '');
    const lines = csvFileData.split('\n');
    if (lines.length < 4) throw new Error('Invalid CSV: Too few lines');

    const metadata = lines[1].split(',');
    const jsonData = {
        title: stripQuotes(metadata[0]),
        type: stripQuotes(metadata[1]),
        groups: [],
    };
    const inputCountCSV = Number(stripQuotes(metadata[2]));
    const outputCountCSV = Number(stripQuotes(metadata[3]));

    const bitwidthsSection = csvFileData.split('\n\n\n')[1].split('\n');
    const labels = bitwidthsSection[1].split(',').slice(1).map(stripQuotes);
    const bitWidths = bitwidthsSection[2].split(',').slice(1).map((bw) => Number(stripQuotes(bw)));

    const groups = csvFileData.split('\n\n').slice(2);
    for (let group_i = 0; group_i < groups.length - 1; group_i++) {
        const groupLines = groups[group_i].split('\n');
        const group = {
            label: stripQuotes(groupLines[0]),
            n: groupLines.length - 1,
            inputs: [],
            outputs: [],
        };
        for (let input_i = 0; input_i < inputCountCSV; input_i++) {
            const input = {
                label: labels[input_i],
                bitWidth: bitWidths[input_i],
                values: groupLines.slice(1).map((row) => stripQuotes(row.split(',')[input_i + 1])),
            };
            group.inputs.push(input);
        }
        for (let output_i = 0; output_i < outputCountCSV; output_i++) {
            const output = {
                label: labels[inputCountCSV + output_i],
                bitWidth: bitWidths[inputCountCSV + output_i],
                values: groupLines.slice(1).map((row) => stripQuotes(row.split(',')[inputCountCSV + output_i + 1])),
            };
            group.outputs.push(output);
        }
        jsonData.groups.push(group);
    }
    return JSON.stringify(jsonData);
}

/**
 * Downloads a file with the given content
 * @param {string} filename - File name
 * @param {string} text - File content
 */
function download(filename, text) {
    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`);
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

/**
 * Saves test data, sending it to the parent window if in popup mode
 */
function saveData() {
    const testData = parse();
    if (!testData) return;
    if (state.creatorMode === CREATORMODE.SIMULATOR_POPUP) {
        const postData = { scopeID: state.circuitScopeID, testData };
        window.opener.postMessage({ type: 'testData', data: JSON.stringify(postData) }, '*');
        window.close();
    }
}

/**
 * Loads test data into the UI
 * @param {string} dataJSON - JSON string of test data
 */
function loadData(dataJSON) {
    try {
        const data = JSON.parse(dataJSON);
        if (data.title) $('#test-title-label').text(data.title);
        changeTestMode(data.type);
        data.groups.forEach((group) => {
            addGroup(group.label);
            for (let i = 0; i < group.n; i++) addCase(state.groupIndex);
        });
        data.groups[0].inputs.forEach((input) => {
            const values = data.groups.map((g) => g.inputs.find((i) => i.label === input.label).values);
            addInput(input.label, input.bitWidth, values);
        });
        data.groups[0].outputs.forEach((output) => {
            const values = data.groups.map((g) => g.outputs.find((o) => o.label === output.label).values);
            addOutput(output.label, output.bitWidth, values);
        });
        console.log('Loaded test data:', data);
    } catch (e) {
        console.error('Failed to load data:', e);
        alert('Error loading test data. Check console for details.');
    }
}

/**
 * Loads test results into the UI
 * @param {string} dataJSON - JSON string of test results
 */
function loadResult(dataJSON) {
    try {
        const data = JSON.parse(dataJSON);
        if (data.title) $('#test-title-label').text(data.title);
        changeTestMode(data.type);
        data.groups.forEach((group) => {
            addGroup(group.label);
            for (let i = 0; i < group.n; i++) addCase(state.groupIndex);
        });
        data.groups[0].inputs.forEach((input) => {
            const values = data.groups.map((g) => g.inputs.find((i) => i.label === input.label).values);
            addInput(input.label, input.bitWidth, values);
        });
        data.groups[0].outputs.forEach((output) => {
            const values = data.groups.map((g) => g.outputs.find((o) => o.label === output.label).values);
            const results = data.groups.map((g) => g.outputs.find((o) => o.label === output.label).results || []);
            addOutput(output.label, output.bitWidth, values, true, results);
        });
        console.log('Loaded test results:', data);
    } catch (e) {
        console.error('Failed to load results:', e);
        alert('Error loading test results. Check console for details.');
    }
}

/**
 * Makes the UI read-only for displaying results
 */
function readOnlyUI() {
    $('body [contenteditable]').attr('contenteditable', 'false');
    $('.lower-button, .table-button, .tb-minus').hide();
    $('.tablink').attr('disabled', 'disabled').removeClass('tablink-no-override');
    $('.data-group-info').text('');
    makeUnsortable();
}

/**
 * Enables drag-and-drop sorting for group tables
 */
function makeSortable() {
    $('.data-group table').sortable({
        handle: '.tb-handle',
        helper: (e, ui) => ui.clone().children().each((i, el) => $(el).width(ui.children().eq(i).width())),
        start: (e, ui) => ui.placeholder.children().css('border', '0px'),
        placeholder: 'clone',
        connectWith: 'table',
        items: 'tr',
        revert: 50,
        scroll: false,
    });
}

/**
 * Disables sorting
 */
function makeUnsortable() {
    $('.data-group table').sortable('disable');
}

/**
 * Escapes HTML characters to prevent XSS
 * @param {string} unsafe - Input string
 * @returns {string} Escaped string
 */
function escapeHtml(unsafe) {
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Expose functions globally for HTML
window.addGroup = addGroup;
window.deleteGroup = deleteGroup;
window.addCase = addCase;
window.deleteCase = deleteCase;
window.addInput = addInput;
window.deleteInput = deleteInput;
window.addOutput = addOutput;
window.deleteOutput = deleteOutput;
window.parse = parse;
window.saveData = saveData;
window.changeTestMode = changeTestMode;
window.exportAsCSV = exportAsCSV;
window.importFromCSV = importFromCSV;
window.csv2json = csv2json;
window.clickUpload = clickUpload;