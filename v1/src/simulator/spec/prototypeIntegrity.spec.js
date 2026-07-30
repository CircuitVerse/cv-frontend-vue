/**
 * Guards the prototype-property contract that circuitElement.ts and node.ts rely on.
 *
 * `useDefineForClassFields` is enabled, so an ordinary class field declaration
 * emits an own property initialised to undefined - even when written as `foo!: T`.
 * Element modules supply objectType, alwaysResolve, rectangleObject and friends on
 * their prototypes, so declaring any of them as a field on the base class would
 * shadow every subclass value with undefined. Those members must use `declare`,
 * which emits nothing. These tests fail if that ever regresses.
 */
vi.mock('codemirror', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, fromTextArea: vi.fn(() => ({ setValue: () => {} })) };
});
vi.mock('codemirror-editor-vue3', () => ({ defineSimpleMode: vi.fn() }));

import '../src/setup';
import CircuitElement from '../src/circuitElement';
import Node from '../src/node';
import Scope from '../src/circuit';
import { simulationArea } from '../src/simulationArea';
import OrGate from '../src/modules/OrGate';
import XorGate from '../src/modules/XorGate';
import Text from '../src/modules/Text';
import VariableLed from '../src/modules/VariableLed';

describe('prototype integrity', () => {
    beforeAll(() => {
        globalThis.DPR = 1;
        globalThis.embed = false;
        globalThis.width = 800;
        globalThis.height = 600;
        // Creating an element schedules an engine update, which the shared setup
        // flushes after each test, so give it a canvas and a scope to run against.
        simulationArea.canvas = document.createElement('canvas');
        globalThis.globalScope = new Scope('prototype-integrity');
    });

    it('keeps the base class prototype defaults', () => {
        expect(CircuitElement.prototype.objectType).toBe('CircuitElement');
        expect(CircuitElement.prototype.alwaysResolve).toBe(false);
        expect(CircuitElement.prototype.rectangleObject).toBe(true);
        expect(CircuitElement.prototype.propagationDelay).toBe(10);
        expect(CircuitElement.prototype.propagationDelayFixed).toBe(false);
        expect(CircuitElement.prototype.canShowInSubcircuit).toBe(false);
        expect(CircuitElement.prototype.layoutProperties).toEqual({
            rightDimensionX: 5,
            leftDimensionX: 5,
            upDimensionY: 5,
            downDimensionY: 5,
        });
        expect(CircuitElement.prototype.subcircuitMutableProperties.label.func).toBe('setLabel');
    });

    it('keeps the Node prototype members', () => {
        expect(Node.prototype.propagationDelay).toBe(0);
        expect(Node.prototype.cleanDelete).toBe(Node.prototype.delete);
    });

    it('lets subclass prototype values win over the base class', () => {
        expect(OrGate.prototype.objectType).toBe('OrGate');
        expect(OrGate.prototype.alwaysResolve).toBe(true);
        expect(XorGate.prototype.alwaysResolve).toBe(true);
        expect(Text.prototype.propagationDelayFixed).toBe(true);
        expect(VariableLed.prototype.canShowInSubcircuit).toBe(true);
    });

    it('resolves subclass values through the prototype chain', () => {
        // Object.create avoids the constructor, so anything read here comes purely
        // from the prototype chain.
        const asOrGate = Object.create(OrGate.prototype);
        expect(asOrGate.objectType).toBe('OrGate');
        expect(asOrGate.alwaysResolve).toBe(true);
        expect(asOrGate.rectangleObject).toBe(true); // inherited from the base
        expect(asOrGate.propagationDelay).toBe(10); // inherited from the base
    });

    it('does not shadow prototype members with own properties on an instance', () => {
        const scope = new Scope('prototype-integrity');
        const gate = new OrGate(10, 20, scope, 'RIGHT', 2, 1);

        expect(gate.objectType).toBe('OrGate');
        expect(gate.alwaysResolve).toBe(true);
        expect(gate.propagationDelay).toBe(10);
        expect(gate.canShowInSubcircuit).toBe(false);

        // An own property here means a class field was emitted and shadowed the
        // prototype. rectangleObject is excluded: OrGate assigns it in its constructor.
        for (const name of [
            'objectType',
            'alwaysResolve',
            'propagationDelay',
            'propagationDelayFixed',
            'canShowInSubcircuit',
            'layoutProperties',
            'subcircuitMutableProperties',
        ]) {
            expect(Object.hasOwn(gate, name)).toBe(false);
        }
    });

    it('leaves an unconnected output as an empty parameter in generated verilog', () => {
        const scope = new Scope('verilog-slot');
        const gate = new OrGate(30, 40, scope, 'RIGHT', 2, 1);
        gate.verilogLabel = 'e0';
        gate.nodeList.forEach((node, i) => {
            node.verilogLabel = node.type === 0 ? `in${i}` : `out${i}`;
        });

        // The base implementation pushes '' for an output with no connections so the
        // port is left blank rather than given a wire.
        const generated = CircuitElement.prototype.generateVerilog.call(gate);
        expect(generated).toBe('or e0(, in0, in1);');
    });
});
