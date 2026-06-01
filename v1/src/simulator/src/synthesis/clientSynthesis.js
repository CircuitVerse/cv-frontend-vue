/**
 * Client-side synthesis service. spawns web worker
 */

let worker = null

// Incrementing ID to match responses to requests (supports concurrent calls)
let requestId = 0

/**
 * Synthesize Verilog code client-side using a Web Worker running YoWASP.
 *
 * @param {string} verilogCode - The Verilog source code to synthesize
 * @param {function} [onProgress] - Optional callback for progress updates
 * @returns {Promise<object>} DigitalJS circuit object (same format the server returns)
 */
export function synthesizeVerilog(verilogCode, onProgress) {
    return new Promise((resolve, reject) => {
        // Create the worker on first call (lazy init)
        if (!worker) {
            try {
                // import.meta.env.BASE_URL resolves to "/" in Tauri desktop,
                // or "/simulatorvue/v0/" in web — ensures correct asset path
                var workerUrl = (import.meta.env.BASE_URL || '/') + 'assets/synthesisWorker.js'
                worker = new Worker(workerUrl, { type: 'module' })
            } catch (err) {
                reject(new Error('Failed to create synthesis worker: ' + err.message))
                return
            }
        }

        var id = ++requestId

        function handleMessage(e) {
            // Ignore messages from other requests
            if (e.data.id !== id) return

            switch (e.data.type) {
                case 'progress':
                    if (onProgress) onProgress(e.data.message)
                    break

                case 'result':
                    cleanup()
                    resolve(e.data.data)
                    break

                case 'error':
                    cleanup()
                    reject(new Error(e.data.message))
                    break
            }
        }

        function handleError(err) {
            cleanup()
            reject(new Error('Synthesis worker error: ' + (err.message || 'Unknown error')))
        }

        function cleanup() {
            worker.removeEventListener('message', handleMessage)
            worker.removeEventListener('error', handleError)
        }

        worker.addEventListener('message', handleMessage)
        worker.addEventListener('error', handleError)

        // Send the synthesis request to the worker
        worker.postMessage({ type: 'synthesize', code: verilogCode, id: id })
    })
}
