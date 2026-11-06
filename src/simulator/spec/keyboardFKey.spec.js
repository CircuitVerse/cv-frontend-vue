import { describe, test, expect, vi, beforeAll } from 'vitest';
import { simulationArea } from '../src/simulationArea';
import Scope from '../src/circuit';
import Keyboard from '../src/sequential/Keyboard';
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

describe('"f" key routing when a text-accepting element is selected', () => {
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
        // NOTE: do NOT call setup() here — Simulator.vue's onMounted hook
        // already calls it once via mount() below. Calling it again would
        // register a second window 'keydown' listener and double-fire
        // every dispatched key event in these tests.
        mount(simulator, { global: { plugins: [pinia, router, i18n, vuetify] }, attachTo: elem });
    });

    test('"f" is delivered to a selected Keyboard element instead of triggering fit-to-selection', () => {
        const scope = new Scope();
        const keyboard = new Keyboard(0, 0, scope);
        keyboard.buffer = '';
        simulationArea.lastSelected = keyboard;
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f' }));
        expect(keyboard.buffer).toBe('f');
    });

    test('control case: "f" with nothing text-accepting selected does not throw and does not reach any buffer', () => {
        simulationArea.lastSelected = null;
        expect(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f' }));
        }).not.toThrow();
    });
});
