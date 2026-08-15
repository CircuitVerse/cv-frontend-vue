import { describe, test, expect, vi, beforeAll } from 'vitest';
import { setup } from '../src/setup';
import load from '../src/data/load';
import gatesCircuitData from './circuits/gates-circuitdata.json';
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

        mount(simulator, {
            global: {
                plugins: [pinia, router, i18n, vuetify],
            },
            attachTo: elem,
        });

        setup();
        load(gatesCircuitData);
    });

    test('removes the node from its parent circuit element nodeList', () => {
        const andGate = globalScope.AndGate[0];
        const nodeToDelete = andGate.inp[0];

        expect(andGate.nodeList).toContain(nodeToDelete);

        nodeToDelete.delete();

        expect(andGate.nodeList).not.toContain(nodeToDelete);
    });

    test('removes the node from scope.allNodes and scope.nodes', () => {
        const andGate = globalScope.AndGate[0];
        const nodeToDelete = andGate.inp[1];

        nodeToDelete.delete();

        expect(globalScope.allNodes).not.toContain(nodeToDelete);
        expect(globalScope.nodes).not.toContain(nodeToDelete);
    });

    test('does not throw when the parent has no nodeList', () => {
        const andGate = globalScope.AndGate[0];
        const nodeToDelete = andGate.output1;
        const originalNodeList = nodeToDelete.parent.nodeList;
        nodeToDelete.parent.nodeList = undefined;

        expect(() => nodeToDelete.delete()).not.toThrow();

        nodeToDelete.parent.nodeList = originalNodeList;
    });
});
