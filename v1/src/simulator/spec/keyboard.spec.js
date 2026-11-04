import { setup } from '../src/setup';
import { play } from '../src/engine';
import Keyboard from '../src/sequential/Keyboard';
import TTY from '../src/sequential/TTY';
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

describe('Keyboard buffer size', () => {
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

    // Clock -> Keyboard and TTY clocks, Keyboard ascii output -> TTY input
    const buildCircuit = (y) => {
        const clock = new Clock(0, y, globalScope, 'RIGHT');
        const keyboard = new Keyboard(200, y, globalScope, 32);
        const tty = new TTY(600, y, globalScope, 3, 32);
        clock.output1.connect(keyboard.clockInp);
        clock.output1.connect(tty.clockInp);
        keyboard.asciiOutput.connect(tty.asciiInp);
        return { keyboard, tty };
    };
    const connectionCount = (element) =>
        element.nodeList.reduce((n, node) => n + node.connections.length, 0);
    const tick = () => {
        globalScope.clockTick();
        play(globalScope);
    };

    test('keeps the same element, its wires and its label', () => {
        const { keyboard } = buildCircuit(0);
        keyboard.setLabel('KB');
        const nodes = [...keyboard.nodeList];

        keyboard.changeBufferSize(40);

        expect(globalScope.Keyboard).toContain(keyboard);
        expect(keyboard.deleted).toBeFalsy();
        expect(keyboard.bufferSize).toBe(40);
        expect(keyboard.label).toBe('KB');
        expect(keyboard.nodeList).toEqual(nodes);
        expect(connectionCount(keyboard)).toBe(2);
    });

    test('keeps typed keys and drops the oldest ones when shrinking', () => {
        const { keyboard } = buildCircuit(200);
        keyboard.changeBufferSize(40);
        'abcdefghijklmnopqrstuvwxyz0123456789'.split('').forEach((c) => keyboard.keyDown(c));

        keyboard.changeBufferSize(50);
        expect(keyboard.buffer).toBe('abcdefghijklmnopqrstuvwxyz0123456789');

        keyboard.changeBufferSize(20);
        expect(keyboard.buffer).toBe('qrstuvwxyz0123456789');
    });

    test('resizes the element and keeps the clock pin on its left edge', () => {
        const { keyboard } = buildCircuit(400);

        keyboard.changeBufferSize(60);

        expect(keyboard.elementWidth).toBe(600);
        expect(keyboard.leftDimensionX).toBe(300);
        expect(keyboard.rightDimensionX).toBe(300);
        expect(keyboard.clockInp.x).toBe(-300);
        expect(keyboard.clockInp.leftx).toBe(-300);
    });

    test('ignores sizes outside 20-100', () => {
        const { keyboard } = buildCircuit(600);

        keyboard.changeBufferSize(10);
        keyboard.changeBufferSize(101);

        expect(keyboard.bufferSize).toBe(32);
        expect(connectionCount(keyboard)).toBe(2);
    });

    test('still sends keys to a connected TTY after resizing', () => {
        const { keyboard, tty } = buildCircuit(800);

        keyboard.changeBufferSize(48);
        keyboard.keyDown('h');
        keyboard.keyDown('i');
        play(globalScope);
        for (let i = 0; i < 8; i++) tick();

        expect(tty.data).toBe('hi');
    });
});
