import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const { showMessage } = vi.hoisted(() => ({ showMessage: vi.fn() }))
vi.mock('#/simulator/src/utils', () => ({ showMessage, escapeHtml: (value: string) => value }))
vi.mock('#/simulator/src/engine', () => ({ play: vi.fn() }))
vi.mock('#/simulator/src/sequential', () => ({ changeClockEnable: vi.fn() }))
vi.mock('#/utils/confirm', () => ({ confirmOption: vi.fn() }))

import { useTestBenchStore } from '#/store/testBenchStore'

describe('runTestBench validation', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        showMessage.mockClear()
    })

    it('does not open the testbench UI when the circuit is missing required I/O', () => {
        const invalidData = {
            type: 'comb',
            title: 'Missing I/O circuit',
            groups: [{
                label: 'Group 1',
                inputs: [{ label: 'A', bitWidth: 1, values: ['0'] }],
                outputs: [{ label: 'Y', bitWidth: 1, values: ['0'] }],
                n: 1,
            }],
        }

        const scope = { Input: [], Output: [] }
        window.globalScope = scope
        const store = useTestBenchStore()
        store.showTestBenchCreator = true
        store.sendData(invalidData)

        expect(showMessage).toHaveBeenCalledWith(
            'Testbench: Some elements missing from circuit. Click Validate to know more',
        )
        expect(store.showTestbenchUI).toBe(false)
        expect(store.showTestBenchCreator).toBe(true)
    })

    it('opens the testbench UI and closes the creator for valid circuit I/O', () => {
        const validData = {
            type: 'comb',
            title: 'Valid circuit',
            groups: [{
                label: 'Group 1',
                inputs: [{ label: 'A', bitWidth: 1, values: ['0'] }],
                outputs: [{ label: 'Y', bitWidth: 1, values: ['0'] }],
                n: 1,
            }],
        }
        window.globalScope = {
            Input: [{ label: 'A', bitWidth: 1 }],
            Output: [{ label: 'Y', bitWidth: 1 }],
        }
        const store = useTestBenchStore()
        store.showTestBenchCreator = true

        store.sendData(validData)

        expect(showMessage).not.toHaveBeenCalled()
        expect(store.showTestbenchUI).toBe(true)
        expect(store.showTestBenchCreator).toBe(false)
    })
})
