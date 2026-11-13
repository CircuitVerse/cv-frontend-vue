import { describe, test, expect, vi, beforeAll } from 'vitest';
import '../src/setup';
import Scope from '../src/circuit';
import ForceGate from '../src/sequential/ForceGate';
import TB_Input from '../src/testbench/testbenchInput';
import TB_Output from '../src/testbench/testbenchOutput';
import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import simulator from '#/pages/simulatorHandler.vue';
import { createRouter, createWebHistory } from 'vue-router';
import i18n from '#/locales/i18n';
import vuetify from '#/plugins/vuetify';
import { routes } from '#/router';

vi.mock('codemirror', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, fromTextArea: vi.fn(() => ({ setValue: () => {} })) };
});
vi.mock('codemirror-editor-vue3', () => ({ defineSimpleMode: vi.fn() }));

describe('Element double-registration on construction', () => {
    beforeAll(async () => {
        const pinia = createPinia();
        setActivePinia(pinia);
        const router = createRouter({ history: createWebHistory(), routes });
        const elem = document.createElement('div');
        if (document.body) document.body.appendChild(elem);
        global.document.createRange = vi.fn(() => ({
            setEnd: vi.fn(), setStart: vi.fn(),
            getBoundingClientRect: vi.fn(() => ({ x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0 })),
            getClientRects: vi.fn(() => ({ item: vi.fn(() => null), length: 0, [Symbol.iterator]: vi.fn(() => []) })),
        }));
        mount(simulator, { global: { plugins: [pinia, router, i18n, vuetify] }, attachTo: elem });
    });

    test('ForceGate must register itself exactly once per instance', () => {
        const scope = new Scope();
        new ForceGate(0, 0, scope);
        expect(scope.ForceGate.length).toBe(1);
    });

    test('TB_Input must register itself exactly once per instance', () => {
        const scope = new Scope();
        new TB_Input(0, 0, scope);
        expect(scope.TB_Input.length).toBe(1);
    });

    test('TB_Output must register itself exactly once per instance', () => {
        const scope = new Scope();
        new TB_Output(0, 0, scope);
        expect(scope.TB_Output.length).toBe(1);
    });

    test('control case: multiple distinct ForceGate instances each register once', () => {
        const scope = new Scope();
        new ForceGate(0, 0, scope);
        new ForceGate(50, 0, scope);
        new ForceGate(100, 0, scope);
        expect(scope.ForceGate.length).toBe(3);
    });
});
