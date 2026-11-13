import { setup } from '../src/setup';
import { verilog } from '../src/verilog';
import Input from '../src/modules/Input';
import Output from '../src/modules/Output';
import AndGate from '../src/modules/AndGate';
import XorGate from '../src/modules/XorGate';
import NotGate from '../src/modules/NotGate';
import PriorityEncoder from '../src/modules/PriorityEncoder';
import Scope, { scopeList } from '../src/circuit';
import { runYosys } from '@yowasp/yosys';
import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import i18n from '#/locales/i18n';
import { routes } from '#/router';
import vuetify from '#/plugins/vuetify';
import simulator from '#/pages/simulator.vue';

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

async function checkVerilog(code, commands) {
    const logs = [];
    const capture = (bytes) => {
        if (bytes) logs.push(new TextDecoder().decode(bytes));
    };
    await runYosys(['-p', `read_verilog input.v; ${commands}`], { 'input.v': code }, {
        stdout: capture,
        stderr: capture,
    });
    return logs.join('');
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

    test('compiles PriorityEncoder exports with an escaped instance label', async () => {
        const code = exportPriorityEncoder(2, undefined, true, 'encoder-test');

        await checkVerilog(code, 'hierarchy -check -top EncoderExport; proc; check -assert');
    }, 60000);
});
