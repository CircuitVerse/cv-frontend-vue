import { setup } from '../src/setup';
import { verilog } from '../src/verilog';
import Input from '../src/modules/Input';
import Output from '../src/modules/Output';
import AndGate from '../src/modules/AndGate';
import XorGate from '../src/modules/XorGate';
import NotGate from '../src/modules/NotGate';
import verilogMultiplier from '../src/modules/verilogMultiplier';
import verilogDivider from '../src/modules/verilogDivider';
import verilogPower from '../src/modules/verilogPower';
import verilogShiftLeft from '../src/modules/verilogShiftLeft';
import verilogShiftRight from '../src/modules/verilogShiftRight';
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

    it('correctly exports arithmetic modules using native continuous assignments', () => {
        setup();
        const a = new Input(0, 0, globalScope, 'RIGHT', 4);
        const b = new Input(0, 50, globalScope, 'RIGHT', 4);
        a.label = 'a';
        b.label = 'b';

        const mult = new verilogMultiplier(100, 0, globalScope, 'RIGHT', 4, 8);
        const outMult = new Output(200, 0, globalScope, 'LEFT', 8);
        outMult.label = 'out_mult';
        a.output1.connect(mult.inpA);
        b.output1.connect(mult.inpB);
        mult.product.connect(outMult.inp1);

        const div = new verilogDivider(100, 100, globalScope, 'RIGHT', 4, 4);
        const outQuot = new Output(200, 100, globalScope, 'LEFT', 4);
        const outRem = new Output(200, 150, globalScope, 'LEFT', 4);
        outQuot.label = 'out_quot';
        outRem.label = 'out_rem';
        a.output1.connect(div.inpA);
        b.output1.connect(div.inpB);
        div.quotient.connect(outQuot.inp1);
        div.remainder.connect(outRem.inp1);

        const pow = new verilogPower(100, 200, globalScope, 'RIGHT', 4, 8);
        const outPow = new Output(200, 200, globalScope, 'LEFT', 8);
        outPow.label = 'out_pow';
        a.output1.connect(pow.inpA);
        b.output1.connect(pow.inpB);
        pow.answer.connect(outPow.inp1);

        const shl = new verilogShiftLeft(100, 300, globalScope, 'RIGHT', 4, 4);
        const outShl = new Output(200, 300, globalScope, 'LEFT', 4);
        outShl.label = 'out_shl';
        a.output1.connect(shl.inp1);
        b.output1.connect(shl.shiftInp);
        shl.output1.connect(outShl.inp1);

        const shr = new verilogShiftRight(100, 400, globalScope, 'RIGHT', 4, 4);
        const outShr = new Output(200, 400, globalScope, 'LEFT', 4);
        outShr.label = 'out_shr';
        a.output1.connect(shr.inp1);
        b.output1.connect(shr.shiftInp);
        shr.output1.connect(outShr.inp1);

        const code = verilog.exportVerilog(globalScope);
        const module = code.slice(code.indexOf('module Main'));

        expect(module).toContain(`assign ${mult.product.verilogLabel} = ${a.label} * ${b.label};`);
        expect(module).toContain(`assign ${div.quotient.verilogLabel} = ${a.label} / ${b.label};`);
        expect(module).toContain(`assign ${div.remainder.verilogLabel} = ${a.label} % ${b.label};`);
        expect(module).toContain(`assign ${pow.answer.verilogLabel} = ${a.label} ** ${b.label};`);
        expect(module).toContain(`assign ${shl.output1.verilogLabel} = ${a.label} << ${b.label};`);
        expect(module).toContain(`assign ${shr.output1.verilogLabel} = ${a.label} >> ${b.label};`);
        expect(module).not.toContain('verilogMultiplier verilogMultiplier');
        expect(module).not.toContain('verilogDivider verilogDivider');
        expect(module).not.toContain('verilogPower verilogPower');
        expect(module).not.toContain('verilogShiftLeft verilogShiftLeft');
        expect(module).not.toContain('verilogShiftRight verilogShiftRight');
    });

    it('uses sized zero literals for disconnected arithmetic inputs', () => {
        setup();
        const a = new Input(0, 0, globalScope, 'RIGHT', 4);
        a.label = 'a';

        const div = new verilogDivider(100, 100, globalScope, 'RIGHT', 4, 4);
        const outQuot = new Output(200, 100, globalScope, 'LEFT', 4);
        outQuot.label = 'out_quot';
        a.output1.connect(div.inpA);
        div.quotient.connect(outQuot.inp1);

        const code = verilog.exportVerilog(globalScope);
        const module = code.slice(code.indexOf('module Main'));

        expect(module).toContain(`assign ${div.quotient.verilogLabel} = ${a.label} / 4'd0;`);
    });
});
