/**
 * Verilog Linter for CircuitVerse CodeMirror Editor
 * 
 * Performs real-time syntax checking on Verilog code
 * and returns warnings/errors for the CodeMirror lint gutter.
 * 
 * @module verilogLinter
 */

// ============================================
// Verilog Keywords (for typo detection)
// ============================================
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

// ============================================
// Common Typos → Suggestions
// ============================================
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

// ============================================
// Lint Rules
// ============================================

/**
 * Rule 1: Check module/endmodule matching
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
            message: `Missing 'endmodule' — found ${moduleCount} module(s) but only ${endmoduleCount} endmodule(s)`,
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
 * Rule 2: Check begin/end matching
 */
function checkBeginEndBalance(lines) {
    const errors = []
    let beginCount = 0
    let endCount = 0
    let lastBeginLine = -1

    lines.forEach((line, i) => {
        const stripped = stripComments(line)
        // Match 'begin' but not 'begin' inside endmodule etc
        const beginMatches = stripped.match(/\bbegin\b/g)
        const endMatches = stripped.match(/\bend\b/g)
        // Exclude 'endmodule', 'endcase', 'endfunction', 'endtask'
        const endKeywords = stripped.match(/\bend(module|case|function|task|generate|specify)\b/g)
        
        if (beginMatches) {
            beginCount += beginMatches.length
            lastBeginLine = i
        }
        if (endMatches) {
            let realEnds = endMatches.length
            if (endKeywords) realEnds -= endKeywords.length
            endCount += realEnds
        }
    })

    if (beginCount > endCount) {
        errors.push({
            line: lastBeginLine,
            ch: 0,
            message: `Missing 'end' — found ${beginCount} begin(s) but only ${endCount} end(s)`,
            severity: 'error',
        })
    }

    return errors
}

/**
 * Rule 3: Check for missing semicolons
 */
function checkMissingSemicolons(lines) {
    const errors = []

    // Lines that SHOULD end with semicolons
    const needsSemicolon = [
        /^\s*(input|output|inout)\b/,
        /^\s*assign\b/,
        /^\s*(wire|reg)\b/,
        /^\s*(parameter|localparam)\b/,
    ]

    // Lines that should NOT end with semicolons
    const noSemicolon = [
        /^\s*module\b/,
        /^\s*always\b/,
        /^\s*initial\b/,
        /^\s*begin\b/,
        /^\s*end/,
        /^\s*if\b/,
        /^\s*else\b/,
        /^\s*for\b/,
        /^\s*case\b/,
        /^\s*\/\//,
        /^\s*$/,
    ]

    lines.forEach((line, i) => {
        const stripped = stripComments(line).trim()
        if (!stripped) return

        for (const pattern of needsSemicolon) {
            if (pattern.test(stripped)) {
                // Check if line ends with ; or , (port lists)
                if (!stripped.endsWith(';') && !stripped.endsWith(',') && !stripped.endsWith('(')) {
                    // Check if next non-empty line continues this statement
                    let isContinuation = false
                    for (let j = i + 1; j < lines.length; j++) {
                        const nextLine = stripComments(lines[j]).trim()
                        if (!nextLine) continue
                        if (nextLine.startsWith('.') || nextLine.startsWith(',')) {
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
 * Rule 4: Check for keyword typos
 */
function checkKeywordTypos(lines) {
    const errors = []

    lines.forEach((line, i) => {
        const stripped = stripComments(line)
        // Extract words that look like they could be keywords
        const words = stripped.match(/\b[a-z_]\w*\b/g)
        if (!words) return

        words.forEach((word) => {
            if (KEYWORD_TYPOS[word]) {
                const ch = line.indexOf(word)
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
 * Rule 5: Check for common port declaration issues
 */
function checkPortDeclarations(lines) {
    const errors = []
    let insideModule = false
    let modulePortNames = []
    let declaredPorts = []

    lines.forEach((line, i) => {
        const stripped = stripComments(line)

        // Detect module declaration
        const moduleMatch = stripped.match(/\bmodule\s+\w+\s*\(([^)]*)\)/)
        if (moduleMatch) {
            insideModule = true
            // Extract port names from module header
            const portList = moduleMatch[1]
            const ports = portList.match(/\b\w+\b/g)
            if (ports) {
                // Filter out keywords
                modulePortNames = ports.filter(
                    (p) => !['input', 'output', 'inout', 'wire', 'reg'].includes(p)
                )
                // Ports declared inline in the header count as declared
                const inlineDeclared = portList.match(/(?:input|output|inout)\s+(?:wire|reg)?\s*(?:$$\d+:\d+$$)?\s*(\w+)/g)
                if (inlineDeclared) {
                    inlineDeclared.forEach((decl) => {
                        const name = decl.match(/(\w+)$/)[1]
                        declaredPorts.push(name)
                    })
                }
            }
        }

        // Track port declarations in body
        const portDecl = stripped.match(/\b(input|output|inout)\s+(?:wire|reg)?\s*(?:$$\d+:\d+$$)?\s*(\w+)/)
        if (portDecl && insideModule) {
            declaredPorts.push(portDecl[2])
        }

        if (/\bendmodule\b/.test(stripped)) {
            insideModule = false
            modulePortNames = []
            declaredPorts = []
        }
    })

    return errors
}

/**
 * Rule 6: Check for empty module body
 */
function checkEmptyModule(lines) {
    const errors = []
    let moduleStartLine = -1
    let hasContent = false

    lines.forEach((line, i) => {
        const stripped = stripComments(line).trim()

        if (/\bmodule\b/.test(stripped)) {
            moduleStartLine = i
            hasContent = false
        }

        if (moduleStartLine >= 0 && i > moduleStartLine) {
            if (/\bendmodule\b/.test(stripped)) {
                if (!hasContent) {
                    errors.push({
                        line: moduleStartLine,
                        ch: 0,
                        message: 'Empty module body — no assignments or logic found',
                        severity: 'warning',
                    })
                }
                moduleStartLine = -1
            } else if (stripped && !stripped.startsWith('//')) {
                // Check if this line has actual logic
                if (/\b(assign|always|initial|wire|reg|input|output)\b/.test(stripped)) {
                    hasContent = true
                }
            }
        }
    })

    return errors
}

/**
 * Rule 7: Check for assign to input ports
 */
function checkAssignToInput(lines) {
    const errors = []
    const inputPorts = []

    lines.forEach((line, i) => {
        const stripped = stripComments(line)

        // Collect input port names
        const inputMatch = stripped.match(/\binput\s+(?:wire|reg)?\s*(?:$$\d+:\d+$$)?\s*(\w+)/)
        if (inputMatch) {
            inputPorts.push(inputMatch[1])
        }

        // Check if assign targets an input
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
 * Remove single-line comments from a line
 */
function stripComments(line) {
    // Remove // comments
    const commentIndex = line.indexOf('//')
    if (commentIndex >= 0) {
        return line.substring(0, commentIndex)
    }
    return line
}

// ============================================
// Main Lint Function
// ============================================

/**
 * Main linting function called by CodeMirror's lint addon.
 * 
 * @param {string} code - The complete Verilog code from the editor
 * @returns {Array} Array of lint error/warning objects
 */
export function lintVerilog(code) {
    if (!code || !code.trim()) return []

    const lines = code.split('\n')
    const allErrors = []

    // Run all rules
    allErrors.push(...checkModuleBalance(lines))
    allErrors.push(...checkBeginEndBalance(lines))
    allErrors.push(...checkMissingSemicolons(lines))
    allErrors.push(...checkKeywordTypos(lines))
    allErrors.push(...checkPortDeclarations(lines))
    allErrors.push(...checkEmptyModule(lines))
    allErrors.push(...checkAssignToInput(lines))

    // Convert to CodeMirror lint format
    return allErrors.map((error) => ({
        from: { line: error.line, ch: error.ch || 0 },
        to: { line: error.line, ch: error.ch ? error.ch + 1 : lines[error.line]?.length || 0 },
        message: error.message,
        severity: error.severity,  // 'error' | 'warning'
    }))
}

/**
 * Get all Verilog keywords (for autocomplete integration)
 */
export function getVerilogKeywords() {
    return VERILOG_KEYWORDS
}