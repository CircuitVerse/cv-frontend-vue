import { setup } from '../src/setup';
import load from '../src/data/load';
import circuitData from './circuits/misc-circuitdata.json';
import testData from './testData/misc-testdata.json';
import { runAll } from '../src/testbench';
import Splitter from '../src/modules/Splitter';
import verilogMultiplier from '../src/modules/verilogMultiplier';
import Scope from '../src/circuit';
import { simulationArea } from '../src/simulationArea';
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

describe('Simulator Misc-Elements Testing', () => {
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

    test('load circuitData', () => {
        expect(() => load(circuitData)).not.toThrow();
    });

    test('ALU working', () => {
        const result = runAll(testData.ALU);
        expect(result.summary.passed).toBe(28);
    });

    test('Adder working', () => {
        const result = runAll(testData.Adder);
        expect(result.summary.passed).toBe(8);
    });

    test('Buffer working', () => {
        const result = runAll(testData.buffer);
        expect(result.summary.passed).toBe(2);
    });

    test('TriState Buffer working', () => {
        const result = runAll(testData.Tristate);
        expect(result.summary.passed).toBe(4);
    });

    test('Tunnel working', () => {
        const result = runAll(testData.Tunnel);
        expect(result.summary.passed).toBe(2);
    });

    test("2's Compliment working", () => {
        const result = runAll(testData.comp);
        expect(result.summary.passed).toBe(8);
    });

    test('Controlled Inverter working', () => {
        const result = runAll(testData.ControlledInverter);
        expect(result.summary.passed).toBe(3);
    });

    test('Equal Splitter working', () => {
        const result = runAll(testData.SplitterEqual);
        expect(result.summary.passed).toBe(8);
    });

    test('UnEqual Splitter working', () => {
        const result = runAll(testData.SplitterUnEqual);
        expect(result.summary.passed).toBe(8);
    });

    test('Force Gate working', () => {
        const result = runAll(testData.ForceGate);
        expect(result.summary.passed).toBe(2);
    });

    test('Splitter keeps its output widths when the bit width changes', () => {
        const splitter = new Splitter(100, 100, globalScope, 'RIGHT', 4, [1, 3]);

        splitter.newBitWidth(8);

        expect(splitter.bitWidth).toBe(8);
        expect(splitter.inp1.bitWidth).toBe(8);
        expect(splitter.outputs.map((node) => node.bitWidth)).toEqual([1, 3]);
    });

    describe('Verilog multiplier precision', () => {
        afterEach(() => simulationArea.simulationQueue.reset());

        test.each(Array.from({ length: 32 }, (_, index) => index + 1))(
            'preserves exact product bits for %i-bit operands at every output width',
            (bitWidth) => {
                const maximum = 2 ** bitWidth - 1;
                const highBit = 2 ** (bitWidth - 1);
                const maskInput = (value) => value % (maximum + 1);
                const pairs = [
                    [0, 0], [0, maximum], [maximum, 0],
                    [1, maximum], [maximum, 1], [maximum, maximum],
                    [maximum, Math.max(0, maximum - 2)],
                    [highBit, highBit], [highBit - 1, maskInput(highBit + 1)],
                    [maskInput(0xaaaaaaaa), maskInput(0x55555555)],
                ];
                let seed = 0x12345678;
                for (let index = 0; index < 8; index++) {
                    seed = (1664525 * seed + 1013904223) >>> 0;
                    const a = maskInput(seed);
                    seed = (1664525 * seed + 1013904223) >>> 0;
                    pairs.push([a, maskInput(seed)]);
                }

                const scope = new Scope('MultiplierPrecision');
                for (let outputBitWidth = 1; outputBitWidth <= 32; outputBitWidth++) {
                    const multiplier = new verilogMultiplier(100, 100, scope, 'RIGHT', bitWidth, outputBitWidth);
                    for (const [a, b] of pairs) {
                        multiplier.inpA.value = a;
                        multiplier.inpB.value = b;
                        multiplier.resolve();
                        const expected = Number(BigInt.asUintN(outputBitWidth, BigInt(a) * BigInt(b)));
                        expect(multiplier.product.value, `${a} * ${b}, ${outputBitWidth}-bit output`).toBe(expected);
                    }
                }
            },
        );

        test.each([[undefined, 1], [1, undefined], [undefined, undefined]])(
            'does not resolve or enqueue an output with floating inputs %s and %s',
            (a, b) => {
                const multiplier = new verilogMultiplier(100, 100, new Scope('FloatingMultiplier'), 'RIGHT', 32, 32);
                multiplier.inpA.value = a;
                multiplier.inpB.value = b;
                simulationArea.simulationQueue.reset();
                multiplier.resolve();
                expect(multiplier.product.value).toBeUndefined();
                expect(simulationArea.simulationQueue.isEmpty()).toBe(true);
            },
        );
    });
});
