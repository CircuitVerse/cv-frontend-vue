### Is there an existing issue for this?

- [x] I have searched the existing issues (part of the `vue-tsc` baseline: 76 errors under `npx vue-tsc --noEmit -p tsconfig.v1.json`; parent gap is #1232)

### Description

3 errors in `v1/src/components/helpers/deleteCircuit/DeleteCircuit.vue`,
from the store type disagreeing with actual usage:

- `:50,117` — `<SimulatorStateType>useState()` cast fails: the store's
  `dialogBox` type lacks the required `delete_circuit` property. Fix: use the
  store type as-is (drop the cast) or correct `SimulatorStateType` so the two
  agree (2 errors).
- `:133` — `scope.id == globalScope.id ?? ...`: right operand of `??` is
  unreachable because the left is never nullish. Fix the comparison grouping
  (almost certainly missing parentheses around the `??` fallback) (1 error).

### Acceptance

- [ ] `npx vue-tsc --noEmit -p tsconfig.v1.json` drops by these 3 errors
- [ ] `npm run test:v1` green, `npm run lint:v1` clean (no behaviour change)
- [ ] Suggested labels: `good first issue`
