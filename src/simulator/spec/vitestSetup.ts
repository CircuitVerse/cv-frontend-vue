import { vi, beforeAll, afterAll } from 'vitest'

declare global {
    interface Window {
        Jquery: any
        $: any
        restrictedElements: any[]
        userSignedIn: boolean
        embed: boolean
    }
    var DPR: any
    var width: any
    var height: any
}

global.window = window
// @ts-ignore
global.jQuery = require('jquery')
global.DPR = true
global.width = true
global.height = true

window.Jquery = require('jquery')
window.$ = require('jquery')
window.restrictedElements = []
window.userSignedIn = true
window.embed = false

// Use fake timers throughout tests to prevent real VImg timeouts from firing
beforeAll(() => {
    vi.useFakeTimers()
})

// Restore real timers and cleanup after all tests
afterAll(() => {
    vi.useRealTimers()
    vi.clearAllTimers()
    vi.clearAllMocks()
    vi.restoreAllMocks()
})

// Patterns for errors that should be suppressed during teardown
const suppressedPatterns = [
    'window is not defined',
    'document is not defined',
    'simulationArea.context.rect is not a function',
    'ResizeObserver',
    'not implemented',
    'Failed to parse URL',
]

// Check if error should be suppressed
const shouldSuppressError = (error: Error | any): boolean => {
    const errorMessage = error?.message || String(error)
    return suppressedPatterns.some(
        (pattern) =>
            errorMessage.includes(pattern) || error?.stack?.includes(pattern)
    )
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason) => {
    if (shouldSuppressError(reason)) {
        return
    }
    throw reason
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    if (shouldSuppressError(error)) {
        return
    }
    throw error
})
