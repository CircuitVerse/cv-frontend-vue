import { describe, test, expect, vi, beforeAll } from 'vitest';
import { setup } from '../src/setup';
import Scope, { scopeList } from '../src/circuit';
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
    projectSavedSet,
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

    test('onbeforeunload saves recovery data synchronously and sets returnValue', () => {
        projectSavedSet(false);
        global.embed = false;
        localStorage.removeItem('recover');

        const previousScopeList = { ...scopeList };
        const previousGlobalScope = global.globalScope;

        const testScope = new Scope('Main', 'Main');
        testScope.Input = [{
            saveObject: () => ({ layoutProperties: { x: 0, y: 0 } }),
            update: () => false,
        }];

        for (const id in scopeList) delete scopeList[id];
        scopeList[testScope.id] = testScope;
        global.globalScope = testScope;

        try {
            const event = {
                preventDefault: vi.fn(),
                returnValue: undefined,
            };
            window.onbeforeunload(event);
            expect(event.preventDefault).toHaveBeenCalled();
            expect(event.returnValue).toBe('');
            const recovery = localStorage.getItem('recover');
            expect(recovery).toBeTruthy();
            const parsed = JSON.parse(recovery);
            expect(Array.isArray(parsed.scopes)).toBe(true);
            expect(parsed.scopes.length).toBeGreaterThan(0);
            expect(Array.isArray(parsed.orderedTabs)).toBe(true);
            expect(parsed.scopes.some((s) => s.id === testScope.id)).toBe(true);
        } finally {
            for (const id in scopeList) delete scopeList[id];
            Object.assign(scopeList, previousScopeList);
            global.globalScope = previousGlobalScope;
        }
    });

    test('onbeforeunload preserves original tab order separately from dependency-first scope serialization', () => {
        projectSavedSet(false);
        global.embed = false;
        localStorage.removeItem('recover');

        const previousScopeList = { ...scopeList };
        const previousGlobalScope = global.globalScope;

        const mainScope = new Scope('Main', 'Main');
        const childScope = new Scope('Child', 'Child');

        mainScope.SubCircuit = [{
            id: childScope.id,
            removeConnections: () => {},
            makeConnections: () => {},
            saveObject: () => ({ id: childScope.id }),
            reset: () => {},
            update: () => false,
        }];

        childScope.Input = [{
            saveObject: () => ({ layoutProperties: { x: 0, y: 0 } }),
            update: () => false,
        }];

        for (const id in scopeList) delete scopeList[id];
        scopeList[mainScope.id] = mainScope;
        scopeList[childScope.id] = childScope;
        global.globalScope = mainScope;

        let tabsBar = document.getElementById('tabsBar');
        let cleanupTabsBar = false;
        if (!tabsBar) {
            tabsBar = document.createElement('div');
            tabsBar.id = 'tabsBar';
            document.body.appendChild(tabsBar);
            cleanupTabsBar = true;
        }
        const previousTabsBarHtml = tabsBar.innerHTML;
        tabsBar.innerHTML = `<div><div id="${mainScope.id}"></div><div id="${childScope.id}"></div></div>`;

        try {
            const event = {
                preventDefault: vi.fn(),
                returnValue: undefined,
            };

            window.onbeforeunload(event);

            expect(event.preventDefault).toHaveBeenCalled();
            expect(event.returnValue).toBe('');

            const recovery = localStorage.getItem('recover');
            expect(recovery).toBeTruthy();
            const parsed = JSON.parse(recovery);

            expect(parsed.orderedTabs).toEqual(['Main', 'Child']);
            expect(parsed.scopes.map((s) => s.id)).toEqual(['Child', 'Main']);
            expect(parsed.scopes.map((s) => s.name)).toEqual(['Child', 'Main']);
        } finally {
            tabsBar.innerHTML = previousTabsBarHtml;
            if (cleanupTabsBar) {
                tabsBar.remove();
            }
            for (const id in scopeList) delete scopeList[id];
            Object.assign(scopeList, previousScopeList);
            global.globalScope = previousGlobalScope;
        }
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
