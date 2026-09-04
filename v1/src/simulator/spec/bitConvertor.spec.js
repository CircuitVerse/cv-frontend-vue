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
        // Each decimal digit is one nibble in BCD, so the leading digit keeps
        // its zeros. The old implementation dropped them, which is not
        // canonical BCD and disagrees with convertToBCD in HexBinDec.vue.
        expect(convertors.dec2bcd(0)).toBe('0000');
        expect(convertors.dec2bcd(9)).toBe('1001');
        expect(convertors.dec2bcd(10)).toBe('00010000');
        expect(convertors.dec2bcd(25)).toBe('00100101');
        expect(convertors.dec2bcd(90)).toBe('10010000');
    });

    test('dec2bcd output survives the 4 bit group round trip', () => {
        // 99999999999999 is the important one: at 14 decimal digits the old
        // parseInt(x.toString(10), 16) exceeded MAX_SAFE_INTEGER and rounded,
        // so the value came back as 99999999999998.
        for (const value of [0, 5, 9, 10, 15, 25, 90, 255, 1000, 99999999999999]) {
            const bcd = convertors.dec2bcd(value);
            expect(bcd.length % 4).toBe(0);
            let parsed = 0;
            for (let i = 0; i < bcd.length / 4; i++) {
                const group = parseInt(bcd.slice(4 * i, 4 * (i + 1)), 2);
                // Every group must be a valid BCD digit, not just sum back
                // to the input, so 15 may never encode as a raw 1111 nibble.
                expect(group).toBeLessThan(10);
                parsed = parsed * 10 + group;
            }
            expect(parsed).toBe(value);
        }
    });
});

