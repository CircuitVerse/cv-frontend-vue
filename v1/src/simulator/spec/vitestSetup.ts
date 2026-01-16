import { vi, beforeAll, afterAll } from 'vitest'

declare global {
    interface Window {
        jQuery: any
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
// @ts-ignore
global.$ = require('jquery')
global.DPR = true
global.width = true
global.height = true

window.jQuery = require('jquery')
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
    vi.clearAllTimers()
    vi.useRealTimers()
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
const shouldSuppressError = (
    error: Error | any,
    isTearingDown: boolean
): boolean => {
    if (!isTearingDown) return false
    const errorMessage = error?.message || String(error)
    return suppressedPatterns.some(
        (pattern) =>
            errorMessage.includes(pattern) || error?.stack?.includes(pattern)
    )
}

let isTearingDown = false

// Handle unhandled rejections
const handleUnhandledRejection = (reason: any) => {
    if (shouldSuppressError(reason, isTearingDown)) {
        return
    }
    throw reason
}

// Handle uncaught exceptions
const handleUncaughtException = (error: Error) => {
    if (shouldSuppressError(error, isTearingDown)) {
        return
    }
    throw error
}

// Register error handlers
beforeAll(() => {
    process.on('unhandledRejection', handleUnhandledRejection)
    process.on('uncaughtException', handleUncaughtException)
})

// Unregister error handlers and suppress expected teardown errors
afterAll(() => {
    isTearingDown = true
    process.off('unhandledRejection', handleUnhandledRejection)
    process.off('uncaughtException', handleUncaughtException)
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.clearAllMocks()
    vi.restoreAllMocks()
})
