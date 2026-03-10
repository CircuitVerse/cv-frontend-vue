import { runYosys, Exit as YosysExit } from 'https://cdn.jsdelivr.net/npm/@yowasp/yosys/gen/bundle.js';

self.postMessage({ type: 'ready' });

self.onmessage = async (e) => {
    const { verilog } = e.data;
    try {
        const files = { 'input.v': verilog };
        const outputFiles = await runYosys(['-p', 'read_verilog input.v; proc; opt; write_json output.json'], files);
        const raw = outputFiles['output.json'];
        const jsonText = (raw instanceof Uint8Array || raw instanceof ArrayBuffer) ? new TextDecoder().decode(raw) : String(raw);
        self.postMessage({ type: 'success', json: JSON.parse(jsonText) });
    } catch (err) {
        if (err instanceof YosysExit) {
            self.postMessage({ type: 'error', message: 'Yosys exited with code ' + err.code });
        } else {
            self.postMessage({ type: 'error', message: err.message || String(err) });
        }
    }
};
