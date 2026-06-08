import { describe, test, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSynthesisStore } from '../../store/synthesisStore'

describe('synthesisStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
    })

    test('starts with empty messages', () => {
        const store = useSynthesisStore()
        expect(store.messages).toEqual([])
    })

    test('addMessage pushes a message with correct text and type', () => {
        const store = useSynthesisStore()
        store.addMessage('Compiling...', 'info')

        expect(store.messages).toHaveLength(1)
        expect(store.messages[0].text).toBe('Compiling...')
        expect(store.messages[0].type).toBe('info')
    })

    test('addMessage defaults type to info', () => {
        const store = useSynthesisStore()
        store.addMessage('Default type test')

        expect(store.messages[0].type).toBe('info')
    })

    test('addMessage attaches a timestamp', () => {
        const store = useSynthesisStore()
        const before = new Date()
        store.addMessage('Timestamped', 'success')
        const after = new Date()

        expect(store.messages[0].timestamp).toBeInstanceOf(Date)
        expect(store.messages[0].timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime())
        expect(store.messages[0].timestamp.getTime()).toBeLessThanOrEqual(after.getTime())
    })

    test('addMessage supports all message types', () => {
        const store = useSynthesisStore()
        store.addMessage('Info message', 'info')
        store.addMessage('Error message', 'error')
        store.addMessage('Success message', 'success')

        expect(store.messages[0].type).toBe('info')
        expect(store.messages[1].type).toBe('error')
        expect(store.messages[2].type).toBe('success')
    })

    test('addMessage accumulates multiple messages in order', () => {
        const store = useSynthesisStore()
        store.addMessage('First', 'info')
        store.addMessage('Second', 'error')
        store.addMessage('Third', 'success')

        expect(store.messages).toHaveLength(3)
        expect(store.messages[0].text).toBe('First')
        expect(store.messages[1].text).toBe('Second')
        expect(store.messages[2].text).toBe('Third')
    })

    test('clearMessages removes all messages', () => {
        const store = useSynthesisStore()
        store.addMessage('One', 'info')
        store.addMessage('Two', 'error')
        expect(store.messages).toHaveLength(2)

        store.clearMessages()
        expect(store.messages).toHaveLength(0)
    })

    test('clearMessages on empty store does not throw', () => {
        const store = useSynthesisStore()
        expect(() => store.clearMessages()).not.toThrow()
        expect(store.messages).toHaveLength(0)
    })

    test('addMessage works after clearMessages', () => {
        const store = useSynthesisStore()
        store.addMessage('Before clear', 'info')
        store.clearMessages()
        store.addMessage('After clear', 'success')

        expect(store.messages).toHaveLength(1)
        expect(store.messages[0].text).toBe('After clear')
    })
})
