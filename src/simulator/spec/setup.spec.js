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
import * as layoutMode from '../src/layoutMode';
import { simulationArea } from '../src/simulationArea';
import * as engine from '../src/engine';

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

        // Upper bound clamp (35 at DPR 1)
        slider.value = '35';
        slider.dispatchEvent(new Event('change', { bubbles: true }));
        const scaleAtMax = globalScope.scale;
        increment();
        expect(slider.value).toBe('35');
        expect(globalScope.scale).toBe(scaleAtMax);
    });

    test('increment and decrement keep curLevel in sync so subsequent slider drag does not jump', () => {
        // Guards against slider drift: ensures button clicks update curLevel so next manual drag has no scale jump
        $(document).off('input change', '#customRange1');
        setup();
        const slider = document.getElementById('customRange1');

        // Click increment 3 times (5 -> 8)
        increment();
        increment();
        increment();
        expect(slider.value).toBe('8');
        const scaleAtEight = globalScope.scale;

        // Drag slider by exactly 1 step from 8 to 9
        slider.value = '9';
        slider.dispatchEvent(new Event('change', { bubbles: true }));

        // Assert scale changed by exactly 0.1 relative to level 8, not jumping from initial 5
        expect(globalScope.scale).toBeCloseTo(scaleAtEight + 0.1, 5);
    });

    test('increment and decrement fall back cleanly to ZoomIn and ZoomOut when slider is absent', () => {
        // Guards fallback path: ensures absence of #customRange1 falls back to ZoomIn/ZoomOut without throwing
        global.DPR = 1;
        window.DPR = 1;
        setup();
        simulationArea.mouseX = 100;
        simulationArea.mouseY = 100;
        const sliders = Array.from(document.querySelectorAll('#customRange1'));
        const parents = sliders.map((s) => ({ slider: s, parent: s.parentElement }));
        sliders.forEach((s) => s.remove());

        try {
            const initialScale = globalScope.scale;
            expect(() => increment()).not.toThrow();
            expect(globalScope.scale).toBeCloseTo(initialScale + 0.1, 5);

            expect(() => decrement()).not.toThrow();
            expect(globalScope.scale).toBeCloseTo(initialScale, 5);

            expect(() => {
                const simArea = document.getElementById('simulationArea');
                simArea?.dispatchEvent(new Event('mousewheel'));
            }).not.toThrow();
        } finally {
            parents.forEach(({ slider, parent }) => {
                if (parent && slider && !document.body.contains(slider)) {
                    parent.appendChild(slider);
                }
            });
        }
    });

    test('increment and decrement dispatch change event with bubbles true to reach delegated listener', () => {
        // Guards event bubbling: verifies change event bubbles up to $(document) delegated listener
        $(document).off('input change', '#customRange1');
        setup();
        const slider = document.getElementById('customRange1');
        let capturedEvent = null;

        const originalDispatch = slider.dispatchEvent.bind(slider);
        slider.dispatchEvent = vi.fn((event) => {
            capturedEvent = event;
            return originalDispatch(event);
        });

        try {
            increment();
            expect(capturedEvent).not.toBeNull();
            expect(capturedEvent.type).toBe('change');
            expect(capturedEvent.bubbles).toBe(true);
        } finally {
            slider.dispatchEvent = originalDispatch;
        }
    });

    test('repeated increment and decrement calls are symmetric across multiple steps', () => {
        // Guards zoom symmetry: verifies 4 increments followed by 4 decrements restores initial scale precisely
        $(document).off('input change', '#customRange1');
        setup();
        const slider = document.getElementById('customRange1');
        const initialScale = globalScope.scale;

        increment();
        increment();
        increment();
        increment();
        expect(slider.value).toBe('9');
        expect(globalScope.scale).toBeCloseTo(initialScale + 0.4, 5);

        decrement();
        decrement();
        decrement();
        decrement();
        expect(slider.value).toBe('5');
        expect(globalScope.scale).toBeCloseTo(initialScale, 5);
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

        // Assert: slider resets to 5 (corresponding to scale=1.0) and scale equals centerFocus alone
        const expectedLevel = Math.max(0, Math.min(35, Math.round((globalScope.scale - 0.5) * 10)));
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

    test('syncZoomSlider clamps knob within [0, maxLevel] at scale bounds below 0.5 and above maximum', () => {
        // Arrange: setup simulator with slider
        $(document).off('input change', '#customRange1');
        setup();
        const slider = document.getElementById('customRange1');

        // Act & Assert: scale below 0.5 clamps knob to 0
        globalScope.scale = 0.2;
        syncZoomSlider();
        expect(slider.value).toBe('0');

        // Act & Assert: scale above 4.0 (DPR=1) clamps knob to 35
        globalScope.scale = 6.0;
        syncZoomSlider();
        expect(slider.max).toBe('35');
        expect(slider.value).toBe('35');
    });

    test('syncZoomSlider accounts for DPR != 1 correctly', () => {
        // Arrange: setup simulator with mocked DPR = 2
        $(document).off('input change', '#customRange1');
        setup();
        const slider = document.getElementById('customRange1');
        const originalDPR = window.DPR;
        window.DPR = 2;

        try {
            // Act: scale at DPR baseline (2.0) maps to level 15 with max 75
            globalScope.scale = 2.0;
            syncZoomSlider();
            expect(slider.max).toBe('75');
            expect(slider.value).toBe('15');

            // Act: scale at 2.3 (3 steps above baseline)
            globalScope.scale = 2.3;
            syncZoomSlider();
            expect(slider.value).toBe('18');
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
            // Act: zoomToFit and syncZoomSlider while layout mode is active
            zoomToFit();
            expect(slider.value).toBe('10');

            syncZoomSlider();

            // Assert: slider remains unchanged because layout mode returns early
            expect(slider.value).toBe('10');
        } finally {
            layoutModeSet(false);
        }
    });

    test('zoomSliderScroll updates curLevel at endpoints 0 and 45 so subsequent button click zooms', () => {
        // Guards endpoint wheel sync: ensures curLevel updates at 0 and 45 so next + or - click applies nonzero delta
        $(document).off('input change', '#customRange1');
        setup();
        const slider = document.getElementById('customRange1');
        const simArea = document.getElementById('simulationArea');

        // Wheel down from level 1 to lower endpoint 0
        slider.value = '1';
        slider.dispatchEvent(new Event('change', { bubbles: true }));
        const wheelDown = new Event('mousewheel');
        wheelDown.wheelDelta = -120;
        simArea.dispatchEvent(wheelDown);
        expect(slider.value).toBe('0');
        const scaleAfterWheelDown = globalScope.scale;

        // Next increment must advance from 0 to 1 and increase scale by +0.1 relative to post-wheel scale
        increment();
        expect(slider.value).toBe('1');
        expect(globalScope.scale).toBeCloseTo(scaleAfterWheelDown + 0.1, 5);

        // Wheel up at upper endpoint (35 at DPR 1)
        slider.value = '35';
        slider.dispatchEvent(new Event('change', { bubbles: true }));
        const wheelUp = new Event('mousewheel');
        wheelUp.wheelDelta = 120;
        simArea.dispatchEvent(wheelUp);
        expect(slider.value).toBe('35');
        const scaleAfterWheelUp = globalScope.scale;

        // Next decrement must step from 35 to 34 and update scale by -0.1 (within 4*DPR clamp)
        decrement();
        expect(slider.value).toBe('34');
        expect(globalScope.scale).toBeCloseTo(Math.min(4 * (window.DPR || 1), scaleAfterWheelUp - 0.1), 5);
    });

    test('increment and decrement schedule a canvas redraw via delegated change handler', () => {
        // Guards redraw scheduling: ensures delegated slider change calls scheduleUpdate when clock is paused
        $(document).off('input change', '#customRange1');
        setup();
        const slider = document.getElementById('customRange1');
        const scheduleSpy = vi.spyOn(engine, 'scheduleUpdate');

        try {
            increment();
            expect(slider.value).toBe('6');
            expect(scheduleSpy).toHaveBeenCalledTimes(1);

            decrement();
            expect(slider.value).toBe('5');
            expect(scheduleSpy).toHaveBeenCalledTimes(2);

            // Directly exercise the delegated #customRange1 change handler
            slider.value = '7';
            slider.dispatchEvent(new Event('change', { bubbles: true }));
            expect(scheduleSpy).toHaveBeenCalledTimes(3);
        } finally {
            scheduleSpy.mockRestore();
        }
    });

    test('increment and decrement reach full canvas limits [0.5, 4 * DPR] at DPR = 2 while keeping slider in sync', () => {
        // Guards DPR=2 range: ensures +/- buttons and slider reach 0.5 and 8.0 instead of stopping at 1.5 and 6.0
        $(document).off('input change', '#customRange1');
        const originalDevicePixelRatio = window.devicePixelRatio;
        const originalDPR = window.DPR;
        Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 2 });

        try {
            setup();
            globalScope.scale = 2.0;
            syncZoomSlider();
            const slider = document.getElementById('customRange1');
            expect(slider.max).toBe('75');
            expect(slider.value).toBe('15');
            expect(globalScope.scale).toBeCloseTo(2.0, 5);

            // Decrement 15 times from 2.0 down to canvas minimum 0.5 (level 0)
            for (let i = 0; i < 15; i++) {
                decrement();
            }
            expect(slider.value).toBe('0');
            expect(globalScope.scale).toBeCloseTo(0.5, 5);

            // Extra decrement stays clamped at 0.5
            decrement();
            expect(slider.value).toBe('0');
            expect(globalScope.scale).toBeCloseTo(0.5, 5);

            // Increment 75 times from 0.5 up to canvas maximum 8.0 (level 75)
            for (let i = 0; i < 75; i++) {
                increment();
            }
            expect(slider.value).toBe('75');
            expect(globalScope.scale).toBeCloseTo(8.0, 5);

            // Extra increment stays clamped at 8.0
            increment();
            expect(slider.value).toBe('75');
            expect(globalScope.scale).toBeCloseTo(8.0, 5);

            // Slider drag after button zoom steps smoothly by -0.1
            slider.value = '74';
            slider.dispatchEvent(new Event('change', { bubbles: true }));
            expect(globalScope.scale).toBeCloseTo(7.9, 5);
        } finally {
            Object.defineProperty(window, 'devicePixelRatio', {
                configurable: true,
                value: originalDevicePixelRatio,
            });
            window.DPR = originalDPR;
        }
    });

    test('wheel zoom at DPR = 2 derives slider level from canvas scale without drift', () => {
        // Guards wheel sync at DPR=2: MouseScroll steps by 0.2 so slider must step by 2 levels, not 1
        $(document).off('input change', '#customRange1');
        const originalDevicePixelRatio = window.devicePixelRatio;
        const originalDPR = window.DPR;
        Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 2 });

        try {
            const staleSimArea = document.getElementById('simulationArea');
            if (staleSimArea?.parentNode) {
                staleSimArea.parentNode.replaceChild(staleSimArea.cloneNode(true), staleSimArea);
            }
            setup();
            globalScope.scale = 2.0;
            syncZoomSlider();
            const slider = document.getElementById('customRange1');
            const simArea = document.getElementById('simulationArea');
            expect(slider.value).toBe('15');

            const wheelUp = new Event('mousewheel');
            wheelUp.wheelDelta = 120;
            simArea.dispatchEvent(wheelUp);

            expect(globalScope.scale).toBeCloseTo(2.2, 5);
            expect(slider.value).toBe('17');
        } finally {
            Object.defineProperty(window, 'devicePixelRatio', {
                configurable: true,
                value: originalDevicePixelRatio,
            });
            window.DPR = originalDPR;
        }
    });

    test('reconciles slider after clamped increment from sub-minimum fitted scale 0.2', () => {
        // Guards clamped step reconciliation: first increment from 0.2 clamps to 0.5 (level 0) so 35 steps reach 4.0
        $(document).off('input change', '#customRange1');
        setup();
        const slider = document.getElementById('customRange1');
        globalScope.scale = 0.2;
        syncZoomSlider();
        expect(slider.value).toBe('0');

        increment();
        expect(globalScope.scale).toBeCloseTo(0.5, 5);
        expect(slider.value).toBe('0');

        for (let i = 0; i < 35; i++) {
            increment();
        }
        expect(slider.value).toBe('35');
        expect(globalScope.scale).toBeCloseTo(4.0, 5);
    });

    test('wheel zoom in layout mode keeps slider synced so + button still steps from 3.9 to 4.0', () => {
        // Guards layout-mode wheel zoom: slider must track wheel down from max so + is not blocked at 3.9
        $(document).off('input change', '#customRange1');
        const staleSimArea = document.getElementById('simulationArea');
        if (staleSimArea?.parentNode) {
            staleSimArea.parentNode.replaceChild(staleSimArea.cloneNode(true), staleSimArea);
        }
        setup();
        const slider = document.getElementById('customRange1');
        const simArea = document.getElementById('simulationArea');
        globalScope.scale = 4.0;
        syncZoomSlider();
        expect(slider.value).toBe('35');

        const layoutUpdateSpy = vi.spyOn(layoutMode, 'layoutUpdate').mockImplementation(() => {});
        layoutModeSet(true);
        try {
            const wheelDown = new Event('mousewheel');
            wheelDown.wheelDelta = -120;
            simArea.dispatchEvent(wheelDown);

            expect(globalScope.scale).toBeCloseTo(3.9, 5);
            expect(slider.value).toBe('34');

            increment();
            expect(globalScope.scale).toBeCloseTo(4.0, 5);
            expect(slider.value).toBe('35');
        } finally {
            layoutModeSet(false);
            layoutUpdateSpy.mockRestore();
        }
    });

    test('increment and decrement after centerFocus scale around viewport centre, ignoring stale mouse position', () => {
        // Guards viewport-centre zoom anchor (method 3): stale mouseX/mouseY must not shift ox/oy
        $(document).off('input change', '#customRange1');
        setup();
        window.width = 1000;
        window.height = 1000;
        globalScope.centerFocus(false);
        syncZoomSlider();

        const oxBefore = globalScope.ox;
        const oyBefore = globalScope.oy;
        const scaleBefore = globalScope.scale;
        const expectedCenterX = (window.width / 2 - oxBefore) / scaleBefore;
        const expectedCenterY = (window.height / 2 - oyBefore) / scaleBefore;

        // Set extreme stale mouse coordinates
        simulationArea.mouseX = 9999;
        simulationArea.mouseY = 9999;

        increment();
        const scaleAfterInc = globalScope.scale;
        expect(globalScope.ox).toBe(oxBefore - Math.round(expectedCenterX * (scaleAfterInc - scaleBefore)));
        expect(globalScope.oy).toBe(oyBefore - Math.round(expectedCenterY * (scaleAfterInc - scaleBefore)));

        decrement();
        expect(globalScope.scale).toBeCloseTo(scaleBefore, 5);
        expect(globalScope.ox).toBeCloseTo(oxBefore, 0);
        expect(globalScope.oy).toBeCloseTo(oyBefore, 0);
    });

    test('syncZoomSlider and zoomSliderListeners use DPR 1 in lightMode even when window.DPR is 2', () => {
        // Guards lightMode DPR baseline in v0: slider max must be 35 (not 75) when lightMode forces canvas DPR to 1
        $(document).off('input change', '#customRange1');
        const originalDPR = window.DPR;
        const originalLightMode = window.lightMode;
        window.DPR = 2;
        window.lightMode = true;

        try {
            setup();
            const slider = document.getElementById('customRange1');
            expect(slider.max).toBe('35');
            expect(slider.value).toBe('5');

            globalScope.scale = 4.0;
            syncZoomSlider();
            expect(slider.max).toBe('35');
            expect(slider.value).toBe('35');
        } finally {
            window.DPR = originalDPR;
            window.lightMode = originalLightMode;
        }
    });

    test('increment and decrement complete final step from fractional scales 3.96 and 0.54', () => {
        // Guards rounded endpoint scales: 3.96 (level 35) still reaches 4.0, and 0.54 (level 0) still reaches 0.5
        $(document).off('input change', '#customRange1');
        setup();
        const slider = document.getElementById('customRange1');

        globalScope.scale = 3.96;
        syncZoomSlider();
        expect(slider.value).toBe('35');
        increment();
        expect(globalScope.scale).toBeCloseTo(4.0, 5);
        expect(slider.value).toBe('35');

        globalScope.scale = 0.54;
        syncZoomSlider();
        expect(slider.value).toBe('0');
        decrement();
        expect(globalScope.scale).toBeCloseTo(0.5, 5);
        expect(slider.value).toBe('0');
    });
});
