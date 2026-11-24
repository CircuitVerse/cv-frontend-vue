# V1 → TypeScript + Reactive Vue: gap analysis (2026-10-13, main @ 3e97a70)

## Code status (measured)

- `v1/`: 103× `.js`, 89× `.ts`, 65× `.vue`
- `v1/src/simulator/src/modules/`: 44× `.js` vs 5× `.ts`
  (done: Buffer, ControlledInverter, OrGate, XorGate, XnorGate)
- `v1/src/simulator/src/sequential/`: 13× `.js`, 0× `.ts`
- `v1/src/simulator/src/testbench/`: 3× `.js`, 0× `.ts`
- `v1/src/simulator/src/synthesis/`: 5× `.js`, 0× `.ts`
- Vue SFCs: 63/65 already `lang="ts"`, ~61 use `<script setup>`.
  Missing: `Logo.vue`, `TextEditor.vue` (plain `<script>`).
- jQuery left in Vue: only `ApplyThemes.vue` (5 calls) + `CombinationalAnalysis.vue` (1 active call).
- No `v1/src/composables/` dir. Pinia stores exist (12 files) but simulator core
  still uses globals + `document.getElementById`/`querySelector` in
  `listeners.js`, `ux.js`, `drag.ts`, `circuit.ts`, `simulationArea.ts`, etc.
- `tsconfig.v1.json` `include` covers only `v1/src/simulator/src/*.ts`
  (top level) + `globals.d.ts` + `env.d.ts` → `modules/`, `sequential/`,
  `testbench/`, `synthesis/` are never typechecked.

## Existing open issues (no duplicates created)

- #1148 `JS to TS`: node.js + module.js + circuitElement.js (~1000 lines each, not beginner-split)
- #1183 `JS to TS`: And/Not/Nand/Nor gates
- #1184 `JS to TS`: canvasApi / engine / ux / listeners (600–900 lines each)
- #1256 tracking: `listeners.js` → Vue (steps 3,4,6,7 remain)
- #1232: no typecheck in CI
- #1177: lint warnings cleanup (43 warnings)

## Drafts in this folder (all beginner-sized, no overlap with above)

1. `01-power-pins-ts.md` — Ground + Power (~250 lines)
2. `02-splitter-helpers-ts.md` — LSB + MSB (~275 lines)
3. `03-verilog-shims-ts.md` — 5 verilog* shims (~530 lines, mechanical, same pattern)
4. `04-clock-dlatch-ts.md` — Clock + Dlatch (~200 lines, first sequential)
5. `05-forcegate-ts.md` — sequential + testbench ForceGate (2×92 lines)
6. `06-missing-lang-ts-vue.md` — Logo + TextEditor `lang="ts"` (trivial)
7. `07-restricted-element-vue.md` — `restrictedElementDiv.js` (44 lines) → Vue (#1256 step 3)
8. `08-applythemes-jquery-vue.md` — drop jQuery from 2 Vue dialogs

## Why local files, not `gh issue create`

`AGENTS.md` in this repo forbids creating issues/PRs from agent sessions,
so these are local drafts for a maintainer to paste into GitHub.
Each file follows the repo's issue template + the TS guidelines from
#1148/#1183 (rename → `vue-tsc --noEmit` → no implicit `any` → no file
extension in imports).
