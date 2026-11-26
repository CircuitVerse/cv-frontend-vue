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

    test('resets title and type for a circuit with no test (#1570)', async () => {
        const wrapper = mount(TestBenchCreator, {
            global: { plugins: [pinia, i18n, vuetify] },
        });
        const store = useTestBenchStore();

        // Main has a Sequential test called "test"
        store.testbenchData.testData.title = 'test';
        store.testbenchData.testData.type = 'seq';
        store.testbenchData.testData.groups = [
            {
                label: 'Set 1',
                inputs: [{ label: 'inp1', bitWidth: 1, values: ['0'] }],
                outputs: [{ label: 'out1', bitWidth: 1, values: ['0'] }],
                n: 1,
            },
        ];
        await nextTick();
        expect(wrapper.vm.testTitle).toBe('test');
        expect(wrapper.vm.testType).toBe('seq');

        // Switch to a new circuit with no test (same shape as emptyTestbenchData())
        store.testbenchData.testData.title = '';
        store.testbenchData.testData.type = '';
        store.testbenchData.testData.groups = [
            { label: 'Group 1', inputs: [], outputs: [], n: 0 },
        ];
        await nextTick();

        expect(wrapper.vm.testTitle).toBe('Untitled');
        expect(wrapper.vm.testType).toBe('comb');
        expect(wrapper.vm.groups[0].title).toBe('Group 1');
    });

    test('empty Group 1 gets the default columns when only Group 2 has a row', async () => {
        const wrapper = mount(TestBenchCreator, {
            global: { plugins: [pinia, i18n, vuetify] },
        });
        const store = useTestBenchStore();
        const sent = vi.spyOn(store, 'sendData').mockImplementation(() => {});

        store.testbenchData.testData.groups = [
            { label: 'Group 1', inputs: [], outputs: [], n: 0 },
        ];
        await nextTick();

        wrapper.vm.addNewGroup();
        wrapper.vm.addTestToGroup(1);
        wrapper.vm.sendData();

        const { groups } = sent.mock.calls[0][0];
        expect(groups).toHaveLength(2);
        for (const group of groups) {
            expect(group.inputs.map(input => input.label)).toEqual(['inp1']);
            expect(group.outputs.map(output => output.label)).toEqual(['out1']);
        }
        expect(groups[0].inputs[0].values).toEqual([]);
        expect(groups[1].inputs[0].values).toEqual(['0']);
    });

    test('keeps saved values when only the first group is empty', async () => {
        const wrapper = mount(TestBenchCreator, {
            global: { plugins: [pinia, i18n, vuetify] },
        });
        const store = useTestBenchStore();
        const sent = vi.spyOn(store, 'sendData').mockImplementation(() => {});

        // e.g. from a CSV import: Group 1 has no columns, Group 2 has saved values
        store.testbenchData.testData.groups = [
            { label: 'Group 1', inputs: [], outputs: [], n: 0 },
            {
                label: 'Group 2',
                inputs: [{ label: 'A', bitWidth: 4, values: ['1', '0'] }],
                outputs: [{ label: 'Y', bitWidth: 2, values: ['0', '1'] }],
                n: 2,
            },
        ];
        await nextTick();

        expect(wrapper.vm.inputsName).toEqual(['A']);
        expect(wrapper.vm.outputsName).toEqual(['Y']);
        expect(wrapper.vm.inputsBandWidth).toEqual([4]);
        expect(wrapper.vm.outputsBandWidth).toEqual([2]);
        expect(wrapper.vm.groups[1].inputs).toEqual([['1', '0']]);
        expect(wrapper.vm.groups[1].outputs).toEqual([['0', '1']]);

        wrapper.vm.sendData();
        const { groups } = sent.mock.calls[0][0];
        expect(groups[1].inputs).toEqual([{ label: 'A', bitWidth: 4, values: ['1', '0'] }]);
        expect(groups[1].outputs).toEqual([{ label: 'Y', bitWidth: 2, values: ['0', '1'] }]);
    });
});
