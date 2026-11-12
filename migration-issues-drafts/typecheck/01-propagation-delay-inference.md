### Is there an existing issue for this?

- [x] I have searched the existing issues (part of the `vue-tsc` baseline: 76 errors under `npx vue-tsc --noEmit -p tsconfig.v1.json`; parent gap is #1232)

### Description

9 errors share one root cause: the JavaScript (JS) `CircuitElement` base class
(`v1/src/simulator/src/circuitElement.js`) infers `propagationDelay` as
`number | undefined`, but the TypeScript (TS) contract `Scope.root:
ICircuitElement` (`v1/src/simulator/src/types/circuitElement.types.ts`)
requires `propagationDelay: number`. Every error has the identical chain:

```text
Type 'CircuitElement' is not assignable to type 'ICircuitElement'.
  Types of property 'propagationDelay' are incompatible.
    Type 'number | undefined' is not assignable to type 'number'.
```

Affected sites (`file:line`):

- `v1/src/simulator/src/circuit.ts:111,196` (`lastSelected = globalScope.root`)
- `v1/src/simulator/src/layoutMode.ts:64,65`
- `v1/src/simulator/src/modules/Buffer.ts:23` (`scope: Scope = globalScope`)
- `v1/src/simulator/src/modules/ControlledInverter.ts:21`
- `v1/src/simulator/src/modules/OrGate.ts:27`
- `v1/src/simulator/src/modules/XnorGate.ts:25`
- `v1/src/simulator/src/modules/XorGate.ts:25`

### Suggested fix

No runtime change needed. Pin the declared type with a JSDoc annotation on the
prototype default in `circuitElement.js` (this file is not typechecked itself,
`checkJs` is off, so the annotation only affects consumers):

```js
/** @type {number} */
CircuitElement.prototype.propagationDelay = 10
```

Alternative (larger ripple, not recommended): relax
`ICircuitElement.propagationDelay` to `number | undefined`, which would spread
to `SavedCircuitElement`, `QueueObject`, and every `changePropagationDelay`
caller.

### Acceptance

- [ ] `npx vue-tsc --noEmit -p tsconfig.v1.json` drops by these 9 errors (76 → 67)
- [ ] `npm run test:v1` green, `npm run lint:v1` clean (no behaviour change)
- [ ] Suggested labels: `JS to TS migration`, `good first issue`
