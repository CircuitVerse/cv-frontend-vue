import { describe, test, expect, beforeAll } from 'vitest';
import { runYosys } from '@yowasp/yosys';
import { yosys2digitaljs } from 'yosys2digitaljs/core';
import { parseYosysOutput } from '../src/synthesis/vfsGuard.js';

import andGateRef from './fixtures/andGate.json';
import dFlipFlopRef from './fixtures/dFlipFlop.json';
import fullAdderRef from './fixtures/fullAdder.json';
import counter4bitRef from './fixtures/counter4bit.json';
import mux2to1Ref from './fixtures/mux2to1.json';

// Same pipeline as synthesisWorker.js
var YOSYS_CMDS = 'read_verilog input.v; setattr -mod -unset top; hierarchy -auto-top; proc; opt; memory -nomap; wreduce -memx; opt -full; write_json output.json';

// All device types that YosysJSON2CV can consume (from VerilogClasses.js yosysTypeMap)
var KNOWN_DEVICE_TYPES = [
    'Not', 'Repeater', 'And', 'Nand', 'Or', 'Nor', 'Xor', 'Xnor',
    'Constant', 'Input', 'Output',
    'AndReduce', 'NandReduce', 'OrReduce', 'NorReduce', 'XorReduce', 'XnorReduce',
    'Eq', 'Ne', 'Lt', 'Le', 'Ge', 'Gt',
    'ZeroExtend', 'Negation',
    'Dff', 'Mux', 'Mux1Hot', 'BusSlice', 'BusGroup', 'BusUngroup',
    'Addition', 'Subtraction', 'Multiplication', 'Division', 'Modulo', 'Power',
    'ShiftLeft', 'ShiftRight',
    'Clock', 'Lamp', 'Button', 'Memory',
    'Subcircuit',
];

var noop = () => {};

// Verilog sources must match what was used to generate the fixture JSONs
var CIRCUITS = {
    andGate: [
        'module and_gate(input a, input b, output y);',
        '    assign y = a & b;',
        'endmodule',
    ].join('\n'),

    dFlipFlop: [
        'module dff(input clk, input d, output reg q);',
        '    always @(posedge clk) q <= d;',
        'endmodule',
    ].join('\n'),

    fullAdder: [
        'module full_adder(input a, input b, input cin, output sum, output cout);',
        '    assign {cout, sum} = a + b + cin;',
        'endmodule',
    ].join('\n'),

    counter4bit: [
        'module counter(input clk, input rst, output reg [3:0] count);',
        '    always @(posedge clk)',
        "        if (rst) count <= 4'b0;",
        '        else count <= count + 1;',
        'endmodule',
    ].join('\n'),

    mux2to1: [
        'module mux2to1(input a, input b, input sel, output y);',
        '    assign y = sel ? b : a;',
        'endmodule',
    ].join('\n'),
};

async function synthesize(code) {
    var vfs = await runYosys(
        ['-p', YOSYS_CMDS],
        { 'input.v': code },
        { print: noop, printErr: noop }
    );
    var netlist = parseYosysOutput(vfs);
    return yosys2digitaljs(netlist);
}

function assertDeviceTypesKnown(circuit) {
    for (var id of Object.keys(circuit.devices)) {
        expect(KNOWN_DEVICE_TYPES).toContain(circuit.devices[id].type);
    }
}

describe('Synthesis Parity Tests', () => {

    beforeAll(async () => {
        await runYosys([], {}, { print: noop, printErr: noop });
    }, 60000);

    test('AND gate', async () => {
        var circuit = await synthesize(CIRCUITS.andGate);
        expect(circuit).toMatchObject(andGateRef);
        assertDeviceTypesKnown(circuit);
    }, 30000);

    test('D flip-flop', async () => {
        var circuit = await synthesize(CIRCUITS.dFlipFlop);
        expect(circuit).toMatchObject(dFlipFlopRef);
        assertDeviceTypesKnown(circuit);
    }, 30000);

    test('full adder', async () => {
        var circuit = await synthesize(CIRCUITS.fullAdder);
        expect(circuit).toMatchObject(fullAdderRef);
        assertDeviceTypesKnown(circuit);
    }, 30000);

    test('4-bit counter', async () => {
        var circuit = await synthesize(CIRCUITS.counter4bit);
        expect(circuit).toMatchObject(counter4bitRef);
        assertDeviceTypesKnown(circuit);
    }, 30000);

    test('2:1 mux', async () => {
        var circuit = await synthesize(CIRCUITS.mux2to1);
        expect(circuit).toMatchObject(mux2to1Ref);
        assertDeviceTypesKnown(circuit);
    }, 30000);
});