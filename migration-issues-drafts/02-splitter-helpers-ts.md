### Is there an existing issue for this?

- [x] I have searched the existing issues (Splitter itself is larger at ~330 lines and is intentionally left out)

### Description

Convert the Splitter helper elements from JavaScript (JS) to TypeScript (TS):

- `v1/src/simulator/src/modules/LSB.js` (~139 lines)
- `v1/src/simulator/src/modules/MSB.js` (~136 lines)

Same base class, near-identical structure — one Pull Request (PR), one review.
Leaves the bigger `Splitter.js` (~330 lines) as a follow-up once these two land.

### Guidelines

- Only the `v1` folder.
- Rename `.js` → `.ts`, run `vue-tsc --noEmit -p tsconfig.v1.json`, fix errors.
- No implicit `any`; one-line comment above any unavoidable `any`.
- No file extensions in imports.
- Run `npm run test:v1` (decoders-plexers / misc specs cover splitter-adjacent paths).

### Acceptance

- [ ] `LSB.ts`, `MSB.ts` typecheck clean
- [ ] No behaviour change
- [ ] Suggested labels: `JS to TS migration`, `good first issue`
