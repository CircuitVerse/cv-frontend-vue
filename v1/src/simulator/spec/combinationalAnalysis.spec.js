import { setup } from '../src/setup';
import { runAll } from '../src/testbench';
import testData from './testData/gates-testdata.json';
import { GenerateCircuit, performCombinationalAnalysis, solveBooleanFunction } from '../src/combinationalAnalysis';
import Scope from '../src/circuit';
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

describe('Combinational Analysis Testing', () => {
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

    test('performCombinationalAnalysis function working', () => {
        expect(() => performCombinationalAnalysis('', '', 'AB')).not.toThrow();
    });

    test('Generating Circuit', () => {
        const tableBody = [
            [0, 0, 0],
            [0, 1, 0],
            [1, 0, 0],
            [1, 1, 1],
        ];
        expect(() =>
            GenerateCircuit([13], ['A', 'B'], [0, 0, 0, 1], 'AB', tableBody, 2)
        ).not.toThrow();
    });

    test('solveBooleanFunction returns a truth table instead of throwing', () => {
        const output = solveBooleanFunction(['A', 'B'], 'AB');
        expect(output).toEqual([0, 0, 0, 1]);
    });

    test('Generating Circuit from an editable (x/0/1) truth table', () => {
        const tableBody = [
            [0, 0, '0'],
            [0, 1, 'x'],
            [1, 0, 'x'],
            [1, 1, '1'],
        ];
        expect(() =>
            GenerateCircuit([13], ['C', 'D'], null, ['OUT'], tableBody, 2, new Scope('testScope'))
        ).not.toThrow();
    });

    test('testing Combinational circuit', () => {
        testData.AndGate.groups[0].inputs[0].label = 'A';
        testData.AndGate.groups[0].inputs[1].label = 'B';
        testData.AndGate.groups[0].outputs[0].label = 'AB';

        const result = runAll(testData.AndGate);
        expect(result.summary.passed).toBe(4);
    });
});
