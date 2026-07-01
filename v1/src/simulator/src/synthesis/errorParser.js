// Extracts a human-readable error from Yosys stderr output

var TOKEN_MAP = {
    'TOK_ID': 'identifier',
    'TOK_ASSIGN': "'assign'",
    'TOK_MODULE': "'module'",
    'TOK_ENDMODULE': "'endmodule'",
    'TOK_INPUT': "'input'",
    'TOK_OUTPUT': "'output'",
    'TOK_WIRE': "'wire'",
    'TOK_REG': "'reg'",
    'TOK_INTEGER': "'integer'",
    'TOK_BEGIN': "'begin'",
    'TOK_END': "'end'",
    'TOK_IF': "'if'",
    'TOK_ELSE': "'else'",
    'TOK_CASE': "'case'",
    'TOK_ENDCASE': "'endcase'",
    'TOK_ALWAYS': "'always'",
    'TOK_POSEDGE': "'posedge'",
    'TOK_NEGEDGE': "'negedge'",
    'TOK_OR': "'or'",
    'TOK_AND': "'and'",
    'TOK_NOT': "'not'",
    'TOK_PARAMETER': "'parameter'",
    'TOK_LOCALPARAM': "'localparam'",
    'TOK_GENVAR': "'genvar'",
    'TOK_FOR': "'for'",
    'TOK_WHILE': "'while'",
    'TOK_GENERATE': "'generate'",
    'TOK_ENDGENERATE': "'endgenerate'",
    'TOK_FUNCTION': "'function'",
    'TOK_ENDFUNCTION': "'endfunction'",
    'TOK_TASK': "'task'",
    'TOK_ENDTASK': "'endtask'",
    'TOK_CONSTVAL': 'constant value',
    'TOK_REALVAL': 'real value',
    'TOK_PRIMITIVE': 'primitive',
    'TOK_STRING': 'string',
    'TOK_SYNOPSYS': 'synopsys directive',
    '$end': 'end of file',
}

function replaceTokens(msg) {
    return msg.replace(/TOK_[A-Z_]+|\$end/g, function (tok) {
        return TOKEN_MAP[tok] || tok
    })
}

function humanize(line, detail) {
    var readable = replaceTokens(detail)

    if (readable.indexOf('unexpected end of file') !== -1) {
        return 'Syntax error on line ' + line + ': unexpected end of file (missing "endmodule" or closing statement?)'
    }

    var unexpected = readable.match(/unexpected (.+?)(?:,|$)/)
    var expecting = readable.match(/expecting (.+)/)

    if (unexpected) {
        var found = unexpected[1].trim()
        var msg = 'Syntax error on line ' + line + ': unexpected ' + found

        if (expecting) {
            msg += ', expected ' + expecting[1].trim()
        }
        return msg
    }

    return 'Syntax error on line ' + line + ': ' + readable
}

export function extractYosysError(stderrLines) {
    if (!stderrLines || !stderrLines.length) return null

    for (var i = stderrLines.length - 1; i >= 0; i--) {
        var line = stderrLines[i]
        var match = line.match(/^input\.v:(\d+):\s*ERROR:\s*(.+)/)
        if (match) {
            return humanize(match[1], match[2])
        }
        if (line.indexOf('ERROR:') !== -1) {
            var raw = line.replace(/^.*?ERROR:\s*/, '')
            return replaceTokens(raw)
        }
    }
    return null
}
