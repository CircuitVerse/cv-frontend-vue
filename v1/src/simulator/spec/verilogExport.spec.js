import { setup } from '../src/setup';
import { verilog } from '../src/verilog';
import Input from '../src/modules/Input';
import Output from '../src/modules/Output';
import AndGate from '../src/modules/AndGate';
import XorGate from '../src/modules/XorGate';
import NotGate from '../src/modules/NotGate';
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

describe('Verilog export', () => {
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

    test('skips elements whose outputs are not connected', () => {
        const a = new Input(0, 0, globalScope, 'RIGHT', 1);
        const b = new Input(0, 50, globalScope, 'RIGHT', 1);

        // Inputs connected, outputs left unconnected
        const danglingAnd = new AndGate(100, 0, globalScope, 'RIGHT', 2, 1);
        a.output1.connect(danglingAnd.inp[0]);
        b.output1.connect(danglingAnd.inp[1]);
        const danglingXor = new XorGate(100, 100, globalScope, 'RIGHT', 2, 1);
        a.output1.connect(danglingXor.inp[0]);
        b.output1.connect(danglingXor.inp[1]);
        const danglingNot = new NotGate(100, 200, globalScope, 'RIGHT', 1);
        a.output1.connect(danglingNot.inp1);

        // Fully connected path that must still be exported
        const usedAnd = new AndGate(100, 300, globalScope, 'RIGHT', 2, 1);
        const out = new Output(200, 300, globalScope, 'LEFT', 1);
        a.output1.connect(usedAnd.inp[0]);
        b.output1.connect(usedAnd.inp[1]);
        usedAnd.output1.connect(out.inp1);

        const code = verilog.exportVerilog(globalScope);
        const module = code.slice(code.indexOf('module Main'));

        expect(module).not.toContain('undefined');
        expect(module).not.toMatch(/assign\s+=/);
        expect(module).toContain(`assign ${usedAnd.output1.verilogLabel} = ${a.label} & ${b.label};`);
        expect(module).toContain(`assign ${out.label} = ${usedAnd.output1.verilogLabel};`);
        expect(module.match(/assign /g)).toHaveLength(2);
    });
});
