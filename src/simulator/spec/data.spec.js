import { describe, test, expect, vi, beforeAll } from 'vitest';
import { setup } from '../src/setup';
import load from '../src/data/load';
import gatesCircuitData from './circuits/gates-circuitdata.json';
import decoderCircuitData from './circuits/Decoders-plexers-circuitdata.json';
import { checkIfBackup, scheduleBackup } from '../src/data/backupCircuit';
import undo from '../src/data/undo';
import redo from '../src/data/redo';
import { scopeList } from '../src/circuit';
import { errorDetectedGet, errorDetectedSet, play } from '../src/engine';
import save from '../src/data/save';
import {
    clearProject,
    newProject,
    recoverProject,
    saveOffline,
    openOffline,
} from '../src/data/project';
import createSaveAsImgPrompt from '../src/data/saveImage';
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

    test('undo and redo restore input state while preserving the view', () => {
        load(decoderCircuitData);
        scheduleBackup();
        const originalState = globalScope.Input[0].state;
        globalScope.Input[0].state = originalState === 1 ? 0 : 1;
        const editedState = globalScope.Input[0].state;
        scheduleBackup();
        globalScope.ox = 125;
        globalScope.oy = -75;
        globalScope.scale = 2;

        undo();
        expect(globalScope.Input[0].state).toBe(originalState);
        expect([globalScope.ox, globalScope.oy, globalScope.scale]).toEqual([125, -75, 2]);
        expect(window.loading).toBe(false);

        redo();
        expect(globalScope.Input[0].state).toBe(editedState);
        expect([globalScope.ox, globalScope.oy, globalScope.scale]).toEqual([125, -75, 2]);
        expect(window.loading).toBe(false);
    });

    test.each([
        ['undo', '{invalid json'],
        ['undo', '{"allNodes":[{}]}'],
        ['redo', '{invalid json'],
        ['redo', '{"allNodes":[{}]}'],
    ])('%s preserves circuit and history when restoring %s fails', (action, invalidBackup) => {
        load(decoderCircuitData);
        const validBackup = scheduleBackup();
        const originalScope = globalScope;
        originalScope.ox = 125;
        originalScope.oy = -75;
        originalScope.scale = 2;
        originalScope.backups = action === 'undo'
            ? [invalidBackup, validBackup]
            : [validBackup];
        originalScope.history = action === 'redo' ? [invalidBackup] : [];
        const backups = [...originalScope.backups];
        const history = [...originalScope.history];
        const allNodes = [...originalScope.allNodes];
        const restore = action === 'undo' ? undo : redo;
        const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});

        try {
            expect(() => restore()).not.toThrow();
            expect(errorLog).toHaveBeenCalledOnce();
            expect(globalScope).toBe(originalScope);
            expect(scopeList[originalScope.id]).toBe(originalScope);
            expect(originalScope.backups).toEqual(backups);
            expect(originalScope.history).toEqual(history);
            expect(originalScope.allNodes).toEqual(allNodes);
            expect([globalScope.ox, globalScope.oy, globalScope.scale]).toEqual([125, -75, 2]);
            expect(window.loading).toBe(false);

            // A failed restore must not prevent a later valid undo or redo.
            if (action === 'undo') originalScope.backups[0] = validBackup;
            else originalScope.history[0] = validBackup;
            expect(() => restore()).not.toThrow();
            expect(globalScope).not.toBe(originalScope);
            expect(scopeList[originalScope.id]).toBe(globalScope);
            expect(globalScope.backups).toHaveLength(action === 'undo' ? 1 : 2);
            expect(globalScope.history).toHaveLength(action === 'undo' ? 1 : 0);
            expect([globalScope.ox, globalScope.oy, globalScope.scale]).toEqual([125, -75, 2]);
            expect(window.loading).toBe(false);
        } finally {
            errorLog.mockRestore();
            window.loading = false;
        }
    });

    test.each([
        ['undo', false],
        ['redo', false],
        ['undo', true],
        ['redo', true],
    ])('%s preserves engine error state %s after a partial restore fails', (action, previousError) => {
        load(decoderCircuitData);
        const validBackup = scheduleBackup();
        const invalidData = JSON.parse(validBackup);
        invalidData.SubCircuit = [{ x: 0, y: 0, id: 'missing-restore-scope' }];
        const invalidBackup = JSON.stringify(invalidData);
        const originalScope = globalScope;
        originalScope.backups = action === 'undo'
            ? [invalidBackup, validBackup]
            : [validBackup];
        originalScope.history = action === 'redo' ? [invalidBackup] : [];
        const backups = [...originalScope.backups];
        const history = [...originalScope.history];
        const originalError = errorDetectedGet();
        const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
        errorDetectedSet(previousError);

        try {
            expect(() => (action === 'undo' ? undo : redo)()).not.toThrow();
            expect(errorLog).toHaveBeenCalledOnce();
            expect(globalScope).toBe(originalScope);
            expect(originalScope.backups).toEqual(backups);
            expect(originalScope.history).toEqual(history);
            expect(window.loading).toBe(false);
            expect(errorDetectedGet()).toBe(previousError);

            // A rejected backup must not stop the active circuit from simulating.
            const input = originalScope.Input[0];
            input.output1.value = undefined;
            play(originalScope, true);
            expect(input.output1.value).toBe(previousError ? undefined : input.state);
        } finally {
            errorLog.mockRestore();
            errorDetectedSet(originalError);
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

    test('render image dialog only offers formats the canvas can produce', async () => {
        createSaveAsImgPrompt();
        await nextTick();
        const formats = Array.from(
            document.querySelectorAll('input[name="imgType"]')
        ).map((input) => input.value);
        expect(formats).toEqual(['png', 'jpeg', 'svg']);
    });
});
