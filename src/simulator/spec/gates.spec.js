/**
 * @jest-environment jsdom
 */

import CodeMirror from 'codemirror';
import {setup} from '../src/setup';

import {load} from '../src/data/load';
import circuitData from './circuits/gates-circuitdata.json';
import testData from './testData/gates-testdata.json';
import {runAll} from '../src/testbench';
import {describe, it, expect, vi} from 'vitest';

vi.mock('codemirror');

describe('Simulator Gates Testing', () => {
  CodeMirror.fromTextArea.mockReturnValueOnce({setValue: (text) => {}});
  setup();

  it('load circuitData', () => {
    expect(() => load(circuitData)).not.toThrow();
  });

  it('AND gate testing', () => {
    const result = runAll(testData.AndGate);
    expect(result.summary.passed).toBe(4);
  });

  it('NAND gate testing', () => {
    const result = runAll(testData.nandGate);
    expect(result.summary.passed).toBe(4);
  });

  it('NOR gate testing', () => {
    const result = runAll(testData.norGate);
    expect(result.summary.passed).toBe(4);
  });

  it('NOT gate testing', () => {
    const result = runAll(testData.notGate);
    expect(result.summary.passed).toBe(2);
  });

  it('OR gate testing', () => {
    const result = runAll(testData.OrGate);
    expect(result.summary.passed).toBe(4);
  });

  it('XNOR gate testing', () => {
    const result = runAll(testData.xnorGate);
    expect(result.summary.passed).toBe(4);
  });

  it('XOR gate testing', () => {
    const result = runAll(testData.xorGate);
    expect(result.summary.passed).toBe(4);
  });
});
