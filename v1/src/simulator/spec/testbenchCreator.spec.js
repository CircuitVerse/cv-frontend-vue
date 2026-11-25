import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import i18n from '#/locales/i18n';
import vuetify from '#/plugins/vuetify';
import TestBenchCreator from '#/components/Panels/TestBenchPanel/TestBenchCreator.vue';
import { useTestBenchStore } from '#/store/testBenchStore';

// The v1 store pulls in simulator modules that import CodeMirror and its CSS
vi.mock('codemirror/lib/codemirror.css', () => ({}));
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

describe('TestBenchCreator', () => {
    let pinia;

    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
    });

    test('falls back to inp1/out1 when the store holds an empty test', async () => {
        const wrapper = mount(TestBenchCreator, {
            global: { plugins: [pinia, i18n, vuetify] },
        });
        const store = useTestBenchStore();

        // Same shape as emptyTestbenchData(): one group with no inputs or outputs
        store.testbenchData.testData.groups = [
            { label: 'Group 1', inputs: [], outputs: [], n: 0 },
        ];
        await nextTick();

        expect(wrapper.vm.inputsName).toEqual(['inp1']);
        expect(wrapper.vm.outputsName).toEqual(['out1']);
        expect(wrapper.vm.inputsBandWidth).toEqual([1]);
        expect(wrapper.vm.outputsBandWidth).toEqual([1]);

        wrapper.vm.addTestToGroup(0);
        expect(wrapper.vm.groups[0].inputs).toEqual([['0']]);
        expect(wrapper.vm.groups[0].outputs).toEqual([['0']]);
    });

    test('keeps the saved columns when the test has inputs and outputs', async () => {
        const wrapper = mount(TestBenchCreator, {
            global: { plugins: [pinia, i18n, vuetify] },
        });
        const store = useTestBenchStore();

        store.testbenchData.testData.groups = [
            {
                label: 'Group 1',
                inputs: [{ label: 'A', bitWidth: 4, values: ['1'] }],
                outputs: [{ label: 'Y', bitWidth: 2, values: ['3'] }],
                n: 1,
            },
        ];
        await nextTick();

        expect(wrapper.vm.inputsName).toEqual(['A']);
        expect(wrapper.vm.outputsName).toEqual(['Y']);
        expect(wrapper.vm.inputsBandWidth).toEqual([4]);
        expect(wrapper.vm.outputsBandWidth).toEqual([2]);
    });
});
