import { describe, test, expect, vi, beforeAll } from 'vitest';
import { setup } from '../src/setup';
import load from '../src/data/load';
import gatesCircuitData from './circuits/gates-circuitdata.json';
import decoderCircuitData from './circuits/Decoders-plexers-circuitdata.json';
import { checkIfBackup, scheduleBackup } from '../src/data/backupCircuit';
import undo from '../src/data/undo';
import redo from '../src/data/redo';
import save from '../src/data/save';
import {
    clearProject,
    newProject,
    recoverProject,
    saveOffline,
    openOffline,
} from '../src/data/project';
import createSaveAsImgPrompt from '../src/data/saveImage';
import { encodeBmp, encodeTiff } from '../src/data/imageFormats';
import { nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import simulator from '#/pages/simulatorHandler.vue';
import { createRouter, createWebHistory } from 'vue-router';
import i18n from '#/locales/i18n';
import vuetify from '#/plugins/vuetify';
import { routes } from '#/router';

vi.mock('codemirror', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        fromTextArea: vi.fn(() => ({ setValue: () => {} })),
    };
});

vi.mock('codemirror-editor-vue3', () => ({
    defineSimpleMode: vi.fn(),
}));

function twoByTwoPixels() {
    return new Uint8ClampedArray([
        255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 10, 20, 30, 255,
    ]);
}

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

    test('load gates_circuitData without throwing error', () => {
        expect(() => load(gatesCircuitData)).not.toThrow();
    });

    test('should load another circuit data decoder_circuitData', () => {
        expect(() => load(decoderCircuitData)).not.toThrow();
    });

    test('schedule backup working', () => {
        globalScope.Input.forEach((input) => {
            input.state = input.state === 1 ? 0 : 1;
            expect(() => scheduleBackup()).not.toThrow();
        });
    });

    test('check if backup performed', () => {
        expect(checkIfBackup(globalScope)).toBeTruthy();
    });

    test('undo working', () => {
        const beforeUndo = {
            backups: globalScope.backups.length,
            history: globalScope.history.length,
        };
        for (let i = 1; i < beforeUndo.backups; i++) {
            undo();
            const afterUndo = {
                backups: globalScope.backups.length + i,
                history: globalScope.history.length - i,
            };
            expect(afterUndo).toEqual(beforeUndo);
        }
    });

    test('redo working', () => {
        const beforeRedo = {
            backups: globalScope.backups.length,
            history: globalScope.history.length,
        };
        for (let i = 1; i < beforeRedo.history; i++) {
            redo();
            const afterRedo = {
                backups: globalScope.backups.length - i,
                history: globalScope.history.length + i,
            };
            expect(afterRedo).toEqual(beforeRedo);
        }
    });

    test('save updated circuit_data', () => {
        window.logixProjectId = decoderCircuitData.projectId;
        expect(() => save()).not.toThrow();
    });

    test('project working', () => {
        expect(() => newProject(true)).not.toThrow();
    });

    test('clear Project working', () => {
        expect(() => clearProject()).not.toThrow();
    });

    test('recover Project working', () => {
        localStorage.setItem('recover', JSON.stringify(gatesCircuitData));
        expect(() => recoverProject()).not.toThrow();
    });

    test('SaveOffline working', () => {
        expect(() => saveOffline()).not.toThrow();
    });

    test('OpenOffline working', () => {
        openOffline();
        document.querySelector('#openProjectDialog input')?.click();
        document.querySelector('#Open_offline_btn')?.click();
        expect(globalScope.id).toBe(11597572508);
    });

    test('saveImage working', () => {
        expect(() => createSaveAsImgPrompt()).not.toThrow();
    });

    test('render image dialog offers the formats the app can produce', async () => {
        createSaveAsImgPrompt();
        await nextTick();
        const formats = Array.from(
            document.querySelectorAll('input[name="imgType"]')
        ).map((input) => input.value);
        expect(formats).toEqual(['png', 'jpeg', 'svg', 'bmp', 'tiff']);
    });

    test('BMP encoding writes a real BMP header', () => {
        const bmp = encodeBmp(twoByTwoPixels(), 2, 2);
        const header = new DataView(bmp.buffer);
        expect(String.fromCharCode(bmp[0], bmp[1])).toBe('BM');
        expect(header.getUint32(2, true)).toBe(bmp.length);
        expect(header.getInt32(18, true)).toBe(2);
        expect(header.getInt32(22, true)).toBe(2);
        expect(header.getUint16(28, true)).toBe(24);
    });

    test('TIFF encoding writes a real TIFF header', () => {
        const tiff = encodeTiff(twoByTwoPixels(), 2, 2);
        const header = new DataView(tiff.buffer);
        const ifd = header.getUint32(4, true);
        expect(String.fromCharCode(tiff[0], tiff[1])).toBe('II');
        expect(header.getUint16(2, true)).toBe(42);
        expect(header.getUint16(ifd, true)).toBe(12);
        expect(header.getUint16(ifd + 2, true)).toBe(256);
        expect(header.getUint32(ifd + 10, true)).toBe(2);
    });

    test('TIFF offsets stay even when the pixel count is odd', () => {
        const tiff = encodeTiff(new Uint8ClampedArray([255, 0, 0, 255]), 1, 1);
        const header = new DataView(tiff.buffer);
        expect(header.getUint32(4, true) % 2).toBe(0);
    });
});
