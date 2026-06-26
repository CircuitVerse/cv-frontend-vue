// Web Worker — runs YoWASP Yosys in a background thread

import { runYosys } from '@yowasp/yosys'
import { yosys2digitaljs } from 'yosys2digitaljs/core'
import { parseYosysOutput } from './vfsGuard.js'

var silentPrint = () => {}
var wasmReady = false

self.onmessage = async function (e) {
    var { type, code, id } = e.data
    if (type !== 'synthesize') return

    try {
        if (!wasmReady) {
            self.postMessage({ type: 'progress', message: 'Loading Yosys WASM engine...', id })
            await runYosys([], {}, { print: silentPrint, printErr: silentPrint })
            wasmReady = true
        }

        self.postMessage({ type: 'progress', message: 'Running Yosys synthesis...', id })
        var result = await runYosys(
            [
                '-p',
                'read_verilog input.v; setattr -mod -unset top; hierarchy -auto-top; proc; opt; memory -nomap; wreduce -memx; opt -full; write_json output.json',
            ],
            { 'input.v': code },
            { print: silentPrint, printErr: silentPrint }
        )

        var yosysNetlist = parseYosysOutput(result)

        self.postMessage({ type: 'progress', message: 'Converting netlist to circuit...', id })
        var digitalJsCircuit = yosys2digitaljs(yosysNetlist)

        self.postMessage({ type: 'result', data: digitalJsCircuit, id })
    } catch (error) {
        self.postMessage({ type: 'error', message: error.message || 'Synthesis failed', id })
    }
}
