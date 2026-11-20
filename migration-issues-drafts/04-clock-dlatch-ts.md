### Is there an existing issue for this?

- [x] I have searched the existing issues (`sequential/` is 13× `.js` / 0× `.ts`; nothing tracks these two)

### Description

First sequential conversion — the two smallest files in `sequential/`, from
JavaScript (JS) to TypeScript (TS):

- `v1/src/simulator/src/sequential/Clock.js` (~92 lines)
- `v1/src/simulator/src/sequential/Dlatch.js` (~106 lines)

Keeps the diff under ~200 lines. Proves the sequential pattern before anyone
tackles the big ones (`RAM.js` ~368, `verilogRAM.js` ~534).

### Guidelines

- Only the `v1` folder.
- Rename `.js` → `.ts`, `vue-tsc --noEmit -p tsconfig.v1.json`, fix errors.
- No implicit `any`; comment any unavoidable `any`.
- No file extensions in imports.
- `npm run test:v1` green (sequential spec covers these).

### Acceptance

- [ ] `Clock.ts`, `Dlatch.ts` typecheck clean
- [ ] Clock oscillation + latch behaviour unchanged
- [ ] Suggested labels: `JS to TS migration`, `good first issue`
