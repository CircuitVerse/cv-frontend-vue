import { setup } from '../src/setup';
import load from '../src/data/load';
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
import { switchCircuit } from '../src/circuit';
import { SimulatorStore } from '#/store/SimulatorStore/SimulatorStore';

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

    test('switchCircuit updates tab focus and activeCircuit when called with string id (issue #1552)', () => {
        const store = SimulatorStore();
        load(circuitData);

        const initialActiveId = store.activeCircuit.id;
        const targetCircuit = store.circuit_list.find(c => c.id != initialActiveId);
        expect(targetCircuit).toBeDefined();

        switchCircuit(String(targetCircuit.id));

        expect(store.activeCircuit.id).toBe(targetCircuit.id);
        const focused = store.circuit_list.find(c => c.id == targetCircuit.id);
        expect(focused.focussed).toBe(true);
    });

    test('double-clicking subcircuit with string id updates activeCircuit and highlights tab (issue #1552)', () => {
        const store = SimulatorStore();
        load(circuitData);

        const subcircuit = globalScope.SubCircuit[0];
        expect(subcircuit).toBeDefined();
        expect(typeof subcircuit.id).toBe('string');

        subcircuit.dblclick();

        expect(store.activeCircuit.id).toBe(Number(subcircuit.id));
        const focused = store.circuit_list.find(c => c.id == subcircuit.id);
        expect(focused.focussed).toBe(true);
    });
});
