import { setup } from '../src/setup';
import load from '../src/data/load';
import Stepper from '../src/modules/Stepper';
import RAM from '../src/sequential/RAM';
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

describe('Stepper and RAM at 31 and 32 bit widths', () => {
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

    const pressPlus = (stepper, times) => {
        for (let i = 0; i < times; i++) stepper.keyDown2('+');
        stepper.resolve();
    };

    test.each([8, 30, 31, 32])('Stepper counts up at %i bits', (bitWidth) => {
        const stepper = new Stepper(0, 0, globalScope, 'RIGHT', bitWidth);
        pressPlus(stepper, 3);
        expect(stepper.output1.value).toBe(3);
    });

    test.each([8, 31, 32])('Stepper stops at 2^n - 1 at %i bits', (bitWidth) => {
        const max = 2 ** bitWidth - 1;
        const stepper = new Stepper(0, 0, globalScope, 'RIGHT', bitWidth);
        stepper.state = max;
        pressPlus(stepper, 1);
        expect(stepper.output1.value).toBe(max);
    });

    const loadRam = (bitWidth, input) => {
        const ram = new RAM(0, 0, globalScope, 'RIGHT', bitWidth, 4);
        vi.spyOn(window, 'prompt').mockReturnValueOnce(input);
        ram.promptData();
        return ram.data.slice(0, input.split(' ').length);
    };

    test('RAM accepts full range values at 32 bits', () => {
        expect(loadRam(32, '0 7 4294967295')).toEqual([0, 7, 4294967295]);
    });

    test('RAM accepts full range values at 31 bits', () => {
        expect(loadRam(31, '0 2147483647')).toEqual([0, 2147483647]);
    });

    test('RAM still rejects values that do not fit', () => {
        const ram = new RAM(0, 0, globalScope, 'RIGHT', 8, 4);
        vi.spyOn(window, 'prompt').mockReturnValueOnce('1 256');
        ram.promptData();
        expect(ram.data[0]).toBeUndefined();
        expect(ram.data[1]).toBeUndefined();
    });
});
