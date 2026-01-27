import { describe, it, expect, vi } from 'vitest'
import { debounce } from '../src/utils/debounce'

describe('debounce utility', () => {
    it('should debounce function calls', () => {
        vi.useFakeTimers()
        const func = vi.fn()
        const debouncedFunc = debounce(func, 100)

        debouncedFunc()
        debouncedFunc()
        debouncedFunc()

        expect(func).not.toHaveBeenCalled()

        vi.advanceTimersByTime(50)
        expect(func).not.toHaveBeenCalled()

        vi.advanceTimersByTime(50)
        expect(func).toHaveBeenCalledTimes(1)

        vi.useRealTimers()
    })

    it('should use the latest arguments', () => {
        vi.useFakeTimers()
        const func = vi.fn()
        const debouncedFunc = debounce(func, 100)

        debouncedFunc('first')
        debouncedFunc('second')
        debouncedFunc('third')

        vi.advanceTimersByTime(100)
        expect(func).toHaveBeenCalledWith('third')

        vi.useRealTimers()
    })
})
