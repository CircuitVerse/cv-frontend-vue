## Circuit2Verilog Module

**Primary Contributors:**

1. James H - J Yeh, Ph.D.
2. Satvik Ramaprasad

**Source files:** `src/simulator/src/Verilog2CV.js` (Verilog to circuit synthesis) and `src/simulator/src/verilog.js` (circuit to structural Verilog netlist generation). Both files are `.js` only; there are no `.ts` counterparts.

## Introduction

This module generates a structural Verilog netlist given a CircuitVerse circuit graph. It generates functional structural Verilog code for basic combinational circuits and basic subcircuit hierarchies. However, exports may require manual adjustments: input or node labels conflicting with Verilog reserved keywords (such as `module`) are not automatically escaped and produce invalid Verilog syntax, and circuits with unconnected optional ports will generate warnings in the output. Support for sequential elements, complex subcircuits, and custom behavioral constructs remains experimental and may require manual adjustments to the exported netlist.

## Algorithm

The basic algorithm is fairly straightforward. We have the circuit graph in
memory. We just need to convert this graph into Verilog netlist. It is done by
performing a DFS on the circuit graph. The DFS involves the following steps

1. Creating Verilog wires as and when required
2. Connecting Verilog wires in element instantiations

## Some background information

The different sub-circuits form a DAG (Directed Acyclic Graph) or dependency
graph. Each sub-circuit itself (called scope internally) is actually a (cyclic)
graph on its own. Therefore the Verilog generation is done in a 2 step DFS
approach. The first DFS is performed on the dependency graph. The second DFS is
done on an individual sub-circuit (scope).

## Code/Algorithm workflow

1. `exportVerilog()` - entry point
2. `exportVerilogScope()` - DFS(1) on Sub Circuits Dependency Graph
    1. Set Verilog Labels for all elements
    2. `generateHeader()` - Generates Module Header
    3. `generateOutputList()` - Generates Output List
    4. `generateInputList()` - Generates Input List
    5. `processGraph()` - DFS(2) on individual subcircuit/scope
        1. DFS starts from inputs
        2. Calls `processVerilog()` on all circuit elements (graph nodes) - resolves label names and adds neighbors to DFS stack.
        3. Calls `generateVerilog()` on all circuit elements to get the final Verilog.
    6. Generate Wire initializations

## Functions

**Verilog Module Functions:**

1. `verilog.exportVerilog()` - Entry point
2. `verilog.exportVerilogScope()` - Recursive DFS function on subcircuit graph
3. `verilog.processGraph()` - Iterative DFS function on subcircuit scope
4. `verilog.resetLabels()` - Resets labels in scope
5. `verilog.setLabels()` - Sets labels in scope
6. `verilog.generateHeader()` - Generates Verilog Module Header
7. `verilog.generateInputList()` - Generates Verilog Module Input List
8. `verilog.generateOutputList()` - Generates Verilog Module Output List
9. `sanitizeLabel()` - Sanitizes label for node/wire
10. `generateNodeName()` - Helper function to resolve node/wire name

**CircuitElement Functions:**

These functions can be overridden by derived classes.

1. `CircuitElement.prototype.processVerilog()` - Graph algorithm to resolve Verilog wire labels
2. `CircuitElement.prototype.verilogName()` - Generate Verilog name
3. `CircuitElement.prototype.generateVerilog()` - Generate final Verilog code
4. `CircuitElement.prototype.verilogType` - Verilog type name
5. `CircuitElement.moduleVerilog` - Custom module Verilog for elements
