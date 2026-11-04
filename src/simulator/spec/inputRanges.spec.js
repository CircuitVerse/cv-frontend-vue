// Load the simulator entry point before its mutually dependent element modules.
import '../src/setup';
import { createPinia, setActivePinia } from 'pinia';
import Scope from '../src/circuit';
import Counter from '../src/modules/Counter';
import Random from '../src/modules/Random';
import * as engine from '../src/engine';

vi.mock('codemirror-editor-vue3', () => ({ defineSimpleMode: vi.fn() }));

describe('Counter and Random input ranges', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        // These element tests do not mount a canvas or run the rendering loop.
        vi.spyOn(engine, 'scheduleUpdate').mockImplementation(() => {});
    });
    afterEach(() => vi.restoreAllMocks());

    test.each([1, 8, 30, 31, 32])('a %i-bit counter reaches its maximum and wraps to zero', (bitWidth) => {
        const counter = new Counter(0, 0, new Scope('Counter'), bitWidth);
        const maximum = 2 ** bitWidth - 1;
        counter.value = maximum - 1;
        counter.prevClockState = 0;
        counter.clock.value = 1;
        counter.resolve();
        expect(counter.output.value).toBe(maximum);
        expect(counter.zero.value).toBe(0);

        counter.clock.value = 0;
        counter.resolve();
        expect(counter.output.value).toBe(maximum);
        counter.clock.value = 1;
        counter.resolve();
        expect(counter.output.value).toBe(0);
        expect(counter.zero.value).toBe(1);
    });

    test.each([0, 3])('a counter respects an explicit maximum of %i', (maximum) => {
        const counter = new Counter(0, 0, new Scope('Counter'), 32);
        counter.maxValue.value = maximum;
        counter.value = maximum;
        counter.prevClockState = 0;
        counter.clock.value = 1;
        counter.resolve();
        expect(counter.output.value).toBe(0);
    });

    test('reset clears a 32-bit counter', () => {
        const counter = new Counter(0, 0, new Scope('Counter'), 32);
        counter.value = 123;
        counter.reset.value = 1;
        counter.resolve();
        expect(counter.output.value).toBe(0);
    });

    test.each([1, 8, 30, 31, 32])('a %i-bit random source uses its full unsigned range', (bitWidth) => {
        const source = new Random(0, 0, new Scope('Random'), 'RIGHT', bitWidth);
        const random = vi.spyOn(Math, 'random').mockReturnValue(0.75);
        source.clockInp.value = 1;
        source.resolve();
        expect(source.output.value).toBe(Math.floor(0.75 * 2 ** bitWidth));

        source.resolve();
        source.clockInp.value = 0;
        source.resolve();
        expect(random).toHaveBeenCalledTimes(1);

        random.mockReturnValue(1 - Number.EPSILON);
        source.clockInp.value = 1;
        source.resolve();
        expect(source.output.value).toBe(2 ** bitWidth - 1);
    });

    test.each([0, 3])('a random source respects a connected maximum of %i', (maximum) => {
        const source = new Random(0, 0, new Scope('Random'), 'RIGHT', 32);
        source.maxValue.connections.push({});
        source.maxValue.value = maximum;
        vi.spyOn(Math, 'random').mockReturnValue(1 - Number.EPSILON);
        source.clockInp.value = 1;
        source.resolve();
        expect(source.output.value).toBe(maximum);
    });
});
