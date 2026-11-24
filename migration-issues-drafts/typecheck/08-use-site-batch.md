### Is there an existing issue for this?

- [x] I have searched the existing issues (part of the `vue-tsc` baseline: 76 errors under `npx vue-tsc --noEmit -p tsconfig.v1.json`; parent gap is #1232)

### Description

7 leftover errors, each a one-line use-site fix in a different file.
Grouped because the fix pattern is identical (narrow the type where it is
used, no design change, no runtime change):

- `v1/src/simulator/src/subcircuit.ts:115,120` — `checkDependency(scope.id)`
  passes `string | number` where the parameter takes `number`. Coerce at the
  call or widen the parameter (2 errors).
- `v1/src/simulator/src/utils.ts:17` — `window.globalScope = undefined` but
  `globals.d.ts` declares it non-optional. Fix: declare it
  `Scope | undefined` (1 error).
- `v1/src/simulator/src/commands/zoom.ts:11` —
  `changeScale(direction * 0.1 * DPR)` passes 1 argument where 3–4 are
  expected. Fix the call or give `changeScale` defaults (1 error).
- `v1/src/simulator/src/layout/layoutBuffer.ts:30` —
  `{ ...scope.layout }` lacks `x`/`y` required by the target type. Fix the
  spread or the target type (1 error).
- `v1/src/simulator/src/layout/layoutNode.ts:106` — `drawCircle(ctx, ...)`
  with a possibly-null context. Guard like the module `customDraw()` methods
  do (1 error).
- `v1/src/simulator/src/hotkey_binder/model/actions.ts:49` —
  `addShortcut(normalizedKey, pref)` passes `string` where `ActionType` is
  expected. Type the key map accordingly (1 error).

### Acceptance

- [ ] `npx vue-tsc --noEmit -p tsconfig.v1.json` drops by these 7 errors
- [ ] `npm run test:v1` green, `npm run lint:v1` clean (no behaviour change)
- [ ] Suggested labels: `JS to TS migration`, `good first issue`
