### Is there an existing issue for this?

- [x] I have searched the existing issues (part of the `vue-tsc` baseline: 76 errors under `npx vue-tsc --noEmit -p tsconfig.v1.json`; parent gap is #1232)

### Description

7 strict-mode errors in canvas drawing code, all file-local with obvious
fixes (no design decisions needed):

- `v1/src/simulator/src/canvasApi.ts:359,398,399` — `rotateAngle`
  (`canvasApi.ts:512`) returns `(number | boolean)[]`, so the destructured
  `newStart`/`newStop` are `number | boolean` and rejected by `ctx.arc`.
  Fix: annotate the return type as `[number, number, boolean]` (3 errors).
- `v1/src/simulator/src/canvasApi.ts:573,574,575` — `colorToRGBA` uses the
  result of `cvs.getContext("2d")` (typed `... | null`) without a guard.
  Fix: guard for null (3 errors).
- `v1/src/simulator/src/wire.ts:99` — `draw()` passes
  `simulationArea.context` (typed `... | null`) to `drawLine`. Fix: early
  return when the context is null, matching the `if (!ctx) return;` pattern
  already used in module `customDraw()` methods (1 error).

### Acceptance

- [ ] `npx vue-tsc --noEmit -p tsconfig.v1.json` drops by these 7 errors
- [ ] `npm run test:v1` green, `npm run lint:v1` clean (no behaviour change)
- [ ] Suggested labels: `JS to TS migration`, `good first issue`
