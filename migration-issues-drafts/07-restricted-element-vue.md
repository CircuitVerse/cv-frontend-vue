### Is there an existing issue for this?

- [x] I have searched the existing issues (sub-task of tracking issue #1256, step 3 — filing separately so it can be done in one small Pull Request)

### Description

`v1/src/simulator/src/restrictedElementDiv.js` is only ~44 lines: it shows /
hides a "restricted element" notice via imperative Document Object Model (DOM)
calls. Per #1256 step 3, move this into Vue reactive state:

- Create `v1/src/components/RestrictedElementNotice.vue` (a Vue Single-File
  Component, i.e. a `.vue` file bundling template, script, and styles) driven
  by a Pinia store / props with `v-if`.
- Delete the DOM manipulation in `restrictedElementDiv.js` and its callers in
  `listeners.js`.
- No jQuery, no `document.getElementById`.

Smallest remaining Vue-reactivity item in #1256 — no canvas or shortcut
knowledge required.

### Acceptance

- [ ] Notice renders from reactive state, hover behaviour preserved
- [ ] No `restrictedElementDiv` DOM lookups remain on that path
- [ ] Suggested labels: `good first issue`
