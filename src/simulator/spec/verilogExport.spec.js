import { setup } from '../src/setup';
import { verilog } from '../src/verilog';
import Input from '../src/modules/Input';
import Output from '../src/modules/Output';
import AndGate from '../src/modules/AndGate';
import XorGate from '../src/modules/XorGate';
import NotGate from '../src/modules/NotGate';
import PriorityEncoder from '../src/modules/PriorityEncoder';
import Decoder from '../src/modules/Decoder';
import LSB from '../src/modules/LSB';
import MSB from '../src/modules/MSB';
import Counter from '../src/modules/Counter';
import BitSelector from '../src/modules/BitSelector';
import Scope, { scopeList } from '../src/circuit';
import { runYosys } from '@yowasp/yosys';
import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import i18n from '#/locales/i18n';
import { routes } from '#/router';
import vuetify from '#/plugins/vuetify';
import simulator from '#/pages/simulator.vue';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

vi.mock('codemirror', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        fromTextArea: vi.fn(() => ({ setValue: () => { } })),
    };
});

vi.mock('codemirror-editor-vue3', () => ({
    defineSimpleMode: vi.fn(),
}));

function exportPriorityEncoder(bitWidth, connectedBits, connectValid = true, label = 'encoder') {
    const scope = new Scope('EncoderExport');
    scopeList[scope.id] = scope;

    try {
        const encoder = new PriorityEncoder(100, 100, scope, 'RIGHT', bitWidth);
        encoder.label = label;
        encoder.inp1.forEach((node, index) => {
            const input = new Input(0, index * 20, scope, 'RIGHT', 1);
            input.label = `in${index}`;
            input.output1.connect(node);
        });

        encoder.output1.forEach((node, index) => {
            if (connectedBits && !connectedBits.includes(index)) return;
            const output = new Output(200, index * 20, scope, 'LEFT', 1);
            output.label = `bit${index}`;
            node.connect(output.inp1);
        });

        if (connectValid) {
            const output = new Output(200, 100, scope, 'LEFT', 1);
            output.label = 'valid';
            encoder.enable.connect(output.inp1);
        }

        return verilog.exportVerilog(scope);
    } finally {
        delete scopeList[scope.id];
    }
}

function exportDecoder(bitWidth, connectedOutputs, label = 'decoder') {
    const scope = new Scope('DecoderExport');
    scopeList[scope.id] = scope;

    try {
        const decoder = new Decoder(200, 100, scope, 'LEFT', bitWidth);
        decoder.label = label;
        const input = new Input(300, 100, scope, 'LEFT', bitWidth);
        input.label = 'sel';
        input.output1.connect(decoder.input);

        decoder.output1.forEach((node, index) => {
            if (connectedOutputs && !connectedOutputs.includes(index)) return;
            const output = new Output(100, index * 20, scope, 'RIGHT', 1);
            output.label = `out${index}`;
            node.connect(output.inp1);
        });

        return verilog.exportVerilog(scope);
    } finally {
        delete scopeList[scope.id];
    }
}

function exportBitDetector(Element, bitWidth, connectPosition = true, connectValid = true) {
    const scope = new Scope('DetectorExport');
    scopeList[scope.id] = scope;

    try {
        const detector = new Element(100, 100, scope, 'RIGHT', bitWidth);
        const input = new Input(0, 100, scope, 'RIGHT', bitWidth);
        input.label = 'data';
        input.output1.connect(detector.inp1);
        if (connectPosition) {
            const output = new Output(200, 100, scope, 'LEFT', bitWidth);
            output.label = 'position';
            detector.output1.connect(output.inp1);
        }
        if (connectValid) {
            const output = new Output(200, 120, scope, 'LEFT', 1);
            output.label = 'valid';
            detector.enable.connect(output.inp1);
        }
        return verilog.exportVerilog(scope);
    } finally {
        delete scopeList[scope.id];
    }
}

function exportCounter(bitWidth, maximum) {
    const scope = new Scope('CounterExport');
    scopeList[scope.id] = scope;

    try {
        const counter = new Counter(100, 100, scope, bitWidth);
        for (const [name, node, width] of [
            ['max', counter.maxValue, bitWidth],
            ['clk', counter.clock, 1],
            ['rst', counter.reset, 1],
        ]) {
            const input = new Input(0, 0, scope, 'RIGHT', width);
            input.label = name;
            input.output1.connect(node);
        }
        for (const [name, node, width] of [
            ['count', counter.output, bitWidth],
            ['zero', counter.zero, 1],
        ]) {
            const output = new Output(200, 0, scope, 'LEFT', width);
            output.label = name;
            node.connect(output.inp1);
        }

        // Hold reset across clock edges, count through wraparound, then reset again.
        const inputs = [
            [0, 1], [1, 1], [0, 1], [0, 0],
            [1, 0], [0, 0], [1, 0], [0, 0],
            [1, 0], [0, 0], [1, 0], [0, 0],
            [1, 0], [0, 1], [1, 1], [0, 1],
        ];
        const samples = inputs.map(([clock, reset]) => {
            counter.maxValue.value = maximum;
            counter.clock.value = clock;
            counter.reset.value = reset;
            counter.resolve();
            return { clock, reset, count: counter.output.value, zero: counter.zero.value };
        });

        return { code: verilog.exportVerilog(scope), samples };
    } finally {
        delete scopeList[scope.id];
    }
}

function exportBitSelector(bitWidth, data, index) {
    const scope = new Scope('BitSelectorExport');
    scopeList[scope.id] = scope;

    try {
        const selector = new BitSelector(100, 100, scope, 'RIGHT', bitWidth, 32);
        const input = new Input(0, 100, scope, 'RIGHT', bitWidth);
        input.label = 'data';
        input.output1.connect(selector.inp1);
        const select = new Input(100, 200, scope, 'UP', 32);
        select.label = 'index';
        select.output1.connect(selector.bitSelectorInp);
        const output = new Output(200, 100, scope, 'LEFT', 1);
        output.label = 'selected';
        selector.output1.connect(output.inp1);

        selector.inp1.value = data;
        selector.bitSelectorInp.value = index;
        selector.resolve();

        return { code: verilog.exportVerilog(scope), selected: selector.output1.value };
    } finally {
        delete scopeList[scope.id];
    }
}

async function checkVerilog(code, commands) {
    const logs = [];
    const capture = (bytes) => {
        if (bytes) logs.push(new TextDecoder().decode(bytes));
    };
    try {
        await runYosys(['-p', `read_verilog input.v; ${commands}`], { 'input.v': code }, {
            stdout: capture,
            stderr: capture,
        });
    } catch (error) {
        throw new Error(logs.join(''), { cause: error });
    }
    return logs.join('');
}

function simulateVerilog(code) {
    const directory = mkdtempSync(join(tmpdir(), 'cv-counter-'));
    try {
        const source = join(directory, 'counter.v');
        const executable = join(directory, 'counter.vvp');
        writeFileSync(source, code);
        execFileSync('iverilog', ['-g2012', '-s', 'tb', '-o', executable, source], { encoding: 'utf8', timeout: 10000 });
        return execFileSync('vvp', [executable], { encoding: 'utf8', timeout: 10000 });
    } catch (error) {
        throw new Error([error.message, error.stdout, error.stderr].filter(Boolean).join('\n'), { cause: error });
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
}

describe('Verilog export', () => {
    let pinia;
    let router;

    beforeAll(async () => {
        pinia = createPinia();
        setActivePinia(pinia);

        router = createRouter({
            history: createWebHistory(),
            routes,
        });

        const elem = document.createElement('div')

        if (document.body) {
            document.body.appendChild(elem)
        }

        global.document.createRange = vi.fn(() => ({
            setEnd: vi.fn(),
            setStart: vi.fn(),
            getBoundingClientRect: vi.fn(() => ({
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
            })),
            getClientRects: vi.fn(() => ({
                item: vi.fn(() => null),
                length: 0,
                [Symbol.iterator]: vi.fn(() => []),
            })),
        }));

        global.globalScope = global.globalScope || {};

        mount(simulator, {
            global: {
                plugins: [pinia, router, i18n, vuetify],
            },
            attachTo: elem,
        });

        setup();
    });

    test('skips elements whose outputs are not connected', () => {
        const a = new Input(0, 0, globalScope, 'RIGHT', 1);
        const b = new Input(0, 50, globalScope, 'RIGHT', 1);

        // Inputs connected, outputs left unconnected
        const danglingAnd = new AndGate(100, 0, globalScope, 'RIGHT', 2, 1);
        a.output1.connect(danglingAnd.inp[0]);
        b.output1.connect(danglingAnd.inp[1]);
        const danglingXor = new XorGate(100, 100, globalScope, 'RIGHT', 2, 1);
        a.output1.connect(danglingXor.inp[0]);
        b.output1.connect(danglingXor.inp[1]);
        const danglingNot = new NotGate(100, 200, globalScope, 'RIGHT', 1);
        a.output1.connect(danglingNot.inp1);

        // Fully connected path that must still be exported
        const usedAnd = new AndGate(100, 300, globalScope, 'RIGHT', 2, 1);
        const out = new Output(200, 300, globalScope, 'LEFT', 1);
        a.output1.connect(usedAnd.inp[0]);
        b.output1.connect(usedAnd.inp[1]);
        usedAnd.output1.connect(out.inp1);

        const code = verilog.exportVerilog(globalScope);
        const module = code.slice(code.indexOf('module Main'));

        expect(module).not.toContain('undefined');
        expect(module).not.toMatch(/assign\s+=/);
        expect(module).toContain(`assign ${usedAnd.output1.verilogLabel} = ${a.label} & ${b.label};`);
        expect(module).toContain(`assign ${out.label} = ${usedAnd.output1.verilogLabel};`);
        expect(module.match(/assign /g)).toHaveLength(2);
    });

    describe.each([1, 2, 8])('%i-bit Counter export', (bitWidth) => {
        test.each([0, Math.min(3, 2 ** bitWidth - 1)])('matches simulator clock, reset and wraparound behavior with maximum %i', async (maximum) => {
            const { code, samples } = exportCounter(bitWidth, maximum);
            const proof = `
module check(input [${bitWidth - 1}:0] max, expected_count,
             input clk, rst, expected_zero, output ok);
    wire [${bitWidth - 1}:0] count;
    wire zero;
    CounterExport dut(.max(max), .clk(clk), .rst(rst), .count(count), .zero(zero));
    assign ok = (count == expected_count) && (zero == expected_zero);
endmodule
`;
            const constraints = samples.map((sample, index) => {
                const step = index + 1;
                return `-set-at ${step} clk ${sample.clock} -set-at ${step} rst ${sample.reset} ` +
                    `-set-at ${step} expected_count ${sample.count} -set-at ${step} expected_zero ${sample.zero}`;
            }).join(' ');
            const logs = await checkVerilog(code + proof,
                `prep -top check; flatten; clk2fflogic; opt; sat -seq ${samples.length} ` +
                `-set max ${maximum} ${constraints} -verify -prove ok 1`);

            expect(logs).toContain('SUCCESS!');
        }, 60000);
    });

    describe('Counter event timing in Icarus', () => {
        test.each([
            [1, 0, false], [1, 1, false], [2, 0, false], [2, 3, false],
            [8, 0, false], [8, 3, false], [32, 0, false], [32, 3, false],
            [2, 3, true],
        ])('clocks three chained %i-bit counters once per wrap with maximum %i (floating: %s)', (bitWidth, maximum, floating) => {
            const { code } = exportCounter(bitWidth, maximum);
            const maximumInput = floating ? `${bitWidth}'bz` : `${bitWidth}'d${maximum}`;
            const bench = `
module tb;
    reg clk = 0, rst = 1;
    wire [${bitWidth - 1}:0] a, b, c;
    wire za, zb, zc;
    integer cycle, pulses_a = 0, pulses_b = 0;
    CounterExport first(.max(${maximumInput}), .clk(clk), .rst(rst), .count(a), .zero(za));
    CounterExport second(.max(${maximumInput}), .clk(za), .rst(rst), .count(b), .zero(zb));
    CounterExport third(.max(${maximumInput}), .clk(zb), .rst(rst), .count(c), .zero(zc));
    always @(posedge za) if (!rst) begin
        pulses_a = pulses_a + 1;
        if (a !== 0) $fatal(1, "Zero rose before the first counter updated");
    end
    always @(posedge zb) if (!rst) begin
        pulses_b = pulses_b + 1;
        if (b !== 0) $fatal(1, "Zero rose before the second counter updated");
    end
    initial begin
        #2;
        if (a !== 0 || b !== 0 || c !== 0 || za !== 0 || zb !== 0 || zc !== 0)
            $fatal(1, "Incorrect startup while reset is held with a low clock");
        rst = 0;
        #2;
        for (cycle = 1; cycle <= 32; cycle = cycle + 1) begin
            clk = 1;
            #2;
            if (a !== cycle % ${maximum + 1} ||
                b !== (cycle / ${maximum + 1}) % ${maximum + 1} ||
                c !== (cycle / ${((maximum + 1) ** 2)}) % ${maximum + 1})
                $fatal(1, "Extra or missing chained clock edge at cycle %0d: %0d %0d %0d", cycle, a, b, c);
            if (pulses_a !== cycle / ${maximum + 1} || pulses_b !== cycle / ${((maximum + 1) ** 2)})
                $fatal(1, "Extra or missing Zero pulse at cycle %0d", cycle);
            if (za !== (a == 0) || zb !== ((b == 0) && za) || zc !== ((c == 0) && zb))
                $fatal(1, "Incorrect settled Zero output");
            clk = 0;
            #2;
            if (za !== 0 || zb !== 0 || zc !== 0) $fatal(1, "Zero did not clear on the falling edge");
        end
        $display("PASS chained counters");
        $finish;
    end
endmodule
`;
            expect(simulateVerilog(code + bench)).toContain('PASS chained counters');
        });

        test('emits one Zero edge at unsigned 32-bit overflow', () => {
            const bench = `
module tb;
    reg clk = 0, rst = 1;
    wire [31:0] count;
    wire zero;
    integer pulses = 0;
    Counter #(.WIDTH(32)) dut(count, zero, 32'hffffffff, clk, rst);
    always @(posedge zero) begin
        pulses = pulses + 1;
        if (count !== 0) $fatal(1, "Zero rose before the 32-bit counter updated");
    end
    initial begin
        #2; rst = 0;
        // Start near overflow instead of simulating four billion clock edges.
        dut.val = 32'hfffffffe;
        #2; clk = 1;
        #2;
        if (count !== 32'hffffffff || zero !== 0 || pulses !== 0) $fatal(1, "Incorrect maximum value");
        clk = 0; #2; clk = 1;
        #2;
        if (count !== 0 || zero !== 1 || pulses !== 1) $fatal(1, "Incorrect overflow pulse");
        clk = 0; #2; clk = 1;
        #2;
        if (count !== 1 || zero !== 0 || pulses !== 1) $fatal(1, "Extra pulse when leaving zero");
        $display("PASS 32-bit overflow");
        $finish;
    end
endmodule
`;
            expect(simulateVerilog(Counter.moduleVerilog() + bench)).toContain('PASS 32-bit overflow');
        });

        test.each([0, 1])('handles startup and asynchronous reset with initial clock %i', (initialClock) => {
            const { code } = exportCounter(2, 3);
            const bench = `
module tb;
    reg clk = ${initialClock}, rst = 1;
    wire [1:0] count;
    wire zero;
    integer pulses = 0;
    CounterExport dut(.max(2'd3), .clk(clk), .rst(rst), .count(count), .zero(zero));
    always @(posedge zero) pulses = pulses + 1;
    task check(input [1:0] expected_count, input expected_zero, input integer expected_pulses);
        begin
            #2;
            if (count !== expected_count || zero !== expected_zero || pulses !== expected_pulses)
                $fatal(1, "Reset/clock mismatch: count=%0d zero=%b pulses=%0d", count, zero, pulses);
        end
    endtask
    initial begin
        check(0, ${initialClock}, ${initialClock});
        clk = 0; check(0, 0, ${initialClock});
        clk = 1; check(0, 1, ${initialClock + 1});
        rst = 0; check(0, 1, ${initialClock + 1});
        clk = 0; check(0, 0, ${initialClock + 1});
        clk = 1; check(1, 0, ${initialClock + 1});
        rst = 1; check(0, 1, ${initialClock + 2});
        clk = 0; check(0, 0, ${initialClock + 2});
        rst = 0; check(0, 0, ${initialClock + 2});
        clk = 1; check(1, 0, ${initialClock + 2});
        clk = 0; check(1, 0, ${initialClock + 2});
        rst = 1; check(0, 0, ${initialClock + 2});
        rst = 0; check(0, 0, ${initialClock + 2});
        clk = 1; rst = 1; check(0, 1, ${initialClock + 3});
        rst = 0; check(0, 1, ${initialClock + 3});
        clk = 0; check(0, 0, ${initialClock + 3});
        clk = 1; check(1, 0, ${initialClock + 3});
        clk = 0; rst = 1; check(0, 0, ${initialClock + 3});
        rst = 0; check(0, 0, ${initialClock + 3});
        clk = 1; check(1, 0, ${initialClock + 3});
        $display("PASS reset timing");
        $finish;
    end
endmodule
`;
            expect(simulateVerilog(code + bench)).toContain('PASS reset timing');
        });
    });

    describe('BitSelector index bounds', () => {
        test.each([
            [1, 1, 0, 1],
            [8, 1, 0, 1],
            [8, 128, 7, 1],
            [8, 1, 7, 0],
            [32, 2147483648, 31, 1],
            [32, 2147483648, 0, 0],
            [8, 255, 8, 0],
            [32, 1, 32, 0],
            [8, 1, 32, 0],
            [8, 2, 33, 0],
            [32, 2, 33, 0],
            [32, 2147483648, 63, 0],
            [32, 2147483648, 4294967295, 0],
        ])('matches Verilog for width %i, data %i, index %i and output %i', async (bitWidth, data, index, expected) => {
            const { code, selected } = exportBitSelector(bitWidth, data, index);

            expect(selected).toBe(expected);
            const logs = await checkVerilog(code,
                `prep -top BitSelectorExport; flatten; sat -set data ${bitWidth}'h${data.toString(16)} ` +
                `-set index 32'h${index.toString(16)} -verify -prove selected ${expected}`);
            expect(logs).toContain('SUCCESS!');
        }, 60000);

        test('clears a previously high output for an invalid index and recovers for a valid index', () => {
            const scope = new Scope('BitSelectorTransitions');
            const selector = new BitSelector(100, 100, scope, 'RIGHT', 8, 6);
            selector.inp1.value = 1;

            for (const [index, expected] of [[0, 1], [32, 0], [0, 1]]) {
                selector.bitSelectorInp.value = index;
                selector.resolve();
                expect(selector.output1.value).toBe(expected);
            }
        });
    });

    test.each([1, 2, 3])('exports every PriorityEncoder input in descending priority for %i output bits', (bitWidth) => {
        PriorityEncoder.resetVerilog();
        PriorityEncoder.selSizes.add(bitWidth);

        const code = PriorityEncoder.moduleVerilog();
        const branches = [...code.matchAll(/\bif \(in(\d+)\)\s+sel = (\d+);/g)]
            .map((match) => [Number(match[1]), Number(match[2])]);
        const inputCount = 2 ** bitWidth;

        expect(branches).toEqual(Array.from({ length: inputCount }, (_, index) => {
            const input = inputCount - 1 - index;
            return [input, input];
        }));
    });

    test('exports an active-high PriorityEncoder valid output', () => {
        PriorityEncoder.resetVerilog();
        PriorityEncoder.selSizes.add(2);

        const code = PriorityEncoder.moduleVerilog();

        expect(code).toMatch(/ze = 1;\s+if \(in3\)/);
        expect(code).toMatch(/else\s+ze = 0;/);
    });

    test('uses the scalar selector directly for a two-input PriorityEncoder', () => {
        const code = exportPriorityEncoder(1);

        expect(code).toContain('assign encoder_out_0 = encoder_sel;');
        expect(code).not.toContain('encoder_sel[');
    });

    test.each([1, 2, 3, 4])('compiles and proves complete PriorityEncoder exports for %i output bits', async (bitWidth) => {
        const code = exportPriorityEncoder(bitWidth);
        const inputCount = 2 ** bitWidth;
        const inputs = Array.from({ length: inputCount }, (_, index) => `in${index}`);
        const ports = inputs.map((name) => `.${name}(${name})`);
        for (let index = 0; index < bitWidth; index++) {
            ports.push(`.bit${index}(selected[${index}])`);
        }
        ports.push('.valid(valid)');
        const expected = [...inputs].reverse().map((name, index) =>
            `${name} ? ${bitWidth}'d${inputCount - 1 - index} : `
        ).join('') + `${bitWidth}'d0`;
        const proof = `
module check(input ${inputs.join(', ')}, output ok);
    wire [${bitWidth - 1}:0] selected;
    wire valid;
    EncoderExport dut(${ports.join(', ')});
    assign ok = (selected == (${expected})) && (valid == (|{${inputs.join(', ')}}));
endmodule
`;
        const logs = await checkVerilog(code + proof,
            'prep -top check; flatten; sat -verify -prove ok 1');

        expect(logs).toContain('SUCCESS!');
    }, 60000);

    test.each([
        { bits: [0], valid: true },
        { bits: [1], valid: true },
        { bits: [], valid: true },
        { bits: [0, 1], valid: false },
        { bits: [], valid: false },
    ])('compiles PriorityEncoder exports with connected bits $bits and valid $valid', async ({ bits, valid }) => {
        const code = exportPriorityEncoder(2, bits, valid);

        await checkVerilog(code, 'hierarchy -check -top EncoderExport; proc; check -assert');
        expect(code).not.toContain('undefined');
    }, 60000);

    test.each([1, 2, 3, 4])('compiles and proves complete Decoder exports for %i input bits', async (bitWidth) => {
        const code = exportDecoder(bitWidth);
        const outputCount = 2 ** bitWidth;
        const ports = Array.from({ length: outputCount }, (_, index) =>
            `.out${index}(decoded[${index}])`
        );
        ports.push('.sel(sel)');
        const proof = `
module check(input [${bitWidth - 1}:0] sel, output ok);
    wire [${outputCount - 1}:0] decoded;
    DecoderExport dut(${ports.join(', ')});
    assign ok = decoded == (${outputCount}'b1 << sel);
endmodule
`;

        expect(code).not.toMatch(/Decoder\d+\s*#\s*\(/);
        const logs = await checkVerilog(code + proof,
            'prep -top check; flatten; memory_map; opt; sat -verify -prove ok 1');

        expect(logs).toContain('SUCCESS!');
    }, 60000);

    test.each([
        { connectedOutputs: [0] },
        { connectedOutputs: [3] },
        { connectedOutputs: [0, 3] },
        { connectedOutputs: [] },
    ])('compiles Decoder exports with connected outputs $connectedOutputs', async ({ connectedOutputs }) => {
        const code = exportDecoder(2, connectedOutputs);

        await checkVerilog(code, 'hierarchy -check -top DecoderExport; proc; check -assert');
        expect(code).not.toContain('undefined');
    }, 60000);

    test('compiles Decoder exports with an escaped instance label', async () => {
        const code = exportDecoder(2, undefined, 'decoder-test');

        await checkVerilog(code, 'hierarchy -check -top DecoderExport; proc; check -assert');
    }, 60000);

    test('compiles PriorityEncoder exports with an escaped instance label', async () => {
        const code = exportPriorityEncoder(2, undefined, true, 'encoder-test');

        await checkVerilog(code, 'hierarchy -check -top EncoderExport; proc; check -assert');
    }, 60000);
    describe.each([['LSB', LSB], ['MSB', MSB]])('%s detector export', (name, Element) => {
        test.each([1, 4, 32])('proves position and valid outputs for every %i-bit input', async (bitWidth) => {
            const code = exportBitDetector(Element, bitWidth);
            const loop = name === 'MSB'
                ? `i = 0; i < ${bitWidth}; i = i + 1`
                : `i = ${bitWidth - 1}; i >= 0; i = i - 1`;
            const proof = `
module check(input [${bitWidth - 1}:0] data, output ok);
    wire [${bitWidth - 1}:0] position;
    wire valid;
    reg [${bitWidth - 1}:0] expected;
    integer i;
    always @* begin
        expected = 0;
        for (${loop})
            if (data[i]) expected = i;
    end
    DetectorExport dut(.data(data), .position(position), .valid(valid));
    assign ok = (position == expected) && (valid == (|data));
endmodule
`;
            const logs = await checkVerilog(code + proof,
                'prep -top check; flatten; sat -verify -prove ok 1');

            expect(logs).toContain('SUCCESS!');
        }, 60000);

        test.each([
            [true, false],
            [false, true],
            [false, false],
        ])('compiles with position connected: %s, valid connected: %s', async (position, valid) => {
            const code = exportBitDetector(Element, 4, position, valid);

            await checkVerilog(code, 'hierarchy -check -top DetectorExport; proc; check -assert');
            expect(code).not.toContain('undefined');
        }, 60000);
    });

});
