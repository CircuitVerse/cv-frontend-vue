### Is there an existing issue for this?

- [x] I have searched the existing issues (part of the `vue-tsc` baseline: 76 errors under `npx vue-tsc --noEmit -p tsconfig.v1.json`; parent gap is #1232)

### Description

9 errors in `v1/src/simulator/src/canvasApi.ts` share one cause: the
`SimulationArea` interface (`v1/src/simulator/src/interface/simulationArea.ts`)
disagrees with how the runtime actually uses these fields. Fix the interface,
not the call sites:

- `canvasApi.ts:12,13,14,15` — `findDimensions` intentionally resets
  `minWidth/maxWidth/minHeight/maxHeight` to `undefined` before recomputing.
  Fix: widen those four fields to `number | undefined` (4 errors).
- `canvasApi.ts:174,175,177,178` — `dots()` reads `backgroundArea.canvas`
  after only guarding `context`, but the `BackgroundArea` interface already
  declares `canvas: HTMLCanvasElement | null`. Fix: guard `canvas` for null
  alongside `context` (4 errors).
- `canvasApi.ts:57` — `simulationArea.objectList = updateOrder`, where
  `updateOrder` is a `string[]` but `objectList` is `ICircuitElement[]`.
  Fix: type `objectList` to reflect this dual use (1 error).

### Acceptance

- [ ] `npx vue-tsc --noEmit -p tsconfig.v1.json` drops by these 9 errors
- [ ] `npm run test:v1` green, `npm run lint:v1` clean (no behaviour change)
- [ ] Suggested labels: `JS to TS migration`, `good first issue`
