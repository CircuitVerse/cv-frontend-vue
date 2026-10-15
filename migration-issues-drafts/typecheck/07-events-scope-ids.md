### Is there an existing issue for this?

- [x] I have searched the existing issues (part of the `vue-tsc` baseline: 76 errors under `npx vue-tsc --noEmit -p tsconfig.v1.json`; parent gap is #1232)

### Description

4 errors in `v1/src/simulator/src/events.ts`, all from scope/circuit identity
types being narrower than the `string | number` ids actually passed around:

- `events.ts:49` — `switchCircuit(currentScopeId)` passes `string | number`
  where the parameter accepts only one side of the union.
- `events.ts:50,134,218` — `new Scope(globalScope.name, globalScope.id)`
  passes a `string | number` id where the `Circuit` constructor parameter is
  inferred too narrowly (same pattern, three call sites).

### Suggested fix

Widen the accepting side to `string | number` (the `Circuit`/`Scope` class
already handles both at runtime — see `getDependenciesList`, which branches
on `typeof scopeId`). Keep the fix to parameter annotations; no runtime
change.

### Acceptance

- [ ] `npx vue-tsc --noEmit -p tsconfig.v1.json` drops by these 4 errors
- [ ] `npm run test:v1` green, `npm run lint:v1` clean (no behaviour change)
- [ ] Suggested labels: `JS to TS migration`, `good first issue`
