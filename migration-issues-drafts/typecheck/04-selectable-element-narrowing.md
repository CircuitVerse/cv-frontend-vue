### Is there an existing issue for this?

- [x] I have searched the existing issues (part of the `vue-tsc` baseline: 76 errors under `npx vue-tsc --noEmit -p tsconfig.v1.json`; parent gap is #1232)

### Description

10 errors share one cause: code accesses element-only properties (`x`, `y`,
`newDirection`, `labelDirection`, `labelDirectionFixed`, `helplink`) on a
value typed as the `SelectableElement` union
(`ICircuitElement | Wire | Node | LayoutNode`,
`v1/src/simulator/src/interface/simulationArea.ts:8`), and `Wire` does not
declare them:

- `v1/src/simulator/src/canvasApi.ts:129,130` — guarded by
  `lastSelected.objectType !== "Wire"`, which TypeScript (TS) cannot narrow on.
- `v1/src/simulator/src/hotkey_binder/model/actions.ts:229,239,240,285,287,288,324`
  (8 errors across `newDirection`, `labelDirection*`, `x`/`y`, `helplink`).

### Suggested fix

Narrow properly at each use site instead of relying on the `objectType`
string check — e.g. an `instanceof`/type-guard check, or restructuring so the
value is typed as the element type the code path already assumes. Do not
silence with `as any`; the Wire case should stay handled (fall back to mouse
position / skip, matching current runtime behaviour).

### Acceptance

- [ ] `npx vue-tsc --noEmit -p tsconfig.v1.json` drops by these 10 errors
- [ ] `npm run test:v1` green, `npm run lint:v1` clean (no behaviour change)
- [ ] Suggested labels: `JS to TS migration`
