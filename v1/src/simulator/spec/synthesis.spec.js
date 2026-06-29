import { describe, test, expect } from 'vitest'
import { computeLayout, computePortLayout } from '../src/synthesis/circuitLayout.js';
import { parseYosysOutput } from '../src/synthesis/vfsGuard.js';

// Tests for the client-side Verilog synthesis module.

describe('Circuit Auto-Layout (computeLayout)', () => {

    test('returns empty object for empty circuit', () => {
        const result = computeLayout({ devices: {}, connectors: [] })
        expect(result).toEqual({})
    })

    test('returns empty object for missing devices', () => {
        const result = computeLayout({})
        expect(result).toEqual({})
    })

    test('returns empty object for null or undefined input', () => {
        expect(computeLayout(null)).toEqual({})
        expect(computeLayout(undefined)).toEqual({})
    })

    test('assigns positions to a single device', () => {
        const circuit = {
            devices: {
                dev1: { type: 'And' }
            },
            connectors: []
        }
        const positions = computeLayout(circuit)
        expect(positions).toHaveProperty('dev1')
        expect(positions.dev1).toHaveProperty('x')
        expect(positions.dev1).toHaveProperty('y')
        expect(typeof positions.dev1.x).toBe('number')
        expect(typeof positions.dev1.y).toBe('number')
    })

    test('assigns positions to all devices in a connected circuit', () => {
        // Simple: Input → AND gate → Output
        const circuit = {
            devices: {
                in1: { type: 'Input' },
                in2: { type: 'Input' },
                and1: { type: 'And' },
                out1: { type: 'Output' }
            },
            connectors: [
                { from: { id: 'in1', port: 'out' }, to: { id: 'and1', port: 'in1' } },
                { from: { id: 'in2', port: 'out' }, to: { id: 'and1', port: 'in2' } },
                { from: { id: 'and1', port: 'out' }, to: { id: 'out1', port: 'in' } }
            ]
        }
        const positions = computeLayout(circuit)

        // All 4 devices should have positions
        expect(Object.keys(positions)).toHaveLength(4)
        expect(positions).toHaveProperty('in1')
        expect(positions).toHaveProperty('in2')
        expect(positions).toHaveProperty('and1')
        expect(positions).toHaveProperty('out1')
    })

    test('places connected devices in left-to-right layer order', () => {
        // Input → AND → Output should produce x(Input) < x(AND) < x(Output)
        const circuit = {
            devices: {
                input: { type: 'Input' },
                gate: { type: 'And' },
                output: { type: 'Output' }
            },
            connectors: [
                { from: { id: 'input', port: 'out' }, to: { id: 'gate', port: 'in1' } },
                { from: { id: 'gate', port: 'out' }, to: { id: 'output', port: 'in' } }
            ]
        }
        const positions = computeLayout(circuit)

        expect(positions.input.x).toBeLessThan(positions.gate.x)
        expect(positions.gate.x).toBeLessThan(positions.output.x)
    })

    test('produces non-overlapping positions', () => {
        // 4 devices — verify no two share the same (x, y)
        const circuit = {
            devices: {
                a: { type: 'Input' },
                b: { type: 'Input' },
                c: { type: 'And' },
                d: { type: 'Output' }
            },
            connectors: [
                { from: { id: 'a', port: 'out' }, to: { id: 'c', port: 'in1' } },
                { from: { id: 'b', port: 'out' }, to: { id: 'c', port: 'in2' } },
                { from: { id: 'c', port: 'out' }, to: { id: 'd', port: 'in' } }
            ]
        }
        const positions = computeLayout(circuit)
        const coords = Object.values(positions)

        // No two devices should have the exact same position
        for (let i = 0; i < coords.length; i++) {
            for (let j = i + 1; j < coords.length; j++) {
                const samePos = coords[i].x === coords[j].x && coords[i].y === coords[j].y
                expect(samePos).toBe(false)
            }
        }
    })

    test('handles disconnected devices without crashing', () => {
        const circuit = {
            devices: {
                a: { type: 'Input' },
                b: { type: 'Output' }
            },
            connectors: [] // No connections
        }
        const positions = computeLayout(circuit)
        expect(Object.keys(positions)).toHaveLength(2)
        expect(positions).toHaveProperty('a')
        expect(positions).toHaveProperty('b')
    })

    test('handles unknown device types with default sizing', () => {
        const circuit = {
            devices: {
                custom1: { type: 'SomeCustomGate' },
                custom2: { type: 'AnotherGate' }
            },
            connectors: [
                { from: { id: 'custom1', port: 'out' }, to: { id: 'custom2', port: 'in' } }
            ]
        }
        // Should not throw — uses DEFAULT_SIZE fallback
        const positions = computeLayout(circuit)
        expect(Object.keys(positions)).toHaveLength(2)
    })
})

describe('Verilog Port Layout (computePortLayout)', () => {
    test('places two inputs on the left and centers one output on the right', () => {
        const portLayout = computePortLayout(2, 1);

        expect(portLayout.layout).toMatchObject({
            width: 120,
            height: 70,
            title_x: 60,
            title_y: 13,
            titleEnabled: true,
        });
        expect(portLayout.inputs).toEqual([
            { x: 0, y: 30 },
            { x: 0, y: 50 },
        ]);
        expect(portLayout.outputs).toEqual([
            { x: 120, y: 40 },
        ]);
    });

    test('keeps layout valid for modules without ports', () => {
        const portLayout = computePortLayout(0, 0);

        expect(portLayout.layout.height).toBe(50);
        expect(portLayout.inputs).toEqual([]);
        expect(portLayout.outputs).toEqual([]);
    });

    test('centers the smaller port side for uneven module interfaces', () => {
        const portLayout = computePortLayout(1, 3);

        expect(portLayout.layout.height).toBe(90);
        expect(portLayout.inputs).toEqual([
            { x: 0, y: 50 },
        ]);
        expect(portLayout.outputs).toEqual([
            { x: 120, y: 30 },
            { x: 120, y: 50 },
            { x: 120, y: 70 },
        ]);
    });
});

// VFS guard tests for output.json

describe('VFS Guard (parseYosysOutput)', () => {
    test('parses output.json when it is a string', () => {
        var result = parseYosysOutput({ 'output.json': '{"modules":{}}' })
        expect(result).toEqual({ modules: {} })
    })

    test('parses output.json when it is a Uint8Array', () => {
        var json = '{"modules":{}}'
        var bytes = new TextEncoder().encode(json)
        var result = parseYosysOutput({ 'output.json': bytes })
        expect(result).toEqual({ modules: {} })
    })

    test('throws when VFS result is null or undefined', () => {
        expect(() => parseYosysOutput(null)).toThrow('valid virtual filesystem')
        expect(() => parseYosysOutput(undefined)).toThrow('valid virtual filesystem')
    })

    test('throws when output.json is missing', () => {
        expect(() => parseYosysOutput({})).toThrow('did not produce output.json')
    })

    test('throws when output.json is empty', () => {
        expect(() => parseYosysOutput({ 'output.json': '' })).toThrow('empty output.json')
        expect(() => parseYosysOutput({ 'output.json': '   ' })).toThrow('empty output.json')
    })

    test('throws when output.json has unsupported type', () => {
        expect(() => parseYosysOutput({ 'output.json': 42 })).toThrow('unsupported type')
        expect(() => parseYosysOutput({ 'output.json': true })).toThrow('unsupported type')
    })

    test('throws when output.json contains invalid JSON', () => {
        expect(() => parseYosysOutput({ 'output.json': '{broken' })).toThrow('invalid JSON')
    })

    test('throws when output.json is valid JSON but not an object', () => {
        expect(() => parseYosysOutput({ 'output.json': 'null' })).toThrow('not a netlist object')
        expect(() => parseYosysOutput({ 'output.json': '42' })).toThrow('not a netlist object')
        expect(() => parseYosysOutput({ 'output.json': '"oops"' })).toThrow('not a netlist object')
    })
})
