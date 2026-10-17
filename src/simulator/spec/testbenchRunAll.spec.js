import { setup } from '../src/setup';
import { runAll } from '../src/testbench';
import { play } from '../src/engine';
import Input from '../src/modules/Input';
import Output from '../src/modules/Output';
import Counter from '../src/modules/Counter';
import Clock from '../src/sequential/Clock';
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

describe('Testbench runAll (sequential)', () => {
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

    // 3-bit counter: Clock -> Counter, RST -> Counter reset, Counter -> Q
    const counterTest = () => ({
        type: 'seq',
        title: 'Counter counts up',
        groups: [
            {
                label: 'Count up from reset',
                inputs: [{ label: 'EN', bitWidth: 1, values: ['0', '0', '0'] }],
                outputs: [{ label: 'Q', bitWidth: 3, values: ['001', '010', '011'] }],
                n: 3,
            },
        ],
    });

    test('gives the same result when the circuit state has changed between runs', () => {
        const clock = new Clock(0, 0, globalScope, 'RIGHT');
        const rst = new Input(0, 50, globalScope, 'RIGHT', 1);
        rst.label = 'RST';
        const en = new Input(0, 100, globalScope, 'RIGHT', 1);
        en.label = 'EN';
        const counter = new Counter(100, 50, globalScope, 3);
        const q = new Output(200, 50, globalScope, 'LEFT', 3);
        q.label = 'Q';
        clock.output1.connect(counter.clock);
        rst.output1.connect(counter.reset);
        counter.output.connect(q.inp1);
        play(globalScope);

        const first = runAll(counterTest(), globalScope);
        expect(first.summary).toEqual({ passed: 3, total: 3 });

        // The circuit's own clock keeps running between runs
        for (let i = 0; i < 2; i++) {
            globalScope.clockTick();
            play(globalScope);
            globalScope.clockTick();
            play(globalScope);
        }
        expect(counter.value).not.toBe(0);

        const second = runAll(counterTest(), globalScope);
        expect(second.summary).toEqual({ passed: 3, total: 3 });
        expect(second.detailed.groups[0].outputs[0].results).toEqual(['001', '010', '011']);
    });
});
