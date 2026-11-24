### Is there an existing issue for this?

- [x] I have searched the existing issues (part of the `vue-tsc` baseline: 76 errors under `npx vue-tsc --noEmit -p tsconfig.v1.json`; parent gap is #1232)

### Description

4 errors, one cause: `ExportProject.vue` and `ImportProject.vue` each contain
**two** `<script>` blocks that both `import { useState }`, producing
`Duplicate identifier 'useState'`:

- `v1/src/components/DialogBox/ExportProject.vue:42,53`
- `v1/src/components/DialogBox/ImportProject.vue:67,80`

(A plain `<script lang="ts">` block exporting a helper plus a
`<script setup lang="ts">` block re-importing the same name.)

### Suggested fix

Merge each file into a single `<script setup lang="ts">` block (move the
plain-script helper function into it). No template or behaviour change.

### Acceptance

- [ ] `npx vue-tsc --noEmit -p tsconfig.v1.json` drops by these 4 errors
- [ ] `npm run test:v1` green, `npm run lint:v1` clean (no behaviour change)
- [ ] Suggested labels: `good first issue`
