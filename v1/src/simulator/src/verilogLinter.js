/**
 * Verilog Linter for CircuitVerse CodeMirror Editor
 *
 * This module provides real-time syntax checking for Verilog code
 * written in the CircuitVerse simulator's code editor.
 */

const VERILOG_KEYWORDS = [
    'module', 'endmodule', 'input', 'output', 'inout',
    'wire', 'reg', 'assign', 'always', 'initial',
    'begin', 'end', 'if', 'else', 'case', 'endcase',
    'for', 'while', 'parameter', 'localparam',
    'posedge', 'negedge', 'or', 'and', 'not',
    'nand', 'nor', 'xor', 'xnor', 'buf',
    'integer', 'real', 'time', 'genvar',
    'generate', 'endgenerate', 'function', 'endfunction',
    'task', 'endtask', 'specify', 'endspecify',
]

// Common typos I've seen in Verilog code - maps the wrong spelling to the right one
const KEYWORD_TYPOS = {
    'modul': 'module',
    'modlue': 'module',
    'moudle': 'module',
    'enmodule': 'endmodule',
    'endmodul': 'endmodule',
    'endmodlue': 'endmodule',
    'inut': 'input',
    'inpt': 'input',
    'outut': 'output',
    'outpt': 'output',
    'ouput': 'output',
    'asign': 'assign',
    'assgin': 'assign',
    'assing': 'assign',
    'aways': 'always',
    'alwys': 'always',
    'alwas': 'always',
    'initail': 'initial',
    'intial': 'initial',
    'begn': 'begin',
    'bgin': 'begin',
    'wrie': 'wire',
    'wir': 'wire',
    'posege': 'posedge',
    'negedeg': 'negedge',
    'paramter': 'parameter',
    'parmeter': 'parameter',
}

/**
 * Rule 1: Make sure every module has a matching endmodule.
 * Counts how many times we see 'module' vs 'endmodule' and
 * flags it if they don't match up.
 * @param {string[]} lines - The Verilog code split into lines
 * @returns {Object[]} List of errors found, empty if all good
 */
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
            line: lastModuleLine,
            ch: 0,
            message: `Missing 'endmodule' - found ${moduleCount} module(s) but only ${endmoduleCount} endmodule(s)`,
            severity: 'error',
        })
    }

    if (endmoduleCount > moduleCount) {
        errors.push({
            line: lastEndmoduleLine,
            ch: 0,
            message: `Extra 'endmodule' without matching 'module'`,
            severity: 'error',
        })
    }

    return errors
}

/**
 * Rule 2: Make sure every 'begin' has a matching 'end'.
 * We have to be careful here to not count endmodule, endcase etc.
 * as plain 'end' tokens - so we subtract those out.
 * @param {string[]} lines - The Verilog code split into lines
 * @returns {Object[]} List of errors found, empty if all good
 */
function checkBeginEndBalance(lines) {
    const errors = []
    let beginCount = 0
    let endCount = 0
    let lastBeginLine = -1
    let lastEndLine = -1

    lines.forEach((line, i) => {
        const stripped = stripComments(line)
        const beginMatches = stripped.match(/\bbegin\b/g)
        const endMatches = stripped.match(/\bend\b/g)
        // these all start with 'end' but aren't plain 'end' tokens
        const endKeywords = stripped.match(
            /\bend(module|case|function|task|generate|specify)\b/g
        )

        if (beginMatches) {
            beginCount += beginMatches.length
            lastBeginLine = i
        }
        if (endMatches) {
            let realEnds = endMatches.length
            if (endKeywords) realEnds -= endKeywords.length
            if (realEnds > 0) {
                endCount += realEnds
                lastEndLine = i
            }
        }
    })

    if (beginCount > endCount) {
        errors.push({
            line: lastBeginLine,
            ch: 0,
            message: `Missing 'end' - found ${beginCount} begin(s) but only ${endCount} end(s)`,
            severity: 'error',
        })
    }

    if (endCount > beginCount) {
        errors.push({
            line: lastEndLine,
            ch: 0,
            message: `Extra 'end' - found ${endCount} end(s) but only ${beginCount} begin(s)`,
            severity: 'error',
        })
    }

    return errors
}

/**
 * Rule 3: Warn if a statement looks like it's missing a semicolon.
 * We skip lines that are part of a multiline module header since
 * those use commas instead of semicolons and would give false positives.
 * @param {string[]} lines - The Verilog code split into lines
 * @returns {Object[]} List of warnings found, empty if all good
 */
function checkMissingSemicolons(lines) {
    const errors = []

    // these statement types should always end with a semicolon
    const needsSemicolon = [
        /^\s*(input|output|inout)\b/,
        /^\s*assign\b/,
        /^\s*(wire|reg)\b/,
        /^\s*(parameter|localparam)\b/,
    ]

    let insideModuleHeader = false
    let parenDepth = 0

    lines.forEach((line, i) => {
        const stripped = stripComments(line).trim()
        if (!stripped) return

        // start tracking when we hit a module declaration
        if (/^\s*module\b/.test(stripped)) {
            insideModuleHeader = true
            parenDepth = 0
        }

        // keep counting parens until the header closes with ');'
        if (insideModuleHeader) {
            for (const ch of stripped) {
                if (ch === '(') parenDepth++
                else if (ch === ')') parenDepth--
            }
            if (parenDepth <= 0 && stripped.endsWith(';')) {
                insideModuleHeader = false
            }
            return
        }

        for (const pattern of needsSemicolon) {
            if (pattern.test(stripped)) {
                if (
                    !stripped.endsWith(';') &&
                    !stripped.endsWith(',') &&
                    !stripped.endsWith('(')
                ) {
                    // peek at the next line - if it starts with . or , it's a continuation
                    let isContinuation = false
                    for (let j = i + 1; j < lines.length; j++) {
                        const nextLine = stripComments(lines[j]).trim()
                        if (!nextLine) continue
                        if (
                            nextLine.startsWith('.') ||
                            nextLine.startsWith(',')
                        ) {
                            isContinuation = true
                        }
                        break
                    }
                    if (!isContinuation) {
                        errors.push({
                            line: i,
                            ch: stripped.length,
                            message: `Possible missing semicolon at end of line`,
                            severity: 'warning',
                        })
                    }
                }
                break
            }
        }
    })

    return errors
}

/**
 * Rule 4: Catch common Verilog keyword typos like 'asign' instead of 'assign'.
 * We only check against our known typos map and skip anything inside comments.
 * @param {string[]} lines - The Verilog code split into lines
 * @returns {Object[]} List of errors found, empty if all good
 */
function checkKeywordTypos(lines) {
    const errors = []

    lines.forEach((line, i) => {
        const stripped = stripComments(line)
        const words = stripped.match(/\b[a-z_]\w*\b/g)
        if (!words) return

        words.forEach((word) => {
            if (KEYWORD_TYPOS[word]) {
                const ch = stripped.indexOf(word)
                errors.push({
                    line: i,
                    ch: ch,
                    message: `Unknown keyword '${word}'. Did you mean '${KEYWORD_TYPOS[word]}'?`,
                    severity: 'error',
                })
            }
        })
    })

    return errors
}

/**
 * Rule 5: Check that every port listed in the module header is
 * actually declared somewhere in the module body as input/output/inout.
 * Handles both single-line and multiline module headers correctly.
 * @param {string[]} lines - The Verilog code split into lines
 * @returns {Object[]} List of warnings found, empty if all good
 */
function checkPortDeclarations(lines) {
    const errors = []
    let insideModule = false
    let collectingHeader = false
    let headerBuffer = ''
    let moduleHeaderLine = -1
    let modulePortNames = []
    let declaredPorts = []
    let parenDepth = 0
    const portDeclRegex = /\b(?:input|output|inout)\s+(?:wire\s+|reg\s+)?(?:$$[^$$]+\]\s*)?(\w+)((?:\s*,\s*(?!input\b|output\b|inout\b|wire\b|reg\b)\w+)*)/g

    /**
     * Pulls out port names from a module's port list string.
     * Also tracks which ones have been declared with a direction keyword.
     * @param {string} portList - The raw text between the module parentheses
     * @returns {void}
     */
    function extractFromPortList(portList) {
        const ports = portList.match(/\b\w+\b/g)
        if (ports) {
            modulePortNames = ports.filter(
                (p) => !['input', 'output', 'inout', 'wire', 'reg'].includes(p)
            )
        }
        portDeclRegex.lastIndex = 0
        for (const match of portList.matchAll(portDeclRegex)) {
            declaredPorts.push(match[1])
            if (match[2]) {
                match[2].split(',').forEach((n) => {
                    const t = n.trim()
                    if (t) declaredPorts.push(t)
                })
            }
        }
    }

    lines.forEach((line, i) => {
        const stripped = stripComments(line)

        if (/\bmodule\b/.test(stripped) && !/\bendmodule\b/.test(stripped)) {
            moduleHeaderLine = i
            insideModule = true
            collectingHeader = true
            headerBuffer = stripped
            parenDepth = 0
            for (const ch of stripped) {
                if (ch === '(') parenDepth++
                else if (ch === ')') parenDepth--
            }
            if (parenDepth <= 0 && stripped.includes(')')) {
                collectingHeader = false
                const headerMatch = headerBuffer.match(
                    /\bmodule\s+\w+\s*\(([^)]*)\)/
                )
                if (headerMatch) extractFromPortList(headerMatch[1])
            }
            return
        }

        // still collecting a multiline header - keep buffering lines
        if (collectingHeader) {
            headerBuffer += ' ' + stripped
            for (const ch of stripped) {
                if (ch === '(') parenDepth++
                else if (ch === ')') parenDepth--
            }
            if (parenDepth <= 0 && headerBuffer.includes(')')) {
                collectingHeader = false
                const headerMatch = headerBuffer.match(
                    /\bmodule\s+\w+\s*\(([^)]*)\)/
                )
                if (headerMatch) extractFromPortList(headerMatch[1])
            }
            return
        }

        // inside the module body - look for port direction declarations
        if (insideModule) {
            portDeclRegex.lastIndex = 0
            for (const match of stripped.matchAll(portDeclRegex)) {
                declaredPorts.push(match[1])
                if (match[2]) {
                    match[2].split(',').forEach((n) => {
                        const t = n.trim()
                        if (t) declaredPorts.push(t)
                    })
                }
            }
        }

        // when we hit endmodule, check if any header ports were never declared
        if (/\bendmodule\b/.test(stripped)) {
            if (insideModule) {
                modulePortNames.forEach((portName) => {
                    if (!declaredPorts.includes(portName)) {
                        errors.push({
                            line: moduleHeaderLine,
                            ch: 0,
                            message: `Port '${portName}' listed in module header but never declared as input/output/inout`,
                            severity: 'warning',
                        })
                    }
                })
            }
            // reset everything so we don't bleed state into the next module
            insideModule = false
            collectingHeader = false
            headerBuffer = ''
            modulePortNames = []
            declaredPorts = []
            moduleHeaderLine = -1
            parenDepth = 0
        }
    })

    return errors
}

/**
 * Rule 6: Warn if a module has no actual logic inside it.
 * An empty module compiles fine but is almost always a mistake.
 * @param {string[]} lines - The Verilog code split into lines
 * @returns {Object[]} List of warnings found, empty if all good
 */
function checkEmptyModule(lines) {
    const errors = []
    let moduleStartLine = -1
    let hasContent = false

    lines.forEach((line, i) => {
        const stripped = stripComments(line).trim()

        if (/\bmodule\b/.test(stripped) && !/\bendmodule\b/.test(stripped)) {
            moduleStartLine = i
            hasContent = false
        }

        if (moduleStartLine >= 0 && i > moduleStartLine) {
            if (/\bendmodule\b/.test(stripped)) {
                if (!hasContent) {
                    errors.push({
                        line: moduleStartLine,
                        ch: 0,
                        message: 'Empty module body - no assignments or logic found',
                        severity: 'warning',
                    })
                }
                moduleStartLine = -1
            } else if (stripped) {
                if (
                    /\b(assign|always|initial|wire|reg|input|output)\b/.test(
                        stripped
                    )
                ) {
                    hasContent = true
                }
            }
        }
    })

    return errors
}

/**
 * Rule 7: Catch attempts to assign a value to an input port.
 * Input ports are read-only so this would be a bug in the design.
 * We reset the input port list at each endmodule so ports don't
 * bleed across multiple module definitions.
 * @param {string[]} lines - The Verilog code split into lines
 * @returns {Object[]} List of errors found, empty if all good
 */
function checkAssignToInput(lines) {
    const errors = []
    let inputPorts = []
    const inputDeclRegex = /\binput\s+(?:wire\s+|reg\s+)?(?:$$[^$$]+\]\s*)?(\w+)((?:\s*,\s*(?!input\b|output\b|inout\b|wire\b|reg\b)\w+)*)/g

    lines.forEach((line, i) => {
        const stripped = stripComments(line)

        // reset at module boundaries so ports don't leak into the next module
        if (/\bendmodule\b/.test(stripped)) {
            inputPorts = []
            return
        }

        inputDeclRegex.lastIndex = 0
        for (const match of stripped.matchAll(inputDeclRegex)) {
            inputPorts.push(match[1])
            if (match[2]) {
                match[2].split(',').forEach((n) => {
                    const t = n.trim()
                    if (t) inputPorts.push(t)
                })
            }
        }

        const assignMatch = stripped.match(/\bassign\s+(\w+)/)
        if (assignMatch && inputPorts.includes(assignMatch[1])) {
            errors.push({
                line: i,
                ch: stripped.indexOf(assignMatch[1]),
                message: `Cannot assign to input port '${assignMatch[1]}'`,
                severity: 'error',
            })
        }
    })

    return errors
}

// ============================================
// Helper Functions
// ============================================

/**
 * Strips block comments (/* ... *\/) from the code while keeping
 * line numbers intact - we replace comment chars with spaces so
 * that line/column positions stay accurate for error reporting.
 * @param {string} code - The full Verilog source code string
 * @returns {string} The code with block comments blanked out
 */
function stripBlockComments(code) {
    return code.replace(/\/\*[\s\S]*?\*\//g, (match) => {
        return match.replace(/[^\n]/g, ' ')
    })
}

/**
 * Strips both block comments and single-line (//) comments from a line.
 * Used before running any rule so we don't accidentally flag code
 * that only appears inside a comment.
 * @param {string} line - A single line of Verilog code
 * @returns {string} The line with all comments removed
 */
function stripComments(line) {
    let result = line.replace(/\/\*.*?\*\//g, '')
    const commentIndex = result.indexOf('//')
    if (commentIndex >= 0) {
        result = result.substring(0, commentIndex)
    }
    return result
}

// ============================================
// Main Lint Function
// ============================================

/**
 * Runs all linting rules on the given Verilog source code and returns
 * a list of diagnostics in the format CodeMirror's lint addon expects.
 * Each diagnostic has a from/to position, a message, and a severity
 * of either 'error' or 'warning'.
 * @param {string} code - The full Verilog source code to lint
 * @returns {Object[]} Array of CodeMirror lint diagnostic objects
 */
export function lintVerilog(code) {
    if (!code || !code.trim()) return []

    const cleanedCode = stripBlockComments(code)
    const lines = cleanedCode.split('\n')
    const allErrors = []

    allErrors.push(...checkModuleBalance(lines))
    allErrors.push(...checkBeginEndBalance(lines))
    allErrors.push(...checkMissingSemicolons(lines))
    allErrors.push(...checkKeywordTypos(lines))
    allErrors.push(...checkPortDeclarations(lines))
    allErrors.push(...checkEmptyModule(lines))
    allErrors.push(...checkAssignToInput(lines))

    return allErrors.map((error) => ({
        from: { line: error.line, ch: error.ch || 0 },
        to: {
            line: error.line,
            ch: error.ch ? error.ch + 1 : lines[error.line]?.length || 0,
        },
        message: error.message,
        severity: error.severity,
    }))
}

/**
 * Returns the full list of Verilog keywords this linter knows about.
 * Useful for things like syntax highlighting or autocomplete suggestions.
 * @returns {string[]} Array of Verilog keyword strings
 */
export function getVerilogKeywords() {
    return VERILOG_KEYWORDS
}