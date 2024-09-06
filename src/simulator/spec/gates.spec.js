import { setup } from '../src/setup';
import load from '../src/data/load';
import circuitData from './circuits/gates-circuitdata.json';
import testData from './testData/gates-testdata.json';
import { runAll } from '../src/testbench';
import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import i18n from '#/locales/i18n';
import { routes } from '#/router';
import vuetify from '#/plugins/vuetify';
import simulator from '#/pages/simulator.vue';
import ResizeObserver from 'resize-observer-polyfill';

global.ResizeObserver = ResizeObserver;

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

describe('Simulator Gates Working', () => {
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

    test('AND gate working', () => {
        const result = runAll(testData.AndGate);
        expect(result.summary.passed).toBe(4);
    });

    test('NAND gate working', () => {
        const result = runAll(testData.nandGate);
        expect(result.summary.passed).toBe(4);
    });

    test('NOR gate working', () => {
        const result = runAll(testData.norGate);
        expect(result.summary.passed).toBe(4);
    });

    test('NOT gate working', () => {
        const result = runAll(testData.notGate);
        expect(result.summary.passed).toBe(2);
    });

    test('OR gate working', () => {
        const result = runAll(testData.OrGate);
        expect(result.summary.passed).toBe(4);
    });

    test('XNOR gate working', () => {
        const result = runAll(testData.xnorGate);
        expect(result.summary.passed).toBe(4);
    });

    test('XOR gate working', () => {
        const result = runAll(testData.xorGate);
        expect(result.summary.passed).toBe(4);
    });
});
