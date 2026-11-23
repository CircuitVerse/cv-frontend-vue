// Client-side synthesis — spawns a web worker for YoWASP Yosys

var worker = null
var requestId = 0
var busy = false
var runCount = 0

var DEFAULT_SYNTHESIS_TIMEOUT_MS = 30000
var MAX_RUNS_BEFORE_RECYCLE = 50

function maybeRecycleWorker(currentWorker) {
    runCount++
    if (runCount >= MAX_RUNS_BEFORE_RECYCLE) {
        currentWorker.terminate()
        if (worker === currentWorker) worker = null
        runCount = 0
    }
}

function runWorkerTask(type, verilogCode, onProgress, options = {}) {
    var timeoutMs = options.timeoutMs ?? DEFAULT_SYNTHESIS_TIMEOUT_MS

    return new Promise((resolve, reject) => {
        if (!verilogCode || !verilogCode.trim()) {
            reject(new Error('Verilog code cannot be empty'))
            return
        }

        if (busy) {
            reject(new Error('A Verilog task is already in progress'))
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
                    maybeRecycleWorker(currentWorker)
                    resolve(e.data.data)
                    break

                case 'error':
                    cleanup()
                    maybeRecycleWorker(currentWorker)
                    reject(new Error(e.data.message))
                    break
            }
        }

        function handleError(err) {
            cleanup()
            currentWorker.terminate()
            if (worker === currentWorker) worker = null
            runCount = 0
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
            runCount = 0
            var opName = type === 'lint' ? 'Verilog validation' : 'Verilog synthesis'
            var error = new Error(
                opName + ' timed out after ' + (timeoutMs / 1000) + ' seconds'
            )
            error.name = 'SynthesisTimeoutError'
            reject(error)
        }, timeoutMs)

        try {
            currentWorker.postMessage({ type, code: verilogCode, id: id })
        } catch (err) {
            cleanup()
            reject(new Error('Failed to send code to synthesis worker: ' + err.message))
        }
    })
}

// abort + reset the worker if synthesis runs longer (default 30s).
export function synthesizeVerilog(verilogCode, onProgress, options = {}) {
    return runWorkerTask('synthesize', verilogCode, onProgress, options)
}

// In-browser WebAssembly linting & syntax verification via YoWASP Yosys
export function validateVerilog(verilogCode, onProgress, options = {}) {
    return runWorkerTask('lint', verilogCode, onProgress, options)
}
