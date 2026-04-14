/**
 * Unit tests for verilogLinter.js
 * Run with Vitest: npx vitest run src/simulator/src/__tests__/verilogLinter.test.js
 */

import { describe, it, expect } from 'vitest'
import { lintVerilog } from '../verilogLinter.js'

function errorsOf(code) {
    return lintVerilog(code)
}

function hasError(errors, text) {
    return errors.some((e) => e.message.includes(text))
}

describe('verilogLinter', () => {

    describe('Valid code produces no errors', () => {
        it('simple AND gate', () => {
            const code = `
module and_gate(input a, input b, output y);
  assign y = a & b;
endmodule`
            expect(errorsOf(code)).toHaveLength(0)
        })

        it('multiline module header (ANSI style) - no false semicolon warning', () => {
            const code = `
module top(
  input a,
  input b,
  output y
);
  assign y = a & b;
endmodule`
            const errors = errorsOf(code)
            const semicolonWarnings = errors.filter((e) =>
                e.message.includes('semicolon')
            )
            expect(semicolonWarnings).toHaveLength(0)
        })

        it('multiple ports on one input line', () => {
            const code = `
module test(input a, input b, output y);
  input [7:0] a, b;
  assign y = a & b;
endmodule`
            expect(errorsOf(code)).toHaveLength(0)
        })
    })

    describe('checkModuleBalance', () => {
        it('detects missing endmodule', () => {
            const code = `module test(input a, output b);\n  assign b = a;`
            const errors = errorsOf(code)
            expect(hasError(errors, 'Missing')).toBe(true)
        })

        it('detects extra endmodule', () => {
            const code = `
module test(input a, output b);
  assign b = a;
endmodule
endmodule`
            const errors = errorsOf(code)
            expect(hasError(errors, "Extra 'endmodule'")).toBe(true)
        })
    })

    describe('checkBeginEndBalance', () => {
        it('detects missing end', () => {
            const code = `
module test(input a, output b);
  always @(a) begin
    if (a) begin
      b = 1;
    end
endmodule`
            const errors = errorsOf(code)
            expect(hasError(errors, "Missing 'end'")).toBe(true)
        })

        it('detects extra end (Issue 1 fix)', () => {
            const code = `
module test(input a, output b);
  always @(a) begin
    b = a;
  end
  end
endmodule`
            const errors = errorsOf(code)
            expect(hasError(errors, "Extra 'end'")).toBe(true)
        })
    })

    describe('checkMissingSemicolons', () => {
        it('warns on missing semicolon after assign', () => {
            const code = `
module test(input a, output b);
  assign b = a
endmodule`
            const errors = errorsOf(code)
            expect(hasError(errors, 'semicolon')).toBe(true)
        })

        it('no warning on valid multiline module header', () => {
            const code = `
module test(
  input a,
  output b
);
  assign b = a;
endmodule`
            const errors = errorsOf(code)
            const semiErrors = errors.filter((e) =>
                e.message.includes('semicolon')
            )
            expect(semiErrors).toHaveLength(0)
        })
    })

    describe('checkKeywordTypos', () => {
        it('detects multiple typos', () => {
            const code = `modul test(input a, output b);\n  asign b = a;\nendmodule`
            const errors = errorsOf(code)
            expect(hasError(errors, 'modul')).toBe(true)
            expect(hasError(errors, 'asign')).toBe(true)
        })

        it('ignores typos inside comments', () => {
            const code = `
module test(input a, output b);
  // asign is just a comment
  assign b = a;
endmodule`
            const errors = errorsOf(code).filter((e) =>
                e.message.includes('asign')
            )
            expect(errors).toHaveLength(0)
        })
    })

    describe('checkPortDeclarations', () => {
        it('warns when port in header is never declared', () => {
            const code = `
module test(a, b, y);
  input a, b;
  assign y = a & b;
endmodule`
            const errors = errorsOf(code)
            expect(hasError(errors, "Port 'y'")).toBe(true)
        })

        it('no warning when all ports are declared', () => {
            const code = `
module test(a, b, y);
  input a;
  input b;
  output y;
  assign y = a & b;
endmodule`
            const errors = errorsOf(code).filter((e) =>
                e.message.includes('Port')
            )
            expect(errors).toHaveLength(0)
        })

        it('does not bleed ports across modules (Issue 4 fix)', () => {
            const code = `
module m1(input a, output y);
  assign y = a;
endmodule
module m2(input x, output z);
  assign z = x;
endmodule`
            expect(errorsOf(code)).toHaveLength(0)
        })
    })

    describe('checkEmptyModule', () => {
        it('warns on empty module body', () => {
            const code = `module empty(input a, output b);\nendmodule`
            const errors = errorsOf(code)
            expect(hasError(errors, 'Empty module')).toBe(true)
        })

        it('no warning when module has content', () => {
            const code = `
module test(input a, output b);
  assign b = a;
endmodule`
            const errors = errorsOf(code).filter((e) =>
                e.message.includes('Empty')
            )
            expect(errors).toHaveLength(0)
        })
    })

    describe('checkAssignToInput', () => {
        it('detects assign to input port', () => {
            const code = `
module test(input a, output b);
  assign a = b;
endmodule`
            const errors = errorsOf(code)
            expect(hasError(errors, "input port 'a'")).toBe(true)
        })

        it('valid assign has no error', () => {
            const code = `
module test(input a, output b);
  assign b = a;
endmodule`
            const errors = errorsOf(code).filter((e) =>
                e.message.includes('input port')
            )
            expect(errors).toHaveLength(0)
        })

        it('does not bleed inputPorts across modules (Issue 4 fix)', () => {
            const code = `
module m1(input a, output y);
  assign y = a;
endmodule
module m2(output z);
  assign a = z;
endmodule`
            const errors = errorsOf(code).filter((e) =>
                e.message.includes("input port 'a'")
            )
            expect(errors).toHaveLength(0)
        })

        it('handles multi-port input line (Issue 4 fix)', () => {
            const code = `
module test(input a, input b, output y);
  input [7:0] a, b;
  assign a = y;
endmodule`
            const errors = errorsOf(code)
            expect(hasError(errors, "input port 'a'")).toBe(true)
        })
    })
})
