### Is there an existing issue for this?

- [x] I have searched the existing issues (#1148, #1183, #1184 cover other files, not these)

### Description

Convert the two power-pin elements from JavaScript (JS) to TypeScript (TS):

- `v1/src/simulator/src/modules/Ground.js` (~107 lines)
- `v1/src/simulator/src/modules/Power.js` (~142 lines)

Both are tiny leaf elements with no subcircuit/testbench coupling, so this is
a good first TypeScript-migration Pull Request (PR). Follow the pattern of the
already-converted `Buffer.ts` / `XorGate.ts` (see #1274).

### Guidelines

- Only the `v1` folder.
- Rename `.js` → `.ts`, run `vue-tsc --noEmit -p tsconfig.v1.json`, fix all errors.
- No implicit `any` — type params, returns, class members.
- If `any` is unavoidable, leave a one-line comment explaining why.
- No file extensions in imports (`./node`, not `./node.ts`).
- Verify `gates.spec.js` / `misc.spec.js` still pass (`npm run test:v1`).

### Acceptance

- [ ] Both files are `.ts` and typecheck clean
- [ ] No behaviour change (grounds/powers still resolve in existing specs)
- [ ] Suggested labels: `JS to TS migration`, `good first issue`
