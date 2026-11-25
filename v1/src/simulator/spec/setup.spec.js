import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { setup } from '../src/setup';
import { generateSaveData } from '../src/data/save';
import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import simulator from '#/pages/simulatorHandler.vue';
import { createRouter, createWebHistory } from 'vue-router';
import i18n from '#/locales/i18n';
import vuetify from '#/plugins/vuetify';
import { routes } from '#/router';
import { useProjectStore } from '#/store/projectStore';
import { zoomToFit } from '#/components/Navbar/QuickButton/QuickButton';
import { changeScale } from '../src/canvasApi';
import {
    syncZoomSlider,
    zoomLevel,
    getCurLevel,
    setCurLevel,
    increment,
} from '../src/commands/zoom';
import { layoutModeSet } from '../src/layoutMode';

const confirmSingleOptionMock = vi.fn();
vi.mock('#/utils/confirm', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        confirmSingleOption: (...args) => confirmSingleOptionMock(...args),
    };
});

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

describe('setup regression tests (v1)', () => {
    let pinia;
    let router;

    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);

        router = createRouter({
            history: createWebHistory(),
            routes,
        });

        const elem = document.createElement('div');
        if (document.body) {
            document.body.appendChild(elem);
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

        global.fetch = vi.fn().mockImplementation(() =>
            Promise.resolve({
                ok: true,
                json: () =>
                    Promise.resolve({
                        data: {
                            id: '1',
                            attributes: {
                                name: 'User',
                                profile_picture: 'original/Default.jpg',
                                locale: 'en',
                                admin: false,
                            },
                        },
                    }),
            })
        );

        window.logixProjectId = 0;

        mount(simulator, {
            global: {
                plugins: [pinia, router, i18n, vuetify],
            },
            attachTo: elem,
        });

        confirmSingleOptionMock.mockClear();
    });

    afterEach(() => {
        window.logixProjectId = 0;
        layoutModeSet(false);
        zoomLevel.value = 5;
        setCurLevel(5);
    });

    test('null circuit_data should load cleanly with no error popup', async () => {
        // Stub fetch to return null (simulating a new assignment)
        global.fetch = vi.fn().mockImplementation((url) => {
            if (typeof url === 'string' && url.includes('circuit_data')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(null),
                });
            }
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ data: { id: 1, attributes: { name: 'Assignment' } } }),
            });
        });

        window.logixProjectId = 123;

        setup();

        const projectStore = useProjectStore();
        await vi.waitFor(() => expect(projectStore.getProjectName).toBe('Assignment'));

        // Assert that the error popup ('Error: Could not load.') was NOT shown
        expect(confirmSingleOptionMock).not.toHaveBeenCalled();
    });

    test('null circuit_data preserves assignment project name from project endpoint', async () => {
        global.fetch = vi.fn().mockImplementation((url) => {
            if (typeof url === 'string' && url.includes('circuit_data')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(null),
                });
            }
            if (typeof url === 'string' && url.includes('/api/v1/projects/123')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        data: {
                            id: '123',
                            type: 'project',
                            attributes: {
                                name: 'Student/Assignment 1',
                            },
                        },
                    }),
                });
            }
            return Promise.resolve({
                ok: true,
                json: () =>
                    Promise.resolve({
                        data: {
                            id: '1',
                            attributes: {
                                name: 'User',
                                profile_picture: 'original/Default.jpg',
                                locale: 'en',
                                admin: false,
                            },
                        },
                    }),
            });
        });

        window.logixProjectId = 123;

        setup();

        const projectStore = useProjectStore();
        await vi.waitFor(() => expect(projectStore.getProjectName).toBe('Student/Assignment 1'));

        expect(confirmSingleOptionMock).not.toHaveBeenCalled();
        expect(projectStore.getProjectNameDefined).toBe(true);

        const savedData = await generateSaveData();
        const savedName = typeof savedData === 'string' ? JSON.parse(savedData).name : savedData.name;
        expect(savedName).toBe('Student/Assignment 1');
    });

    test('zoomToFit syncs slider to new scale and matches centerFocus alone with no double zoom', () => {
        // Arrange: initialize simulator with viewport dimensions and zoom in so slider is at 7
        setup();
        window.width = 1000;
        window.height = 1000;
        increment();
        increment();
        expect(zoomLevel.value).toBe(7);

        // Act: run zoomToFit (Fit to Screen)
        zoomToFit();

        // Assert: slider resets to 5 (corresponding to DPR=1) and scale equals centerFocus alone
        const expectedLevel = Math.max(0, Math.min(45, Math.round(5 + (globalScope.scale - (window.DPR || 1)) * 10)));
        expect(zoomLevel.value).toBe(expectedLevel);
        expect(zoomLevel.value).toBe(5);
        expect(globalScope.scale).toBeCloseTo(1, 5);
    });

    test('subsequent slider drag and +/- buttons change scale smoothly with no jump after zoomToFit', () => {
        // Arrange: zoom in, then zoomToFit so slider and curLevel are synced back to 5
        setup();
        window.width = 1000;
        window.height = 1000;
        increment();
        increment();
        zoomToFit();
        expect(zoomLevel.value).toBe(5);
        const scaleAtFit = globalScope.scale;

        // Act & Assert: + button changes scale by exactly +0.1 relative to synced position
        increment();
        expect(zoomLevel.value).toBe(6);
        expect(globalScope.scale).toBeCloseTo(scaleAtFit + 0.1, 5);

        // Act & Assert: moving slider directly by 1 step from 6 to 7 changes scale by +0.1
        zoomLevel.value = 7;
        const changeInScale = zoomLevel.value - getCurLevel();
        changeScale(changeInScale * 0.1, 'zoomButton', 'zoomButton', 3);
        setCurLevel(zoomLevel.value);
        expect(globalScope.scale).toBeCloseTo(scaleAtFit + 0.2, 5);
    });

    test('syncZoomSlider clamps knob within [0, 45] at scale bounds below 0.5 and above maximum', () => {
        setup();

        // Act & Assert: scale below 0.5 clamps knob to 0
        globalScope.scale = 0.2;
        syncZoomSlider();
        expect(zoomLevel.value).toBe(0);

        // Act & Assert: scale above 4.5 clamps knob to 45
        globalScope.scale = 6.0;
        syncZoomSlider();
        expect(zoomLevel.value).toBe(45);
    });

    test('syncZoomSlider accounts for DPR != 1 correctly', () => {
        setup();
        const originalDPR = window.DPR;
        window.DPR = 2;

        try {
            // Act: scale at DPR baseline (2.0)
            globalScope.scale = 2.0;
            syncZoomSlider();
            expect(zoomLevel.value).toBe(5);

            // Act: scale at 2.3 (3 steps above baseline)
            globalScope.scale = 2.3;
            syncZoomSlider();
            expect(zoomLevel.value).toBe(8);
        } finally {
            window.DPR = originalDPR;
        }
    });

    test('direct centerFocus call site does not modify the slider', () => {
        setup();
        increment();
        expect(zoomLevel.value).toBe(6);

        // Act: direct centerFocus call from internal callers (e.g. data/load or canvasApi)
        globalScope.centerFocus(false);

        // Assert: slider remains at 6 because fix is scoped to user zoomToFit action
        expect(zoomLevel.value).toBe(6);
    });

    test('layout mode prevents slider update during centerFocus and syncZoomSlider', () => {
        setup();
        zoomLevel.value = 10;
        setCurLevel(10);
        layoutModeSet(true);

        try {
            // Act: zoomToFit while layout mode is active
            zoomToFit();

            // Assert: slider remains unchanged because layout mode returns early
            expect(zoomLevel.value).toBe(10);
        } finally {
            layoutModeSet(false);
        }
    });

    test('syncZoomSlider uses DPR baseline 1 in lightMode even when window.DPR is 2', () => {
        // Guards lightMode baseline: ensures fitted scale 1 on 2x display maps to level 5 instead of clamping to 0
        setup();
        const originalDPR = window.DPR;
        const originalLightMode = window.lightMode;
        window.DPR = 2;
        window.lightMode = true;

        try {
            globalScope.scale = 1.0;
            syncZoomSlider();
            expect(zoomLevel.value).toBe(5);
            expect(getCurLevel()).toBe(5);
        } finally {
            window.DPR = originalDPR;
            window.lightMode = originalLightMode;
        }
    });
});

