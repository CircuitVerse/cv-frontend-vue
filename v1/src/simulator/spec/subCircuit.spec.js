import { setup } from '../src/setup';
import load from '../src/data/load';
import { scopeList, switchCircuit } from '../src/circuit';
import { SimulatorStore } from '#/store/SimulatorStore/SimulatorStore';
import circuitData from './circuits/subCircuit-circuitdata.json';
import { runAll } from '../src/testbench';
import testData from './testData/subCircuit-testdata.json';
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

describe('SubCircuit Testing', () => {
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

    test('load subCircuit data without throwing error', () => {
        expect(() => load(circuitData)).not.toThrow();
    });

    test('subCircuit working', () => {
        const result = runAll(testData.subCircuit);
        expect(result.summary.passed).toBe(8);
    });

    test('switchCircuit highlights tab and updates activeCircuit with string ID against numeric scope ID', () => {
        load(circuitData);
        const simulatorStore = SimulatorStore();
        const subScope = scopeList['98622262167'];
        subScope.id = 98622262167;
        const subTab = simulatorStore.circuit_list.find((c) => String(c.id) === '98622262167');
        expect(subTab).toBeDefined();
        subTab.id = 98622262167;

        switchCircuit('98622262167');

        expect(subTab.focussed).toBe(true);
        expect(String(simulatorStore.activeCircuit.id)).toBe('98622262167');
    });

    test('subcircuit dblclick() highlights tab and updates activeCircuit with string ID against numeric scope ID', () => {
        load(circuitData);
        const simulatorStore = SimulatorStore();
        const mainScope = scopeList['69980799589'];
        const subScope = scopeList['98622262167'];
        subScope.id = 98622262167;
        const subTab = simulatorStore.circuit_list.find((c) => String(c.id) === '98622262167');
        expect(subTab).toBeDefined();
        subTab.id = 98622262167;

        const subCircuitEl = mainScope.SubCircuit[0];
        expect(typeof subCircuitEl.id).toBe('string');
        expect(mainScope.checkDependency(98622262167)).toBe(true);
        expect(mainScope.checkDependency('98622262167')).toBe(true);

        subCircuitEl.elementHover = undefined;
        subCircuitEl.dblclick();

        expect(subTab.focussed).toBe(true);
        expect(String(simulatorStore.activeCircuit.id)).toBe('98622262167');
    });
});
