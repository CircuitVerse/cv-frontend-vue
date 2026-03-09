import { runYosys, Exit as YosysExit } from 'https://cdn.jsdelivr.net/npm/@yowasp/yosys/gen/bundle.js';

runYosys([], {}, { synchronously: false }).then(() => {
    self.postMessage({ type: 'ready' });
}).catch(err => {
    self.postMessage({ type: 'error', message: 'Failed to load Yosys: ' + err });
});

self.onmessage = async (e) => {
    const { verilog, topModule } = e.data;
    try {
        const files = { 'input.v': verilog };
        const script = 'read_verilog input.v; hierarchy -top ' + topModule + '; proc; opt; memory; techmap; opt; clean; write_json output.json';
        const stdoutChunks = [];
        const stderrChunks = [];
        const result = runYosys(
            ['-p', script, '-o', 'output.json'],
            files,
            {
                stdout: data => { if (data) stdoutChunks.push(new TextDecoder().decode(data)); },
                stderr: data => { if (data) stderrChunks.push(new TextDecoder().decode(data)); },
                synchronously: true,
            }
        );
        const jsonOutput = result['output.json'];
        const parsed = JSON.parse(jsonOutput);
        self.postMessage({
            type: 'success',
            json: parsed,
            stdout: stdoutChunks.join(''),
            stderr: stderrChunks.join('')
        });
    } catch (err) {
        if (err instanceof YosysExit) {
            self.postMessage({ type: 'error', message: 'Yosys exited with code ' + err.code });
        } else {
            self.postMessage({ type: 'error', message: err.message || String(err) });
        }
    }
};