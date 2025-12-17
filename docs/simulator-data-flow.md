# Understanding CircuitVerse Simulator Data Flow (Frontend)

## Overview

This document explains how circuits are represented, stored, and loaded in the
CircuitVerse v0 simulator frontend. It is intended to help new contributors
understand the simulator beyond the UI layer, especially when working with
programmatic circuit construction or automated tools.

The focus is on how the simulator works internally, not on UI components or
user-facing features.

---

## Vue Store vs Simulator State

The Pinia `simulatorStore` is responsible for UI-related state only, such as:

- Dialog visibility
- Open circuit tabs
- Success and error messages
- UI flags and preferences

The simulator store does **not** contain circuit graph data.

Circuit elements, signal nodes, and wires are **not stored in the Vue/Pinia
state tree**. Attempting to read or modify the circuit via the store will not
affect simulation behavior.

---

## Where Circuit Data Actually Lives

Circuit data lives in simulator/engine globals that are independent of the UI
layer:

- **`globalScope`**  
  Represents the currently active circuit.

- **`scopeList`**  
  Stores all scopes, including subcircuits.

Each scope contains:
- Circuit elements (inputs, outputs, gates, etc.)
- Signal nodes
- Wire objects

These objects are created directly using simulator constructors and are consumed
by the simulation engine.

---

## How Circuits Are Loaded from JSON

At a high level, circuit loading follows this flow:

JSON → load() → loadScope()


During this process:

1. Circuit elements (inputs, outputs, gates) are instantiated
2. Signal nodes are created for each element pin
3. Nodes are connected
4. Wire objects are instantiated between connected nodes

Once this setup is complete, the simulation engine handles signal propagation
automatically.

---

## Important Invariant: Nodes vs Wires

A critical and non-obvious invariant in the CircuitVerse simulator is:

**Wires alone are not sufficient for signal propagation.**

Signals propagate only when the corresponding signal nodes are explicitly
connected.

Creating a `Wire` object without connecting its nodes can result in circuits
that appear visually connected but do not update correctly during simulation.

This invariant is especially important when constructing circuits
programmatically.

---

## Element Pin Contracts

Each simulator element exposes specific signal nodes that must be mapped
correctly:

### Input
- `output1`

### Output
- `inp1`

### Logic Gates (AND, XOR, etc.)
- `inp1`
- `inp2`
- `output1`

Incorrect mapping of these pins is a common source of bugs when generating
circuits outside the UI.

---

## Common Beginner Pitfalls

New contributors often encounter issues due to the following assumptions:

- Assuming the circuit graph is stored in the Vue/Pinia store
- Creating wires without explicitly connecting signal nodes
- Forgetting to wire a gate’s output node to an output element
- Incorrectly mapping pin names such as `output1` and `inp1`
- Treating visual connections as equivalent to signal connections

Most simulation issues originate from incorrect node or wire setup rather than
UI logic.

---

## Practical Observations from Debugging the Simulator

While debugging programmatic circuit construction, several behaviors are worth
highlighting:

- Signal propagation depends on node connectivity, not the presence of a wire
  object alone.

- Outputs may appear visually connected but remain inactive if a gate’s output
  node is not explicitly wired to the output’s input node.

- Pin naming conventions (`output1`, `inp1`) are part of the element contract
  and must be respected.

- Many issues that appear UI-related are actually caused by incorrect simulator
  setup at the node or wire level.

These observations are particularly relevant when circuits are generated or
loaded programmatically.

---

## Notes for Programmatic and Automated Circuit Generation

When generating circuits programmatically (for example, via scripts or AI
systems), it is recommended to:

- Use an adapter layer that translates a higher-level description into valid
  simulator constructs
- Avoid modifying core engine logic
- Enforce simulator invariants such as node connectivity and pin contracts
- Validate node and wire references before instantiation

This approach keeps the engine stable while enabling new ways of creating
circuits.

---

## Further Reading and Code Pointers

For contributors who want to explore further:

- Circuit loading logic (`load`, `loadScope`)
- Node implementation
- Wire implementation
- Simulator source directory (`src/simulator`)

---

## Summary

- The Vue store manages UI state, not circuit data
- Circuit graphs live in simulator/engine globals
- Signal propagation depends on explicit node connectivity
- Correct pin mapping and wiring are essential for simulation correctness
- Programmatic circuit generation should respect existing engine contracts

Understanding these principles is essential for working effectively with the
CircuitVerse simulator.
