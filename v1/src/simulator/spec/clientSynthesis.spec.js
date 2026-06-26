// Tests for the synthesis timeout guard in clientSynthesis.js.


import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'

class MockWorker {
    constructor() {
        this._listeners = { message: [], error: [] }
        this.postMessage = vi.fn()
        this.terminate = vi.fn()
    }

    addEventListener(type, fn) {
        this._listeners[type] = this._listeners[type] || []
        this._listeners[type].push(fn)
    }

    removeEventListener(type, fn) {
        if (!this._listeners[type]) return
        this._listeners[type] = this._listeners[type].filter((f) => f !== fn)
    }

    // Test helper: simulate the worker posting a message back
    _postBack(data) {
        for (const fn of this._listeners.message || []) {
            fn({ data })
        }
    }

    // Test helper: simulate an unrecoverable worker error
    _fireError(err) {
        for (const fn of this._listeners.error || []) {
            fn(err)
        }
    }
}

// Test suite

describe('synthesizeVerilog timeout guard', () => {
    let synthesizeVerilog
    let mockWorkerInstance

    beforeEach(async () => {
        vi.useFakeTimers()

        vi.resetModules()

        mockWorkerInstance = null
        vi.stubGlobal('Worker', class extends MockWorker {
            constructor(...args) {
                super(...args)
                mockWorkerInstance = this
            }
        })

        const mod = await import('../src/synthesis/clientSynthesis.js')
        synthesizeVerilog = mod.synthesizeVerilog
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.unstubAllGlobals()
    })

    //  Happy path

    test('resolves when the worker returns a result before the timeout', async () => {
        const circuitData = { name: 'test', devices: {}, connectors: [] }

        const promise = synthesizeVerilog('module m; endmodule', null, { timeoutMs: 5000 })

        expect(mockWorkerInstance).not.toBeNull()
        expect(mockWorkerInstance.postMessage).toHaveBeenCalledWith({
            type: 'synthesize',
            code: 'module m; endmodule',
            id: expect.any(Number),
        })

        const sentId = mockWorkerInstance.postMessage.mock.calls[0][0].id
        mockWorkerInstance._postBack({ type: 'result', data: circuitData, id: sentId })

        const result = await promise
        expect(result).toEqual(circuitData)

        vi.advanceTimersByTime(10000)
        expect(mockWorkerInstance.terminate).not.toHaveBeenCalled()
    })

    //  Worker error path

    test('rejects when the worker posts an error message', async () => {
        const promise = synthesizeVerilog('bad code', null, { timeoutMs: 5000 })

        const sentId = mockWorkerInstance.postMessage.mock.calls[0][0].id
        mockWorkerInstance._postBack({ type: 'error', message: 'Parse error', id: sentId })

        await expect(promise).rejects.toThrow('Parse error')
        expect(mockWorkerInstance.terminate).not.toHaveBeenCalled()
    })

    //  Timeout path

    test('rejects with SynthesisTimeoutError when the worker does not respond in time', async () => {
        const promise = synthesizeVerilog('module hang; endmodule', null, { timeoutMs: 100 })

        vi.advanceTimersByTime(150)

        await expect(promise).rejects.toThrow('Verilog synthesis timed out after 0.1 seconds')

        try {
            await promise
        } catch (err) {
            expect(err.name).toBe('SynthesisTimeoutError')
        }
    })

    test('terminates the worker on timeout', async () => {
        const promise = synthesizeVerilog('module slow; endmodule', null, { timeoutMs: 100 })

        vi.advanceTimersByTime(150)

        await expect(promise).rejects.toThrow()
        expect(mockWorkerInstance.terminate).toHaveBeenCalled()
    })

    test('creates a fresh worker after a timeout on the next call', async () => {
        const promise1 = synthesizeVerilog('module first; endmodule', null, { timeoutMs: 100 })
        const firstWorker = mockWorkerInstance

        vi.advanceTimersByTime(150)
        await expect(promise1).rejects.toThrow()

        const promise2 = synthesizeVerilog('module second; endmodule', null, { timeoutMs: 5000 })
        const secondWorker = mockWorkerInstance

        expect(secondWorker).not.toBe(firstWorker)

        const sentId = secondWorker.postMessage.mock.calls[0][0].id
        secondWorker._postBack({ type: 'result', data: { name: 'ok' }, id: sentId })

        const result = await promise2
        expect(result).toEqual({ name: 'ok' })
    })

    //  Progress callback

    test('forwards progress messages to the onProgress callback', async () => {
        const onProgress = vi.fn()
        const promise = synthesizeVerilog('module m; endmodule', onProgress, { timeoutMs: 5000 })

        const sentId = mockWorkerInstance.postMessage.mock.calls[0][0].id

        mockWorkerInstance._postBack({ type: 'progress', message: 'Loading WASM...', id: sentId })
        mockWorkerInstance._postBack({ type: 'progress', message: 'Running Yosys...', id: sentId })
        mockWorkerInstance._postBack({ type: 'result', data: {}, id: sentId })

        await promise

        expect(onProgress).toHaveBeenCalledTimes(2)
        expect(onProgress).toHaveBeenCalledWith('Loading WASM...')
        expect(onProgress).toHaveBeenCalledWith('Running Yosys...')
    })

    //  Default timeout

    test('uses 30000ms as the default timeout when no option is provided', async () => {
        const promise = synthesizeVerilog('module m; endmodule')

        vi.advanceTimersByTime(29999)

        const sentId = mockWorkerInstance.postMessage.mock.calls[0][0].id
        mockWorkerInstance._postBack({ type: 'result', data: { name: 'done' }, id: sentId })

        const result = await promise
        expect(result).toEqual({ name: 'done' })
    })

    test('rejects at 30000ms default timeout when no option is provided', async () => {
        const promise = synthesizeVerilog('module m; endmodule')

        vi.advanceTimersByTime(30000)

        await expect(promise).rejects.toThrow('Verilog synthesis timed out after 30 seconds')
    })
})
