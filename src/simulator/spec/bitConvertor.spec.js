import { setup } from '../src/setup';
import { bitConverterDialog, convertors, setBaseValues, setupBitConvertor } from '../src/utils';
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

describe('data dir working', () => {
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

    // Open BitConvertor Dialog
    test('bitConvertor Dialog working', () => {
        expect(() => bitConverterDialog()).not.toThrow();
    });

    test('function setupBitConvertor working', () => {
        expect(() => setupBitConvertor()).not.toThrow();
    });

    test('function setBaseValues working', () => {
        const randomBaseValue = Math.floor(Math.random() * 100);
        console.log('Testing for Base Value --> ', randomBaseValue);
        expect(() => setBaseValues(randomBaseValue)).not.toThrow();
    });
    test('dec2bcd pads every decimal digit to a 4 bit group', () => {
        // Each decimal digit is one nibble in BCD, so the first digit keeps
        // its leading zeros. The old implementation dropped them, and the
        // keyup parser, which reads 4 bit groups from the left, turned a
        // displayed 25 back into 91. Matches convertToBCD in HexBinDec.vue.
        expect(convertors.dec2bcd(0)).toBe('0000');
        expect(convertors.dec2bcd(9)).toBe('1001');
        expect(convertors.dec2bcd(10)).toBe('00010000');
        expect(convertors.dec2bcd(25)).toBe('00100101');
        expect(convertors.dec2bcd(90)).toBe('10010000');
    });

    test('dec2bcd output survives the 4 bit group round trip', () => {
        for (const value of [0, 5, 9, 10, 25, 90, 255, 1000]) {
            const bcd = convertors.dec2bcd(value);
            expect(bcd.length % 4).toBe(0);
            let parsed = 0;
            for (let i = 0; i < bcd.length / 4; i++) {
                parsed = parsed * 10 + parseInt(bcd.slice(4 * i, 4 * (i + 1)), 2);
            }
            expect(parsed).toBe(value);
        }
    });
});

