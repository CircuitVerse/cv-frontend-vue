import { setup } from '../src/setup';
import load from '../src/data/load';
import circuitData from './circuits/gates-circuitdata.json';
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

describe('Node deletion', () => {
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

    test('deleting a node removes it from its parent element nodeList', () => {
        const gate = globalScope.AndGate[0];
        const node = gate.inp[0];
        expect(gate.nodeList).toContain(node);

        node.delete();

        expect(gate.nodeList).not.toContain(node);
        expect(globalScope.allNodes).not.toContain(node);
        expect(globalScope.nodes).not.toContain(node);
    });

    test('deleting a node whose parent has no nodeList does not throw', () => {
        const node = globalScope.OrGate[0].inp[0];
        node.parent.nodeList = undefined;

        expect(() => node.delete()).not.toThrow();
    });

    test('deleting an element deletes every one of its nodes', () => {
        const gate = globalScope.NorGate[0];
        const nodes = [...gate.nodeList];
        expect(nodes.length).toBeGreaterThan(1);

        gate.delete();

        for (const node of nodes) {
            expect(node.deleted).toBe(true);
            expect(globalScope.allNodes).not.toContain(node);
        }
        expect(gate.nodeList).toEqual([]);
    });
});
