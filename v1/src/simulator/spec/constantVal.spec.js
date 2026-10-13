// Load the simulator entry point before its mutually dependent element modules.
import '../src/setup';
import { createPinia, setActivePinia } from 'pinia';
import Scope from '../src/circuit';
import ConstantVal from '../src/modules/ConstantVal';
import * as engine from '../src/engine';

vi.mock('codemirror-editor-vue3', () => ({ defineSimpleMode: vi.fn() }));

describe('ConstantVal editing', () => {
    let constant;

    beforeEach(() => {
        setActivePinia(createPinia());
        // These element tests do not mount a canvas or run the rendering loop.
        vi.spyOn(engine, 'scheduleUpdate').mockImplementation(() => {});
        constant = new ConstantVal(0, 0, new Scope('Constant'), 'RIGHT', 4, '1010');
    });
    afterEach(() => vi.restoreAllMocks());

    test('cancelling the value prompt preserves the value and bit width', () => {
        vi.spyOn(window, 'prompt').mockReturnValue(null);
        constant.dblclick();
        constant.resolve();
        expect(constant.state).toBe('1010');
        expect(constant.bitWidth).toBe(4);
        expect(constant.output1.bitWidth).toBe(4);
        expect(constant.output1.x).toBe(40);
        expect(constant.output1.value).toBe(10);
    });

    test('confirming a new value updates the value and bit width', () => {
        vi.spyOn(window, 'prompt').mockReturnValue('11');
        constant.dblclick();
        constant.resolve();
        expect(constant.state).toBe('11');
        expect(constant.bitWidth).toBe(2);
        expect(constant.output1.bitWidth).toBe(2);
        expect(constant.output1.value).toBe(3);
    });

    test('confirming an empty value keeps the existing zero fallback', () => {
        vi.spyOn(window, 'prompt').mockReturnValue('');
        constant.dblclick();
        constant.resolve();
        expect(constant.state).toBe('0');
        expect(constant.bitWidth).toBe(1);
        expect(constant.output1.value).toBe(0);
    });
});
