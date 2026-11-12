### Is there an existing issue for this?

- [x] I have searched the existing issues

### Description

Only two Vue Single-File Component (SFC) dialogs still use jQuery (`$`).
A Single-File Component is a `.vue` file bundling template, script, and
styles. Replace the jQuery calls with Vue refs / reactive state:

- `v1/src/components/DialogBox/Themes/ApplyThemes.vue` — ~5 calls
  (`$('.selected label')`, `$('.set')` class toggling → `:class` binding +
  a `selectedTheme` ref, `localStorage` write stays).
- `v1/src/components/DialogBox/CombinationalAnalysis.vue` — 1 active call
  (`$('.messageBox .v-card-text')[0].innerHTML` → template ref).

No simulator-engine knowledge needed; pure Vue reactivity cleanup and a
step toward dropping the jQuery dependency on the simulator path.

### Acceptance

- [ ] No `$` / `jQuery` import or global use in either Single-File Component
- [ ] Theme select + persist still works; combinational table still renders
- [ ] Suggested labels: `good first issue`
