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
import { increment, decrement, zoomToFit } from '#/components/Navbar/QuickButton/QuickButton';
import { syncZoomSlider } from '../src/listeners';
import { layoutModeSet } from '../src/layoutMode';

const confirmSingleOptionMock = vi.fn();
vi.mock('#/components/helpers/confirmComponent/ConfirmComponent.vue', async (importOriginal) => {
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

describe('setup regression tests', () => {
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
        $(document).off('input change', '#customRange1');
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

    test('zoom increment and decrement buttons keep slider in sync with canvas scale and prevent double zoom', () => {
        $(document).off('input change', '#customRange1');
        setup();
        const slider = document.getElementById('customRange1');
        expect(slider).not.toBeNull();

        // Default slider value from zoomSliderListeners is 5
        expect(slider.value).toBe('5');
        const initialScale = globalScope.scale;

        // Increment moves slider from 5 to 6 and increases scale by 0.1
        increment();
        expect(slider.value).toBe('6');
        expect(globalScope.scale).toBeCloseTo(initialScale + 0.1, 5);

        // Decrement moves slider back from 6 to 5 and restores scale
        decrement();
        expect(slider.value).toBe('5');
        expect(globalScope.scale).toBeCloseTo(initialScale, 5);

        // Lower bound clamp (0)
        slider.value = '0';
        slider.dispatchEvent(new Event('change', { bubbles: true }));
        const scaleAtZero = globalScope.scale;
        decrement();
        expect(slider.value).toBe('0');
        expect(globalScope.scale).toBe(scaleAtZero);

        // Upper bound clamp (45)
        slider.value = '45';
        slider.dispatchEvent(new Event('change', { bubbles: true }));
        const scaleAtMax = globalScope.scale;
        increment();
        expect(slider.value).toBe('45');
        expect(globalScope.scale).toBe(scaleAtMax);
    });

    test('zoomToFit syncs slider to new scale and matches centerFocus alone with no double zoom', () => {
        // Arrange: initialize simulator with viewport dimensions and zoom in so slider is at 7
        $(document).off('input change', '#customRange1');
        setup();
        window.width = 1000;
        window.height = 1000;
        const slider = document.getElementById('customRange1');
        expect(slider).not.toBeNull();
        increment();
        increment();
        expect(slider.value).toBe('7');

        // Act: run zoomToFit (Fit to Screen)
        zoomToFit();

        // Assert: slider resets to 5 (corresponding to DPR=1) and scale equals centerFocus alone
        const expectedLevel = Math.max(0, Math.min(45, Math.round(5 + (globalScope.scale - (window.DPR || 1)) * 10)));
        expect(slider.value).toBe(String(expectedLevel));
        expect(slider.value).toBe('5');
        expect(globalScope.scale).toBeCloseTo(1, 5);
    });

    test('subsequent slider drag and +/- buttons change scale smoothly with no jump after zoomToFit', () => {
        // Arrange: zoom in, then zoomToFit so slider and curLevel are synced back to 5
        $(document).off('input change', '#customRange1');
        setup();
        window.width = 1000;
        window.height = 1000;
        const slider = document.getElementById('customRange1');
        increment();
        increment();
        zoomToFit();
        expect(slider.value).toBe('5');
        const scaleAtFit = globalScope.scale;

        // Act & Assert: + button changes scale by exactly +0.1 relative to synced position
        increment();
        expect(slider.value).toBe('6');
        expect(globalScope.scale).toBeCloseTo(scaleAtFit + 0.1, 5);

        // Act & Assert: moving slider directly by 1 step changes scale by +0.1 with no jump
        slider.value = '7';
        slider.dispatchEvent(new Event('change', { bubbles: true }));
        expect(globalScope.scale).toBeCloseTo(scaleAtFit + 0.2, 5);
    });

    test('syncZoomSlider clamps knob within [0, 45] at scale bounds below 0.5 and above maximum', () => {
        // Arrange: setup simulator with slider
        $(document).off('input change', '#customRange1');
        setup();
        const slider = document.getElementById('customRange1');

        // Act & Assert: scale below 0.5 clamps knob to 0
        globalScope.scale = 0.2;
        syncZoomSlider();
        expect(slider.value).toBe('0');

        // Act & Assert: scale above 4.5 clamps knob to 45
        globalScope.scale = 6.0;
        syncZoomSlider();
        expect(slider.value).toBe('45');
    });

    test('syncZoomSlider accounts for DPR != 1 correctly', () => {
        // Arrange: setup simulator with mocked DPR = 2
        $(document).off('input change', '#customRange1');
        setup();
        const slider = document.getElementById('customRange1');
        const originalDPR = window.DPR;
        window.DPR = 2;

        try {
            // Act: scale at DPR baseline (2.0)
            globalScope.scale = 2.0;
            syncZoomSlider();
            expect(slider.value).toBe('5');

            // Act: scale at 2.3 (3 steps above baseline)
            globalScope.scale = 2.3;
            syncZoomSlider();
            expect(slider.value).toBe('8');
        } finally {
            window.DPR = originalDPR;
        }
    });

    test('zoomToFit and syncZoomSlider handle absent slider element gracefully without throwing', () => {
        // Arrange: setup and temporarily detach the slider element
        setup();
        const slider = document.getElementById('customRange1');
        const parent = slider?.parentElement;
        slider?.remove();

        try {
            // Act & Assert: neither function throws when slider is absent
            expect(() => syncZoomSlider()).not.toThrow();
            expect(() => zoomToFit()).not.toThrow();
        } finally {
            if (parent && !document.getElementById('customRange1') && slider) {
                parent.appendChild(slider);
            }
        }
    });

    test('direct centerFocus call site does not modify the slider', () => {
        // Arrange: zoom in so slider is at 6
        $(document).off('input change', '#customRange1');
        setup();
        const slider = document.getElementById('customRange1');
        increment();
        expect(slider.value).toBe('6');

        // Act: direct centerFocus call from internal callers (e.g. data/load or canvasApi)
        globalScope.centerFocus(false);

        // Assert: slider remains at 6 because fix is scoped to user zoomToFit action
        expect(slider.value).toBe('6');
    });

    test('layout mode prevents slider update during centerFocus and syncZoomSlider', () => {
        // Arrange: set slider at 10 and enable layout mode
        $(document).off('input change', '#customRange1');
        setup();
        const slider = document.getElementById('customRange1');
        slider.value = '10';
        layoutModeSet(true);

        try {
            // Act: zoomToFit while layout mode is active
            zoomToFit();

            // Assert: slider remains unchanged because layout mode returns early
            expect(slider.value).toBe('10');
        } finally {
            layoutModeSet(false);
        }
    });
});
