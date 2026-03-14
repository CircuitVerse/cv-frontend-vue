/**
 * Unit tests for verilogLinter.js
 * Run: node src/simulator/src/__tests__/verilogLinter.test.js
 */

let passed = 0
let failed = 0

function assert(condition, testName) {
    if (condition) {
        console.log('  PASS: ' + testName)
        passed++
    } else {
        console.log('  FAIL: ' + testName)
        failed++
    }
}

// ========== Core logic for standalone test ==========
const KEYWORD_TYPOS = {
    'modul': 'module',
    'modlue': 'module',
    'asign': 'assign',
    'assgin': 'assign',
    'aways': 'always',
    'alwys': 'always',
    'inut': 'input',
    'outut': 'output',
    'wrie': 'wire',
    'begn': 'begin',
    'posege': 'posedge',
}

function stripComments(line) {
    const commentIndex = line.indexOf('//')
    if (commentIndex >= 0) return line.substring(0, commentIndex)
    return line
}

function checkModuleBalance(lines) {
    const errors = []
    let moduleCount = 0
    let endmoduleCount = 0
    let lastModuleLine = -1
    let lastEndmoduleLine = -1

    lines.forEach((line, i) => {
        const stripped = stripComments(line)
        if (/\bmodule\b/.test(stripped) && !/\bendmodule\b/.test(stripped)) {
            moduleCount++
            lastModuleLine = i
        }
        if (/\bendmodule\b/.test(stripped)) {
            endmoduleCount++
            lastEndmoduleLine = i
        }
    })

    if (moduleCount > endmoduleCount) {
        errors.push({
            line: lastModuleLine, ch: 0,
            message: 'Missing endmodule -- found ' + moduleCount + ' module(s) but only ' + endmoduleCount + ' endmodule(s)',
            severity: 'error',
        })
    }
    if (endmoduleCount > moduleCount) {
        errors.push({
            line: lastEndmoduleLine, ch: 0,
            message: 'Extra endmodule without matching module',
            severity: 'error',
        })
    }
    return errors
}

function checkKeywordTypos(lines) {
    const errors = []
    lines.forEach((line, i) => {
        const stripped = stripComments(line)
        const words = stripped.match(/\b[a-z_]\w*\b/g)
        if (!words) return
        words.forEach((word) => {
            if (KEYWORD_TYPOS[word]) {
                errors.push({
                    line: i, ch: line.indexOf(word),
                    message: 'Unknown keyword \'' + word + '\'. Did you mean \'' + KEYWORD_TYPOS[word] + '\'?',
                    severity: 'error',
                })
            }
        })
    })
    return errors
}

function checkAssignToInput(lines) {
    const errors = []
    const inputPorts = []
    lines.forEach((line, i) => {
        const stripped = stripComments(line)
        const inputMatch = stripped.match(/\binput\s+(?:wire|reg)?\s*(?:$$\d+:\d+$$)?\s*(\w+)/)
        if (inputMatch) inputPorts.push(inputMatch[1])
        const assignMatch = stripped.match(/\bassign\s+(\w+)/)
        if (assignMatch && inputPorts.includes(assignMatch[1])) {
            errors.push({
                line: i, ch: stripped.indexOf(assignMatch[1]),
                message: 'Cannot assign to input port \'' + assignMatch[1] + '\'',
                severity: 'error',
            })
        }
    })
    return errors
}

// ========== TESTS ==========

console.log('\nVerilog Linter Tests\n')

// --- Test Group 1: Valid Code ---
console.log('-- Valid Code (should have no errors)')
;(function() {
    var code = 'module test(input a, output b);\n  assign b = a;\nendmodule'
    var lines = code.split('\n')
    var errors = [].concat(
        checkModuleBalance(lines),
        checkKeywordTypos(lines),
        checkAssignToInput(lines)
    )
    assert(errors.length === 0, 'Valid AND gate has no errors')
})()

// --- Test Group 2: Keyword Typos ---
console.log('\n-- Keyword Typos')
;(function() {
    var code = 'modul test(input a, output b);\n  asign b = a;\nendmodule'
    var lines = code.split('\n')
    var errors = checkKeywordTypos(lines)
    assert(errors.length >= 2, 'Detects at least 2 typos')
    assert(errors.some(function(e) { return e.message.includes('modul') }), 'Catches modul')
    assert(errors.some(function(e) { return e.message.includes('asign') }), 'Catches asign')
})()

// --- Test Group 3: Module Balance ---
console.log('\n-- Module/Endmodule Balance')
;(function() {
    var missing = 'module test(input a, output b);\n  assign b = a;'
    var lines = missing.split('\n')
    var errors = checkModuleBalance(lines)
    assert(errors.length === 1, 'Detects missing endmodule')
    assert(errors[0].message.includes('Missing'), 'Error says Missing')
})()

;(function() {
    var extra = 'module test(input a, output b);\n  assign b = a;\nendmodule\nendmodule'
    var lines = extra.split('\n')
    var errors = checkModuleBalance(lines)
    assert(errors.length === 1, 'Detects extra endmodule')
    assert(errors[0].message.includes('Extra'), 'Error says Extra')
})()

// --- Test Group 4: Assign to Input ---
console.log('\n-- Assign to Input')
;(function() {
    var code = 'module test(input a, output b);\n  assign a = b;\nendmodule'
    var lines = code.split('\n')
    var errors = checkAssignToInput(lines)
    assert(errors.length === 1, 'Detects assign to input')
    assert(errors[0].message.includes('input port'), 'Names the port')
})()

;(function() {
    var code = 'module test(input a, output b);\n  assign b = a;\nendmodule'
    var lines = code.split('\n')
    var errors = checkAssignToInput(lines)
    assert(errors.length === 0, 'Valid assign has no errors')
})()

// --- Test Group 5: Comments ---
console.log('\n-- Comments Handling')
;(function() {
    var code = 'module test(input a, output b);\n  // asign is just a comment\n  assign b = a;\nendmodule'
    var lines = code.split('\n')
    var errors = checkKeywordTypos(lines)
    assert(errors.length === 0, 'Ignores typos in comments')
})()

// --- Summary ---
console.log('\n========================================')
console.log('Results: ' + passed + ' passed, ' + failed + ' failed')
console.log('========================================\n')

if (failed > 0) process.exit(1)