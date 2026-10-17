import { setup } from '../src/setup';
import Adder from '../src/modules/Adder';
import ALU from '../src/modules/ALU';
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

describe('Adder and ALU carry out', () => {
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

    // [bitWidth, A, B, Cin, expected sum, expected carry out]
    test.each([
        [1, 1, 0, 0, 1, 0],
        [1, 1, 1, 0, 0, 1],
        [8, 1, 1, 0, 2, 0],
        [8, 0xff, 1, 0, 0, 1],
        [8, 0xff, 0, 1, 0, 1],
        [32, 1, 1, 0, 2, 0],
        [32, 0xfffffffe, 1, 0, 0xffffffff, 0],
        [32, 0xffffffff, 1, 0, 0, 1],
        [32, 0xffffffff, 0, 1, 0, 1],
        [32, 0x80000000, 0x80000000, 0, 0, 1],
        [32, 0xffffffff, 0xffffffff, 1, 0xffffffff, 1],
    ])('Adder %i-bit: %i + %i + Cin %i', (bitWidth, a, b, cin, sum, cout) => {
        const adder = new Adder(0, 0, globalScope, 'RIGHT', bitWidth);
        adder.inpA.value = a;
        adder.inpB.value = b;
        adder.carryIn.value = cin;
        adder.resolve();
        expect(adder.sum.value).toBe(sum);
        expect(adder.carryOut.value).toBe(cout);
    });

    // [bitWidth, A, B, expected output, expected carry out]
    test.each([
        [8, 1, 1, 2, 0],
        [8, 0xff, 1, 0, 1],
        [32, 1, 1, 2, 0],
        [32, 0xffffffff, 1, 0, 1],
    ])('ALU A+B %i-bit: %i + %i', (bitWidth, a, b, output, cout) => {
        const alu = new ALU(0, 0, globalScope, 'RIGHT', bitWidth);
        alu.inp1.value = a;
        alu.inp2.value = b;
        alu.controlSignalInput.value = 2;
        alu.resolve();
        expect(alu.output.value).toBe(output);
        expect(alu.carryOut.value).toBe(cout);
    });

    // 32-bit values can reach a node as signed numbers, e.g. the ALU's
    // A&B output for 0xFFFFFFFF & 0xFFFFFFFF is -1 in JavaScript
    test('Adder treats signed 32-bit operands as unsigned', () => {
        const adder = new Adder(0, 0, globalScope, 'RIGHT', 32);
        adder.inpA.value = -1; // 0xFFFFFFFF
        adder.inpB.value = 2;
        adder.carryIn.value = 0;
        adder.resolve();
        expect(adder.sum.value).toBe(1);
        expect(adder.carryOut.value).toBe(1);
    });

    test('ALU A+B treats signed 32-bit operands as unsigned', () => {
        const alu = new ALU(0, 0, globalScope, 'RIGHT', 32);
        alu.inp1.value = -1; // 0xFFFFFFFF
        alu.inp2.value = 2;
        alu.controlSignalInput.value = 2;
        alu.resolve();
        expect(alu.output.value).toBe(1);
        expect(alu.carryOut.value).toBe(1);
    });

    test('carry is correct when an ALU A&B output feeds an Adder', () => {
        const alu = new ALU(0, 0, globalScope, 'RIGHT', 32);
        alu.inp1.value = 0xffffffff;
        alu.inp2.value = 0xffffffff;
        alu.controlSignalInput.value = 0; // A&B
        alu.resolve();

        const adder = new Adder(0, 0, globalScope, 'RIGHT', 32);
        adder.inpA.value = alu.output.value;
        adder.inpB.value = 2;
        adder.carryIn.value = 0;
        adder.resolve();
        expect(adder.sum.value).toBe(1);
        expect(adder.carryOut.value).toBe(1);
    });
});
