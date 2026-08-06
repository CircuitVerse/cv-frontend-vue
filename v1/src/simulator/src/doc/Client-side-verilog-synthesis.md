## Client-Side Verilog Synthesis

**Primary Contributor:** [Priyank](https://github.com/Me-Priyank) (GSoC 2026, Project 7)

## Introduction

CircuitVerse lets users write Verilog code and turn it into a visual circuit. Earlier, this synthesis step required a server. This module removes that dependency for the Tauri Desktop app by running [Yosys](https://yosys.readthedocs.io/) (an open-source synthesis tool) entirely in the browser using WebAssembly.

The flow is simple: the user writes Verilog, Yosys compiles it into a JSON netlist, `yosys2digitaljs` converts that netlist into a format CircuitVerse understands, and then the simulator renders it on canvas. Everything runs locally.

## How It Works

When the user clicks **Save Code** in the Verilog editor, `Verilog2CV.js` picks up the code and checks whether the app is running inside Tauri (desktop) using `isTauri()` from `@tauri-apps/api/core`. If it is, synthesis happens client-side through a Web Worker. If not, it falls back to the server API.

The reason synthesis runs in a Web Worker is straightforward: Yosys WASM can take a few seconds to process even simple circuits, and running it on the main thread would freeze the entire UI. The worker keeps things responsive.

The worker loads the YoWASP Yosys WASM engine on its first run (cold start), then reuses it for subsequent runs. After synthesis, it validates the output, converts the netlist, and sends the result back to the main thread. The main thread then builds the actual CircuitVerse circuit from that data.

Progress messages, errors, and results are pushed to a Pinia store (`synthesisStore`), and the `VerilogTerminal.vue` component subscribes to that store to display them reactively. This replaces the old approach of using `window.verilogTerminal` and direct DOM manipulation.

## File Guide

### Synthesis Pipeline (`v1/src/simulator/src/synthesis/`)

**`synthesisWorker.js`** -- The Web Worker entry point. It receives a message with the user's Verilog code, runs Yosys on it, validates the output, converts the netlist using `yosys2digitaljs`, and posts the result back. One thing to know: it temporarily overrides `console.log` and `console.error` during synthesis because the WASI shim routes Yosys stderr through `console.log`. The originals are always restored in a `finally` block.

The Yosys command it runs:
```text
read_verilog input.v; setattr -mod -unset top; hierarchy -auto-top;
proc; opt; memory -nomap; wreduce -memx; opt -full; write_json output.json
```

**`clientSynthesis.js`** -- The main-thread API that `Verilog2CV.js` calls. It manages the worker lifecycle: creating it, sending code to it, listening for responses, and cleaning up. A few things it handles:

- **Concurrency:** Only one synthesis can run at a time. If you call it while one is already running, it rejects.
- **Timeouts:** If synthesis takes longer than 30 seconds (configurable), it kills the worker and rejects with a timeout error.
- **Memory management:** WebAssembly linear memory can't shrink. After 50 synthesis runs, the worker is terminated and a fresh one is created on the next call. This prevents unbounded memory growth from repeated Yosys invocations.

**`vfsGuard.js`** -- Validates the output from Yosys before trying to parse it. Yosys communicates through a virtual filesystem, and reading `output.json` from it can fail in non-obvious ways: the result might be null, the file might be missing entirely (silent failure), it might come back as a `Uint8Array` instead of a string (WASI behavior), or it might be empty or invalid JSON. This guard catches all of those and gives a clear error message instead of a generic crash.

**`errorParser.js`** -- Turns raw Yosys error output into something a human can read. When you write bad Verilog, Yosys spits out messages like `unexpected TOK_ID, expecting TOK_ENDMODULE`. Most users have no idea what `TOK_ID` means. This file maps those internal tokens to readable equivalents (`TOK_ID` becomes `identifier`, `TOK_ENDMODULE` becomes `'endmodule'`) and formats them into messages like: `Syntax error on line 3: unexpected identifier, expected 'endmodule'`.

**`circuitLayout.js`** -- Computes positions for the synthesized circuit elements so they render neatly on the canvas instead of piling up at (0, 0).

---

### Pinia Stores (`v1/src/store/`)

**`synthesisStore.ts`** -- Holds an array of terminal messages. Each message has a `text`, a `type` (`info`, `error`, or `success`), and a `timestamp`. The simulator layer pushes messages here, and the terminal component reads them.

**`verilogStore.ts`** -- Manages terminal visibility (`isTerminalVisible`) and the CodeMirror theme selection. Has actions for `toggleTerminal()`, `showTerminal()`, `hideTerminal()`, and `setTheme()`.

---

### Vue Components (`v1/src/components/Panels/VerilogEditorPanel/`)

**`VerilogTerminal.vue`** -- The terminal panel that shows synthesis output. It subscribes to `synthesisStore.messages` and renders them with color coding (blue for info, red for errors, green for success). Auto-scrolls to the latest message. It mounts and unmounts via `v-if` based on `verilogStore.isTerminalVisible`.

**`VerilogEditorPanel.vue`** -- The main panel containing the CodeMirror Verilog editor, the Reset Code / Save Code buttons, the terminal toggle button, and the theme selector dropdown.

---

### Simulator Layer (`v1/src/simulator/src/`)

**`Verilog2CV.js`** -- The bridge between the Vue layer and the simulator engine. It initializes the CodeMirror editor, handles save/reset actions, and calls `clientSynthesis.synthesizeVerilog()` for desktop synthesis. After getting the result, it builds the actual circuit on the canvas.

One important thing about this file: it's a plain JS module, not a Vue component. It gets imported before `app.use(pinia)` runs. So you can't call `useSynthesisStore()` or `useVerilogStore()` at the top level. Instead, it uses a lazy-init pattern:

```javascript
let _synthesisStore = null;
function getSynthesisStore() {
    if (!_synthesisStore) _synthesisStore = useSynthesisStore();
    return _synthesisStore;
}
```

If you ever add a new store reference in any file under `simulator/src/`, use this same pattern. Calling `useXxxStore()` at module scope will crash because Pinia isn't mounted yet.

---

### Tests (`v1/src/simulator/spec/`)

**`clientSynthesis.spec.js`** -- Tests the worker protocol using a MockWorker (timeouts, error handling, lifecycle recycling, concurrency guard). Runs in jsdom.

**`synthesis.spec.js`** -- Tests the VFS guard, error parser, and runs Yosys WASM parity tests against real Verilog inputs. Runs in Node (not jsdom) because `@yowasp/yosys` needs Node APIs.

**`synthesisStore.spec.ts`** -- Tests the Pinia store (adding messages, clearing, types).

To run them:
```bash
npm run test:v1          # all v1 tests
npm run test:synthesis   # synthesis-specific tests (Node env)
```

Synthesis specs run in a separate Vitest project with a Node environment. This is configured in `vitest.config.ts`.

## Things to Watch Out For

**Locale files are duplicated.** The `v1/` build uses its own locale files at `v1/src/locales/`, not the ones in `src/locales/`. If you add an i18n key, add it to both places or you'll get raw key paths showing up in the UI.

**The lazy-init pattern is not optional.** Any Pinia store accessed from `simulator/src/` files must use the cached getter pattern shown above. This is because `Verilog2CV.js` and friends are imported at module load time, before Pinia exists.

**First synthesis is slow.** Loading the Yosys WASM engine takes a few seconds on cold start. After that it's cached until the worker gets recycled (every 50 runs).

**Worker console is hijacked during synthesis.** If you add `console.log` inside the worker's synthesis path, your output will get captured as stderr lines. The originals are restored after synthesis completes.