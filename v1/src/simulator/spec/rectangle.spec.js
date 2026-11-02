import { describe, test, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { setup } from '../src/setup'
import { newCircuit } from '../src/circuit'
import Rectangle from '../src/modules/Rectangle'
import { simulationArea } from '../src/simulationArea'
import * as backupCircuit from '../src/data/backupCircuit'

vi.mock('codemirror', async (importOriginal) => {
    const actual = await importOriginal()
    return {
        ...actual,
        fromTextArea: vi.fn(() => ({ setValue: () => {} })),
    }
})

vi.mock('codemirror-editor-vue3', () => ({
    defineSimpleMode: vi.fn(),
}))

vi.mock('../src/data/backupCircuit', () => ({
    scheduleBackup: vi.fn(),
}))

describe('Rectangle annotation tests (v1)', () => {
    let pinia
    let scope
    let canvas

    beforeEach(() => {
        vi.clearAllMocks()
        pinia = createPinia()
        setActivePinia(pinia)
        scope = newCircuit('TestScope')
        window.embed = false

        canvas = document.createElement('canvas')
        canvas.id = 'simulationArea'
        document.body.appendChild(canvas)
        simulationArea.canvas = canvas

        simulationArea.ox = 0
        simulationArea.oy = 0
        simulationArea.scale = 1
        globalScope.ox = 0
        globalScope.oy = 0
        globalScope.scale = 1
    })

    test('initializes with default and custom rows/cols', () => {
        const rect = new Rectangle(100, 100, scope, 15, 20)
        expect(rect.x).toBe(100)
        expect(rect.y).toBe(100)
        expect(rect.rows).toBe(15)
        expect(rect.cols).toBe(20)
        expect(rect.elementWidth).toBe(200)
        expect(rect.elementHeight).toBe(150)
    })

    test('resizing computes from session coordinates and ignores stale simulationArea.mouseX/mouseY (no snap-back)', () => {
        const rect = new Rectangle(100, 100, scope, 15, 20)
        simulationArea.lastSelected = rect

        // Start resize from bottom-right handle at (300, 250)
        rect.startResize('bottom-right', 1, { x: 300, y: 250, xf: 300, yf: 250 })
        expect(rect.resizing).toBe(true)
        expect(rect.resizeSession).not.toBeNull()

        // Simulate pointermove updating session latestCoords to (400, 350)
        rect.resizeSession.latestCoords = { x: 400, y: 350, xf: 400, yf: 350 }

        // Deliberately set simulationArea.mouseX / mouseY to the stale press position
        simulationArea.mouseX = 300
        simulationArea.mouseY = 250

        // Call resize() with no arguments
        rect.resize()
        expect(rect.cols).toBe(30) // (400 - 100) / 10 = 30
        expect(rect.rows).toBe(25) // (350 - 100) / 10 = 25

        // Call update() and resize() with no arguments; size must remain at the new session size without snap-back
        rect.update()
        expect(rect.cols).toBe(30)
        expect(rect.rows).toBe(25)

        rect.resize()
        expect(rect.cols).toBe(30)
        expect(rect.rows).toBe(25)
    })

    test('stopResize() calls scheduleBackup once when size changed, and not when size did not change', () => {
        const rect = new Rectangle(100, 100, scope, 15, 20)
        simulationArea.lastSelected = rect

        // Gesture 1: Drag to change size
        rect.startResize('bottom-right', 1, { x: 300, y: 250, xf: 300, yf: 250 })
        rect.resizeSession.latestCoords = { x: 350, y: 300, xf: 350, yf: 300 }
        rect.resize()

        rect.stopResize()
        expect(backupCircuit.scheduleBackup).toHaveBeenCalledTimes(1)
        expect(rect.resizing).toBe(false)
        expect(rect.resizeSession).toBeNull()

        backupCircuit.scheduleBackup.mockClear()

        // Gesture 2: Click on handle without moving (no size change)
        rect.startResize('bottom-right', 1, { x: 350, y: 300, xf: 350, yf: 300 })
        rect.stopResize()
        expect(backupCircuit.scheduleBackup).not.toHaveBeenCalled()
        expect(rect.resizing).toBe(false)
        expect(rect.resizeSession).toBeNull()
    })

    test('resizing is disabled in embed mode', () => {
        window.embed = true
        const rect = new Rectangle(100, 100, scope, 15, 20)
        simulationArea.lastSelected = rect

        rect.startResize('bottom-right', 1, { x: 300, y: 250, xf: 300, yf: 250 })
        expect(rect.resizing).toBe(false)
        expect(rect.resizeSession).toBeNull()
        expect(rect.getHandleAt(300, 250)).toBeNull()
    })

    test('calling resize() when no session is active is a safe no-op', () => {
        const rect = new Rectangle(100, 100, scope, 15, 20)
        expect(() => rect.resize()).not.toThrow()
        expect(rect.cols).toBe(20)
        expect(rect.rows).toBe(15)
    })

    test('onPointerMove updates session coords for matching pointerId and ignores different pointerId', () => {
        const rect = new Rectangle(100, 100, scope, 15, 20)
        simulationArea.lastSelected = rect

        rect.startResize('bottom-right', 42, { x: 300, y: 250, xf: 300, yf: 250 })
        expect(rect.resizing).toBe(true)

        // Pointer move event with different pointerId is ignored
        const diffPointerEvent = {
            pointerId: 999,
            clientX: 500,
            clientY: 500,
        }
        rect.onPointerMove(diffPointerEvent)
        expect(rect.resizeSession.latestCoords.x).toBe(300)
        expect(rect.resizeSession.latestCoords.y).toBe(250)

        // Pointer move event with matching pointerId updates latestCoords
        const matchingPointerEvent = {
            pointerId: 42,
            clientX: 400,
            clientY: 350,
        }
        rect.onPointerMove(matchingPointerEvent)
        expect(rect.resizeSession.latestCoords.x).toBe(400)
        expect(rect.resizeSession.latestCoords.y).toBe(350)
    })

    test('lostpointercapture ends active resize, is ignored for different pointerId, and does nothing when no resize active', () => {
        const rect = new Rectangle(100, 100, scope, 15, 20)
        simulationArea.lastSelected = rect

        rect.startResize('bottom-right', 1, { x: 300, y: 250, xf: 300, yf: 250 })
        expect(rect.resizing).toBe(true)

        rect.onLostPointerCapture()
        expect(rect.resizing).toBe(false)
        expect(rect.resizeSession).toBeNull()
    })
    test('onPointerUp ignores different pointerId, ends resize on matching pointerId, and handles missing/null pointerId', () => {
        const rect = new Rectangle(100, 100, scope, 15, 20)
        simulationArea.lastSelected = rect

        // Start resize with activePointerId = 42
        rect.startResize('bottom-right', 42, { x: 300, y: 250, xf: 300, yf: 250 })
        expect(rect.resizing).toBe(true)

        // Event from another pointerId does not end resize
        rect.onPointerUp({ pointerId: 999 })
        expect(rect.resizing).toBe(true)
        expect(rect.resizeSession).not.toBeNull()

        // Event from active pointer ends resize
        rect.onPointerUp({ pointerId: 42 })
        expect(rect.resizing).toBe(false)
        expect(rect.resizeSession).toBeNull()

        // Event with missing pointerId or null/undefined behaves as before (ends resize)
        rect.startResize('bottom-right', 42, { x: 300, y: 250, xf: 300, yf: 250 })
        expect(rect.resizing).toBe(true)
        rect.onPointerUp({})
        expect(rect.resizing).toBe(false)

        // Calling onPointerUp with no arguments behaves as before (ends resize)
        rect.startResize('bottom-right', null, { x: 300, y: 250, xf: 300, yf: 250 })
        expect(rect.resizing).toBe(true)
        rect.onPointerUp()
        expect(rect.resizing).toBe(false)
    })

    test('pointerup followed by lostpointercapture still calls scheduleBackup exactly once', () => {
        const rect = new Rectangle(100, 100, scope, 15, 20)
        simulationArea.lastSelected = rect

        rect.startResize('bottom-right', 42, { x: 300, y: 250, xf: 300, yf: 250 })
        // Move to change dimensions
        rect.resizeSession.latestCoords = { x: 400, y: 350, xf: 400, yf: 350 }
        rect.resize()

        backupCircuit.scheduleBackup.mockClear()

        // Pointer up from active pointer terminates session and triggers backup
        rect.onPointerUp({ pointerId: 42 })
        expect(backupCircuit.scheduleBackup).toHaveBeenCalledTimes(1)
        expect(rect.resizing).toBe(false)

        // Subsequent lostpointercapture event must be idempotent and not schedule a second backup
        rect.onLostPointerCapture()
        expect(backupCircuit.scheduleBackup).toHaveBeenCalledTimes(1)
    })
})
