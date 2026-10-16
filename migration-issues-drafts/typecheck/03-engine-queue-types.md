### Is there an existing issue for this?

- [x] I have searched the existing issues (part of the `vue-tsc` baseline: 76 errors under `npx vue-tsc --noEmit -p tsconfig.v1.json`; parent gap is #1232)

### Description

8 errors, all in the engine / simulation-queue interaction in
`v1/src/simulator/src/engine.ts` (plus 2 in `ControlledInverter.ts` on the
same missing member). No type needed inventing — the code already assumes
these shapes, the types just do not say so:

- `engine.ts:417,440,441` + `ControlledInverter.ts:62,67`:
  `simulationArea.contentionPending` does not exist on `SimulationArea`
  (`v1/src/simulator/src/interface/simulationArea.ts`). It is assigned a
  `ContentionPendingData` (`v1/src/simulator/src/contention.ts`) at runtime.
  Fix: add `contentionPending` to the interface (5 errors).
- `engine.ts:430`: `elem.resolve()` — `pop()` returns `QueueObject`, which has
  no `resolve`. Fix: extend the pop result type with `resolve(): void`
  (queue elements are always resolvable elements at runtime) (1 error).
- `engine.ts:278`: `canvasMessageData` is initialized with `undefined` fields,
  so `canvasMessageData.x/y` stay `undefined`. Fix: annotate the object type
  (1 error).
- `engine.ts:527`: `updated |= ....update()` — `update()` returns
  `boolean | undefined`, invalid for `|=`. Fix: coerce explicitly (1 error).

### Acceptance

- [ ] `npx vue-tsc --noEmit -p tsconfig.v1.json` drops by these 8 errors
- [ ] `npm run test:v1` green, `npm run lint:v1` clean (no behaviour change)
- [ ] Suggested labels: `JS to TS migration`, `good first issue`
