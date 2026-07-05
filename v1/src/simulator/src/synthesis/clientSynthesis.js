// Client-side synthesis — spawns a web worker for YoWASP Yosys

var worker = null
var requestId = 0
var busy = false

var DEFAULT_SYNTHESIS_TIMEOUT_MS = 30000

// abort + reset the worker if synthesis runs longer (default 30s).
export function synthesizeVerilog(verilogCode, onProgress, options = {}) {
    var timeoutMs = options.timeoutMs ?? DEFAULT_SYNTHESIS_TIMEOUT_MS

    return new Promise((resolve, reject) => {
        if (busy) {
            reject(new Error('A Verilog synthesis is already in progress'))
            return
        }

        if (!worker) {
            try {
                worker = new Worker(new URL('./synthesisWorker.js', import.meta.url), { type: 'module' })
            } catch (err) {
                reject(new Error('Failed to create synthesis worker: ' + err.message))
                return
            }
        }

        var id = ++requestId
        var timer = null
        var currentWorker = worker
        busy = true

        function handleMessage(e) {
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
            currentWorker.terminate()
            if (worker === currentWorker) worker = null
            reject(new Error('Synthesis worker error: ' + (err.message || 'Unknown error')))
        }

        function cleanup() {
            busy = false
            clearTimeout(timer)
            currentWorker.removeEventListener('message', handleMessage)
            currentWorker.removeEventListener('error', handleError)
        }

        currentWorker.addEventListener('message', handleMessage)
        currentWorker.addEventListener('error', handleError)

        timer = setTimeout(() => {
            cleanup()
            currentWorker.terminate()
            if (worker === currentWorker) worker = null
            var error = new Error(
                'Verilog synthesis timed out after ' + (timeoutMs / 1000) + ' seconds'
            )
            error.name = 'SynthesisTimeoutError'
            reject(error)
        }, timeoutMs)

        try {
            currentWorker.postMessage({ type: 'synthesize', code: verilogCode, id: id })
        } catch (err) {
            cleanup()
            reject(new Error('Failed to send code to synthesis worker: ' + err.message))
        }
    })
}
