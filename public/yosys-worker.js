// yosys-worker.js
// Place in /public/yosys-worker.js
// Register with: new Worker('/yosys-worker.js')   <-- NO { type: 'module' }

'use strict';

var runYosys = null;
var YosysExit = null;
var wasmLoaded = false;
var pendingMessages = [];

function postError(msg, requestId) {
    self.postMessage({ type: 'error', message: String(msg), requestId: requestId });
}

Promise.resolve()
    .then(function () {
        return import('/yosys-bundle.js');
    })
    .then(function (mod) {
        runYosys = mod.runYosys;
        YosysExit = mod.Exit || mod.YosysExit || null;
        if (typeof runYosys !== 'function') {
            throw new Error('runYosys is not a function. Keys: ' + Object.keys(mod).join(', '));
        }
        return runYosys([], {}, { synchronously: false }).catch(function () {});
    })
    .then(function () {
        wasmLoaded = true;
        console.log('[Worker] WASM ready');
        self.postMessage({ type: 'ready' });
        var msgs = pendingMessages.splice(0);
        msgs.forEach(function (e) { handleMessage(e); });
    })
    .catch(function (err) {
        var msg = (err && err.message) ? err.message : String(err);
        console.error('[Worker] Failed to load Yosys WASM:', msg);
        postError('Failed to load Yosys WASM: ' + msg);
    });

self.onmessage = function (e) {
    if (!wasmLoaded) {
        pendingMessages.push(e);
        return;
    }
    handleMessage(e);
};

function handleMessage(e) {
    var verilog = e.data.verilog;
    var topModule = e.data.topModule;
    var requestId = e.data.requestId;

    if (typeof runYosys !== 'function') {
        postError('Yosys WASM not ready.', requestId);
        return;
    }

    var code = String(verilog || '').trim();
    if (!code) { postError('Empty Verilog code.', requestId); return; }

    var stripped = code.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    if (!/\bmodule\s+\w+/.test(stripped)) {
        postError('No module declaration found in code.', requestId);
        return;
    }

    var top = topModule || 'top';
    var script = [
        'read_verilog input.v',
        'hierarchy -top ' + top,
        'proc', 'opt', 'memory', 'techmap', 'opt', 'clean',
        'write_json output.json'
    ].join('; ');

    var stdoutChunks = [], stderrChunks = [];

    runYosys(
        ['-p', script],
        { 'input.v': code },
        {
            stdout: function (d) { if (d) stdoutChunks.push(typeof d === 'string' ? d : new TextDecoder().decode(d)); },
            stderr: function (d) { if (d) stderrChunks.push(typeof d === 'string' ? d : new TextDecoder().decode(d)); },
            synchronously: false,
        }
    ).then(function (result) {
        var jsonRaw = (result instanceof Map) ? result.get('output.json') : (result && result['output.json']);
        if (!jsonRaw) {
            postError('Yosys produced no output.json.\nStderr:\n' + stderrChunks.join('').slice(0, 600), requestId);
            return;
        }
        var jsonText = (typeof jsonRaw === 'string') ? jsonRaw : new TextDecoder().decode(jsonRaw);
        var parsed;
        try { parsed = JSON.parse(jsonText); } catch (pe) { postError('Failed to parse Yosys JSON: ' + pe.message, requestId); return; }
        if (!parsed.modules || Object.keys(parsed.modules).length === 0) {
            postError('No modules in Yosys output.\nStderr:\n' + stderrChunks.join('').slice(0, 600), requestId);
            return;
        }
        self.postMessage({ type: 'success', json: parsed, stdout: stdoutChunks.join(''), stderr: stderrChunks.join(''), requestId: requestId });
    }).catch(function (err) {
        var stderr = stderrChunks.join('').slice(0, 600);
        var msg = (YosysExit && err instanceof YosysExit)
            ? 'Yosys exited with code ' + err.code + '\nStderr:\n' + stderr
            : ((err && err.message ? err.message : String(err)) + '\nStderr:\n' + stderr);
        postError(msg, requestId);
    });
}

