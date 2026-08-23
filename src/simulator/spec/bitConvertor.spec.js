import { setup } from '../src/setup';
import { bitConverterDialog, setBaseValues, setupBitConvertor } from '../src/utils';
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

    test('bcd input updates the other fields', () => {
        setupBitConvertor();
        // 0010 0101 is the BCD encoding of the decimal number 25.
        $('#bcdInput').val('00100101');
        $('#bcdInput').trigger('keyup');
        expect($('#decimalInput').val()).toBe('25');
        expect($('#hexInput').val()).toBe('0x19');
        expect($('#binaryInput').val()).toBe('0b11001');
        expect($('#octalInput').val()).toBe('031');
    });

    test('bcd input rejects a nibble that is not a decimal digit', () => {
        setupBitConvertor();
        setBaseValues(7);
        // 1010 is 10, which is not a valid BCD digit, so nothing should update.
        $('#bcdInput').val('1010');
        $('#bcdInput').trigger('keyup');
        expect($('#decimalInput').val()).toBe('7');
    });

    test('function setBaseValues working', () => {
        const randomBaseValue = Math.floor(Math.random() * 100);
        console.log('Testing for Base Value --> ', randomBaseValue);
        expect(() => setBaseValues(randomBaseValue)).not.toThrow();
    });
});
