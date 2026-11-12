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
});
