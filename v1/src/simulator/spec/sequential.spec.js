import { setup } from '../src/setup';
import load from '../src/data/load';
import circuitData from './circuits/sequential-circuitdata.json';
import testData from './testData/sequential-testdata.json';
import { runAll } from '../src/testbench';
import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import i18n from '#/locales/i18n';
import { routes } from '#/router';
import vuetify from '#/plugins/vuetify';
import simulator from '#/pages/simulator.vue';
import modules from '../src/modules';
import { play } from '../src/engine';

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

describe('Simulator Sequential Element Testing', () => {
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

    function buildJKCircuit() {
        const J = new modules.Input(0, 0, globalScope, 'RIGHT', 1);
        const K = new modules.Input(0, 40, globalScope, 'RIGHT', 1);
        const clock = new modules.Input(0, 80, globalScope, 'RIGHT', 1);
        const jk = new modules.JKflipFlop(200, 40, globalScope);
        J.output1.connect(jk.J);
        K.output1.connect(jk.K);
        clock.output1.connect(jk.clockInp);
        return { J, K, clock, jk };
    }

    function driveJK(ff, j, k, clk) {
        ff.J.state = j;
        ff.K.state = k;
        ff.clock.state = clk;
        play(globalScope);
    }

    test('JK Flip Flop holds state when J=0 and K=0', () => {
        const ff = buildJKCircuit();
        // J goes high while the clock is low, then back to 0 before the edge.
        driveJK(ff, 0, 0, 0);
        driveJK(ff, 1, 0, 0);
        driveJK(ff, 0, 0, 0);
        // Rising edge with J=K=0 must hold, not latch the stale value.
        driveJK(ff, 0, 0, 1);
        expect(ff.jk.qOutput.value).toBe(0);
    });

    test('JK Flip Flop still toggles when J=1 and K=1', () => {
        const ff = buildJKCircuit();
        driveJK(ff, 0, 0, 0); // Q = 0
        driveJK(ff, 1, 1, 0);
        driveJK(ff, 1, 1, 1); // rising edge toggles 0 -> 1
        expect(ff.jk.qOutput.value).toBe(1);
    });

    test('load circuitData', () => {
        expect(() => load(circuitData)).not.toThrow();
    });

    test('D Flip Flop working', () => {
        const result = runAll(testData.DFlipFlop);
        expect(result.summary.passed).toBe(2);
    });

    test('D latch working', () => {
        const result = runAll(testData.DLatch);
        expect(result.summary.passed).toBe(2);
    });

    test('JK Flip Flop working', () => {
        const result = runAll(testData.JkFlipFlop);
        expect(result.summary.passed).toBe(4);
    });

    test('SR Flip Flop working', () => {
        const result = runAll(testData.SRFlipFlop);
        expect(result.summary.passed).toBe(4);
    });

    test('T Flip Flop working', () => {
        const result = runAll(testData.TFlipFlop);
        expect(result.summary.passed).toBe(4);
    });
});
