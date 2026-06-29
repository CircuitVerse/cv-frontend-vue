// Client-side synthesis — spawns a web worker for YoWASP Yosys

var worker = null
var requestId = 0

export function synthesizeVerilog(verilogCode, onProgress) {
    return new Promise((resolve, reject) => {
        if (!worker) {
            try {
                worker = new Worker(new URL('./synthesisWorker.js', import.meta.url), { type: 'module' })
            } catch (err) {
                reject(new Error('Failed to create synthesis worker: ' + err.message))
                return
            }
        }

        var id = ++requestId

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
            worker.terminate()
            worker = null
            reject(new Error('Synthesis worker error: ' + (err.message || 'Unknown error')))
        }

        function cleanup() {
            worker.removeEventListener('message', handleMessage)
            worker.removeEventListener('error', handleError)
        }

        worker.addEventListener('message', handleMessage)
        worker.addEventListener('error', handleError)

        try {
            worker.postMessage({ type: 'synthesize', code: verilogCode, id: id })
        } catch (err) {
            cleanup()
            reject(new Error('Failed to send code to synthesis worker: ' + err.message))
        }
    })
}
