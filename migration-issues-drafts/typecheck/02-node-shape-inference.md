### Is there an existing issue for this?

- [x] I have searched the existing issues (part of the `vue-tsc` baseline: 76 errors under `npx vue-tsc --noEmit -p tsconfig.v1.json`; parent gap is #1232)

### Description

13 errors share one root cause: the inferred shape of the JavaScript (JS)
`Node` class (`v1/src/simulator/src/node.js`) is narrower than how the
TypeScript (TS) simulator code uses it. Three sub-causes, all fixed with
JSDoc annotations in `node.js` (not typechecked itself, so no runtime change):

**a. `queueProperties` inferred with `| undefined` (5 errors).** The
`{ inQueue: false, time: undefined, index: undefined }` literal infers
`time: undefined, index: undefined`, and the whole object widens to
`| undefined`, so a `Node` is not assignable to `QueueObject`
(`v1/src/simulator/src/eventQueue.ts`):

- `v1/src/simulator/src/modules/Buffer.ts:68`
- `v1/src/simulator/src/modules/ControlledInverter.ts:59,65`
- `v1/src/simulator/src/modules/XnorGate.ts:80`
- `v1/src/simulator/src/modules/XorGate.ts:81`

Fix: `/** @type {{inQueue: boolean, time: number|undefined, index: number|undefined}} */`
above the `this.queueProperties = {...}` assignment.

**b. `verilogLabel` missing from the inferred type (6 errors).** Nodes carry
`verilogLabel` at runtime (see `node.js:1028-1054`) but it is never assigned
in the constructor, so it is absent from the inferred type:

- `v1/src/simulator/src/modules/Buffer.ts:95` (x2)
- `v1/src/simulator/src/modules/ControlledInverter.ts:97` (x4)

Fix: declare it (e.g. `/** @type {string} */` with an initial value, or assign
where the label is set).

**c. 5th constructor parameter inferred as `undefined` (2 errors).** The
`bitWidth = undefined` default narrows the parameter type, so the explicit
`1` in `new Node(0, 0, 0, this, 1, "reset")` is rejected:

- `v1/src/simulator/src/modules/Buffer.ts:33`
- `v1/src/simulator/src/modules/ControlledInverter.ts:31`

Fix: annotate the parameter (e.g. `@param {number|undefined}`) so a number is
accepted.

### Acceptance

- [ ] `npx vue-tsc --noEmit -p tsconfig.v1.json` drops by these 13 errors
- [ ] `npm run test:v1` green, `npm run lint:v1` clean (no behaviour change)
- [ ] Suggested labels: `JS to TS migration`, `good first issue`
