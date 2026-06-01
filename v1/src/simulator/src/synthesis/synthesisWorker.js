/**
 * Web Worker for client-side Verilog synthesis.
 */

import { runYosys } from '@yowasp/yosys'
import { yosys2digitaljs } from 'yosys2digitaljs/core'

const silentPrint = () => {}

// Cache: after the first synthesis, WASM is already compiled and cached in memory
let wasmReady = false

self.onmessage = async function (e) {
    const { type, code, id } = e.data
    if (type !== 'synthesize') return

    try {
        // Step 1: First call loads WASM (~15MB download + compile, cached after)
        if (!wasmReady) {
            self.postMessage({ type: 'progress', message: 'Loading Yosys WASM engine...', id })
            await runYosys([], {}, { print: silentPrint, printErr: silentPrint })
            wasmReady = true
        }

        // Step 2: Run Yosys synthesis via WebAssembly
        self.postMessage({ type: 'progress', message: 'Running Yosys synthesis...', id })
        const result = await runYosys(
            [
                '-p',
                'read_verilog input.v; proc; opt; memory -nomap; wreduce; opt -full; write_json output.json',
            ],
            { 'input.v': code },
            { print: silentPrint, printErr: silentPrint }
        )

        // Step 3: Parse the JSON netlist from the virtual filesystem
        let jsonContent = result['output.json']
        if (jsonContent instanceof Uint8Array) {
            jsonContent = new TextDecoder().decode(jsonContent)
        }
        const yosysNetlist = JSON.parse(jsonContent)

        // Step 4: Convert Yosys JSON → DigitalJS circuit format
        self.postMessage({ type: 'progress', message: 'Converting netlist to circuit...', id })
        const digitalJsCircuit = yosys2digitaljs(yosysNetlist)

        self.postMessage({ type: 'result', data: digitalJsCircuit, id })
    } catch (error) {
        self.postMessage({ type: 'error', message: error.message || 'Synthesis failed', id })
    }
}
