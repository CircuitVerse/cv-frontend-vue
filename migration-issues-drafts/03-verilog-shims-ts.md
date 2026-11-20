### Is there an existing issue for this?

- [x] I have searched the existing issues

### Description

Convert the five tiny Verilog-arithmetic shim modules from JavaScript (JS) to
TypeScript (TS) — all ~103–124 lines, same copy-paste shape:

- `v1/src/simulator/src/modules/verilogDivider.js` (~124)
- `v1/src/simulator/src/modules/verilogMultiplier.js` (~103)
- `v1/src/simulator/src/modules/verilogPower.js` (~103)
- `v1/src/simulator/src/modules/verilogShiftLeft.js` (~105)
- `v1/src/simulator/src/modules/verilogShiftRight.js` (~105)

Mechanical conversion: convert one, the other four are the same pattern.
Good beginner batch because the files are small and self-contained.

### Guidelines

- Only the `v1` folder.
- Rename `.js` → `.ts`, `vue-tsc --noEmit -p tsconfig.v1.json`, fix errors.
- No implicit `any`; no `as unknown as`.
- No file extensions in imports.
- `npm run test:v1` green.

### Acceptance

- [ ] All five files are `.ts` and typecheck clean
- [ ] No behaviour change
- [ ] Suggested labels: `JS to TS migration`, `good first issue`
