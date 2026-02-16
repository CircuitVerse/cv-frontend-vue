Live Theme Editor

What it is
- A UI for editing app CSS variables (the :root variables in `src/styles/color_theme.scss`) live with an instant preview.
- Features: animated transitions, contrast checker, export/import JSON, save/load themes in localStorage, and curated default themes (`cute`, `night-sky`).

How to open
- Run the dev server and navigate to `/theme-editor` or use the Tools → Theme Editor menu item.

Developer notes
- Core logic lives in `src/plugins/themeEditor.ts`.
- Default themes are under `src/assets/themes/index.ts`.
- The editor component is at `src/components/ThemeEditor/LiveThemeEditor.vue` and the picker is `ThemePicker.vue`.

Testing
- A minimal vitest test exists at `src/components/ThemeEditor/themeEditor.test.ts` that verifies plugin exports.

Next improvements
- Better CSS variable parsing (handle var() references).
- Theme gallery thumbnails and server-backed marketplace.
- Accessibility checks and automated contrast-fix suggestions.
