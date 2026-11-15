### Is there an existing issue for this?

- [x] I have searched the existing issues

### Description

Convert the two same-named ForceGate files together from JavaScript (JS) to
TypeScript (TS) — both ~92 lines:

- `v1/src/simulator/src/sequential/ForceGate.js`
- `v1/src/simulator/src/testbench/ForceGate.js`

Tiny, same name, likely shared shape — convert as a pair so imports stay
consistent. Unblocks future testbench TypeScript work (#1231, #1248 touch this area).

### Guidelines

- Only the `v1` folder.
- Rename `.js` → `.ts`, `vue-tsc --noEmit -p tsconfig.v1.json`, fix errors.
- No implicit `any`; no file extensions in imports.
- `npm run test:v1` green.

### Acceptance

- [ ] Both files are `.ts` and typecheck clean
- [ ] No behaviour change
- [ ] Suggested labels: `JS to TS migration`, `good first issue`
