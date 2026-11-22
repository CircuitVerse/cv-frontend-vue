# Hotkey Binder Documentation

The hotkey binder manages keyboard shortcut registration, customization, and key event handling in the simulator.

## Architecture

The module consists of the following components:

- **`model/shortcuts.plugin.ts`**: Core shortcut manager. Exports the `shortcut` object with:
  - `add(shortcut_combination: string, callback: (e: KeyboardEvent) => void, opt?: ShortcutOptions)`: Registers a shortcut. Supported formats include a single key, modifier (`ctrl`, `alt`, `shift`, `meta`), or modifier + key combination (e.g., `Ctrl+S`).
  - `remove(shortcut_combination: string)`: Unregisters a specific shortcut.
  - `removeAll()`: Removes all registered shortcuts.
- **`defaultKeys.ts`**: Exports `defaultKeys` (of type `DefaultKeysType`), mapping action names to their default key combinations. This is the single source of truth for default shortcuts.
- **`model/addShortcut.ts`**: Exports `addShortcut(keys: string, action: ActionType, customOptions?: Partial<ShortcutOptions>)`. `ActionType` is a TypeScript union of supported action names. A `switch` maps each action to its corresponding callback.
- **`model/actions.ts`**: Contains action callbacks and helper functions (e.g., `elementDirection`, `insertLabel`, `labelDirection`, `openHotkey`, `moveElement`, `openDocumentation`, `setUserKeys`, `setDefault`).
- **`model/utils.ts`**: General utilities, OS detection (`getOS`), and `checkRestricted(key: string)`. The `checkRestricted` function defines a local `const restrictedKeys` array containing reserved browser/system combinations. To restrict a combination, edit this array directly in the source.
- **`model/normalize/normalizer.plugin.js`**: Translates raw key events into normalized string representations used by the shortcut binder.
- **`model/model.types.ts`**: TypeScript type definitions and interfaces used across the hotkey binder (`ShortcutOptions`, `ShortcutBinding`, `ModifierState`).
- **`view/panel.ui.js`**: UI helper functions (`updateHTML`, `override`, `closeEdit`, `submit`) for the preference panel.
- **`keyBinder.js`**: Legacy file containing 151 lines of commented-out code. It is inactive and retained only for historical reference.

## Usage Guide

### 1. Adding a New Shortcut Action
To register a new shortcut action:
1. Add the action name to the `ActionType` union in `model/addShortcut.ts`.
2. Add a `case` in the `switch (action)` block of `model/addShortcut.ts` that associates the action with its callback function.
3. Add the default key combination to `defaultKeys` in `defaultKeys.ts`.

### 2. Removing a Shortcut Action
1. Remove the action entry from `defaultKeys` in `defaultKeys.ts`.
2. Remove the corresponding `case` from the switch statement in `model/addShortcut.ts`.
3. Remove the action's union member from `ActionType` in `model/addShortcut.ts`. TypeScript flags remaining literal callers that use the removed name. It does not flag dynamic names read from `userKeys` or `defaultKeys` in `bindKeys` (`model/actions.ts`). Search for those names manually.

### 3. Adding Key Restrictions
To prevent a key combination from being assigned (e.g. system or browser reserved hotkeys):
- Edit the `restrictedKeys` array inside `checkRestricted()` in `model/utils.ts`.
- **macOS note:** `checkRestricted()` automatically maps every `Ctrl`-prefixed entry to `Meta` on macOS. Adding `Ctrl + Q` to `restrictedKeys` will therefore restrict `Meta + Q` on macOS, not `Ctrl + Q`. To restrict the actual `Ctrl` combination on macOS, a code change to the mapping logic in `checkRestricted()` is required.

### 4. Persistence
Custom shortcuts and default hotkeys are persisted via `localStorage`:
- Custom user bindings are stored under the `"userKeys"` key in `localStorage`.
- Default bindings are stored under `"defaultKeys"`.
- On application/dialog mount, `CustomShortcut.vue` checks `localStorage.userKeys`:
  - If `userKeys` exists, it calls `checkUpdate()` and loads custom shortcuts with `addKeys('user')`.
  - Otherwise, it falls back to defaults via `setDefault()`, which stores the OS-adapted default keys in `localStorage` under `"defaultKeys"`.
