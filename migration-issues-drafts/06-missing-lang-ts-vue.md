### Is there an existing issue for this?

- [x] I have searched the existing issues

### Description

63/65 Vue Single-File Components (SFCs) in `v1/src` already use `lang="ts"`.
A Single-File Component is a `.vue` file that bundles its template, script,
and styles in one file. The last two still use plain `<script>`
(Options API, untyped):

- `v1/src/components/Logo/Logo.vue` (simple props-only component)
- `v1/src/components/helpers/createNewProject/TextEditor.vue`

Convert both to `<script setup lang="ts">` with typed props. Trivial diff,
no simulator knowledge needed — ideal first Pull Request (PR).

### Guidelines

- Only the `v1` folder.
- Keep the rendered output identical; types only.
- `vue-tsc --noEmit -p tsconfig.v1.json` clean for touched files.

### Acceptance

- [ ] Both Single-File Components use `<script setup lang="ts">`
- [ ] No visual/behaviour change
- [ ] Suggested labels: `good first issue`
