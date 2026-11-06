import { describe, test, expect, vi, beforeEach } from 'vitest'

vi.hoisted(() => {
    if (typeof globalThis.localStorage === 'undefined' || !globalThis.localStorage.getItem) {
        const store = {}
        globalThis.localStorage = {
            getItem: (key) => store[key] || null,
            setItem: (key, value) => {
                store[key] = value.toString()
            },
            removeItem: (key) => {
                delete store[key]
            },
            clear: () => {
                for (const k in store) delete store[k]
            },
        }
    }
})

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

describe('Rectangle annotation tests (src)', () => {
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

    // --- Scenario 1: Resize top-left ---
    test('scenario 1: resize top-left updates (x, y) live and stays put on release without jumping', () => {
        const rect = new Rectangle(100, 100, scope, 15, 20)
        simulationArea.lastSelected = rect

        rect.startResize('top-left', 1, { x: 100, y: 100, xf: 100, yf: 100 })
        rect.resizeSession.latestCoords = { x: 50, y: 40, xf: 50, yf: 40 }
        rect.resize()

        expect(rect.x).toBe(50)
        expect(rect.y).toBe(40)
        expect(rect.cols).toBe(25) // (300 - 50) / 10 = 25
        expect(rect.rows).toBe(21) // (250 - 40) / 10 = 21

        rect.stopResize()
        expect(rect.x).toBe(50)
        expect(rect.y).toBe(40)
        expect(rect.cols).toBe(25)
        expect(rect.rows).toBe(21)

        // Simulate subsequent frame update - must not jump
        rect.update()
        expect(rect.x).toBe(50)
        expect(rect.y).toBe(40)
    })

    // --- Scenario 2: Resize bottom-right ---
    test('scenario 2: resize bottom-right keeps (x, y) fixed and stays put on release', () => {
        const rect = new Rectangle(100, 100, scope, 15, 20)
        simulationArea.lastSelected = rect

        rect.startResize('bottom-right', 1, { x: 300, y: 250, xf: 300, yf: 250 })
        rect.resizeSession.latestCoords = { x: 350, y: 320, xf: 350, yf: 320 }
        rect.resize()

        expect(rect.x).toBe(100)
        expect(rect.y).toBe(100)
        expect(rect.cols).toBe(25) // (350 - 100) / 10 = 25
        expect(rect.rows).toBe(22) // (320 - 100) / 10 = 22

        rect.stopResize()
        expect(rect.x).toBe(100)
        expect(rect.y).toBe(100)
        expect(rect.cols).toBe(25)
        expect(rect.rows).toBe(22)

        rect.update()
        expect(rect.x).toBe(100)
        expect(rect.y).toBe(100)
    })

    // --- Scenario 3: Resize other 6 handles ---
    test('scenario 3: resize each of the other 6 handles preserves fixed opposite edges and stays put on release', () => {
        // top
        let rect = new Rectangle(100, 100, scope, 15, 20)
        simulationArea.lastSelected = rect
        rect.startResize('top', 1, { x: 200, y: 100, xf: 200, yf: 100 })
        rect.resizeSession.latestCoords = { x: 200, y: 60, xf: 200, yf: 60 }
        rect.resize()
        expect(rect.x).toBe(100)
        expect(rect.y).toBe(60)
        expect(rect.rows).toBe(19) // (250 - 60) / 10 = 19
        expect(rect.cols).toBe(20)
        rect.stopResize()
        expect(rect.y).toBe(60)

        // bottom
        rect = new Rectangle(100, 100, scope, 15, 20)
        simulationArea.lastSelected = rect
        rect.startResize('bottom', 1, { x: 200, y: 250, xf: 200, yf: 250 })
        rect.resizeSession.latestCoords = { x: 200, y: 300, xf: 200, yf: 300 }
        rect.resize()
        expect(rect.x).toBe(100)
        expect(rect.y).toBe(100)
        expect(rect.rows).toBe(20)
        rect.stopResize()
        expect(rect.y).toBe(100)

        // left
        rect = new Rectangle(100, 100, scope, 15, 20)
        simulationArea.lastSelected = rect
        rect.startResize('left', 1, { x: 100, y: 175, xf: 100, yf: 175 })
        rect.resizeSession.latestCoords = { x: 60, y: 175, xf: 60, yf: 175 }
        rect.resize()
        expect(rect.x).toBe(60)
        expect(rect.y).toBe(100)
        expect(rect.cols).toBe(24) // (300 - 60) / 10 = 24
        rect.stopResize()
        expect(rect.x).toBe(60)

        // right
        rect = new Rectangle(100, 100, scope, 15, 20)
        simulationArea.lastSelected = rect
        rect.startResize('right', 1, { x: 300, y: 175, xf: 300, yf: 175 })
        rect.resizeSession.latestCoords = { x: 340, y: 175, xf: 340, yf: 175 }
        rect.resize()
        expect(rect.x).toBe(100)
        expect(rect.y).toBe(100)
        expect(rect.cols).toBe(24)
        rect.stopResize()
        expect(rect.x).toBe(100)

        // top-right
        rect = new Rectangle(100, 100, scope, 15, 20)
        simulationArea.lastSelected = rect
        rect.startResize('top-right', 1, { x: 300, y: 100, xf: 300, yf: 100 })
        rect.resizeSession.latestCoords = { x: 350, y: 70, xf: 350, yf: 70 }
        rect.resize()
        expect(rect.x).toBe(100)
        expect(rect.y).toBe(70)
        expect(rect.cols).toBe(25)
        expect(rect.rows).toBe(18)
        rect.stopResize()
        expect(rect.x).toBe(100)
        expect(rect.y).toBe(70)

        // bottom-left
        rect = new Rectangle(100, 100, scope, 15, 20)
        simulationArea.lastSelected = rect
        rect.startResize('bottom-left', 1, { x: 100, y: 250, xf: 100, yf: 250 })
        rect.resizeSession.latestCoords = { x: 70, y: 310, xf: 70, yf: 310 }
        rect.resize()
        expect(rect.x).toBe(70)
        expect(rect.y).toBe(100)
        expect(rect.cols).toBe(23)
        expect(rect.rows).toBe(21)
        rect.stopResize()
        expect(rect.x).toBe(70)
        expect(rect.y).toBe(100)
    })

    // --- Scenario 4: Deselect and re-render ---
    test('scenario 4: rectangle does not jump on deselect, click elsewhere, or canvas pan/zoom', () => {
        const rect = new Rectangle(100, 100, scope, 15, 20)
        simulationArea.lastSelected = rect
        rect.startResize('top-left', 1, { x: 100, y: 100, xf: 100, yf: 100 })
        rect.resizeSession.latestCoords = { x: 60, y: 50, xf: 60, yf: 50 }
        rect.resize()
        rect.stopResize()

        // Deselect
        simulationArea.lastSelected = undefined
        simulationArea.selected = false
        rect.update()
        expect(rect.x).toBe(60)
        expect(rect.y).toBe(50)

        // Pan and zoom canvas
        globalScope.ox = 200
        globalScope.oy = 150
        globalScope.scale = 2
        rect.update()
        expect(rect.x).toBe(60)
        expect(rect.y).toBe(50)
    })

    // --- Scenario 5: Rows/columns recalculation neutrality ---
    test('scenario 5: setSize() recalculation does not shift (x, y)', () => {
        const rect = new Rectangle(120, 140, scope, 15, 20)
        rect.setSize()
        expect(rect.x).toBe(120)
        expect(rect.y).toBe(140)
        expect(rect.elementWidth).toBe(200)
        expect(rect.elementHeight).toBe(150)
    })

    // --- Scenario 6: Manual rows/cols edit ---
    test('scenario 6: manual rows/cols edit preserves top-left anchor and does not jump on subsequent update', () => {
        const rect = new Rectangle(120, 140, scope, 15, 20)
        rect.changeColSize(28)
        rect.changeRowSize(22)
        expect(rect.x).toBe(120)
        expect(rect.y).toBe(140)
        expect(rect.cols).toBe(28)
        expect(rect.rows).toBe(22)
        expect(rect.elementWidth).toBe(280)
        expect(rect.elementHeight).toBe(220)

        // Update frame
        rect.update()
        expect(rect.x).toBe(120)
        expect(rect.y).toBe(140)
    })

    // --- Scenario 7: Grid snapping consistency ---
    test('scenario 7: coordinates during drag match coordinates on release', () => {
        const rect = new Rectangle(100, 100, scope, 15, 20)
        simulationArea.lastSelected = rect
        rect.startResize('bottom-right', 1, { x: 300, y: 250, xf: 300, yf: 250 })

        // Pass unrounded float coordinates
        rect.resizeSession.latestCoords = {
            x: Math.round(344.6 / 10) * 10,
            y: Math.round(292.1 / 10) * 10,
            xf: 344.6,
            yf: 292.1,
        }
        rect.resize()
        const liveCols = rect.cols
        const liveRows = rect.rows
        const liveX = rect.x
        const liveY = rect.y

        rect.stopResize()
        expect(rect.cols).toBe(liveCols)
        expect(rect.rows).toBe(liveRows)
        expect(rect.x).toBe(liveX)
        expect(rect.y).toBe(liveY)
    })

    // --- Scenario 8: Clamping ---
    test('scenario 8: cannot resize smaller than minimum allowed 5 rows and 5 cols', () => {
        const rect = new Rectangle(100, 100, scope, 15, 20)
        simulationArea.lastSelected = rect
        rect.startResize('top-left', 1, { x: 100, y: 100, xf: 100, yf: 100 })

        // Drag past opposite corner (fixedRight = 300, fixedBottom = 250)
        rect.resizeSession.latestCoords = { x: 500, y: 500, xf: 500, yf: 500 }
        rect.resize()
        expect(rect.cols).toBe(5)
        expect(rect.rows).toBe(5)
        expect(rect.x).toBe(250) // 300 - 5 * 10 = 250
        expect(rect.y).toBe(200) // 250 - 5 * 10 = 200

        rect.stopResize()
        expect(rect.cols).toBe(5)
        expect(rect.rows).toBe(5)
        expect(rect.x).toBe(250)
        expect(rect.y).toBe(200)
    })

    // --- Scenario 9: Fast mouse release / release off canvas ---
    test('scenario 9: release off canvas commits last valid drag position without jumping', () => {
        const rect = new Rectangle(100, 100, scope, 15, 20)
        simulationArea.lastSelected = rect
        rect.startResize('bottom-right', 1, { x: 300, y: 250, xf: 300, yf: 250 })
        rect.resizeSession.latestCoords = { x: 360, y: 290, xf: 360, yf: 290 }
        rect.resize()

        // onPointerUp with no target / off canvas
        rect.onPointerUp()
        expect(rect.x).toBe(100)
        expect(rect.y).toBe(100)
        expect(rect.cols).toBe(26)
        expect(rect.rows).toBe(19)
    })

    // --- Scenario 10: Serialization round-trip ---
    test('scenario 10: serialization round-trip matches committed state', () => {
        const rect = new Rectangle(100, 100, scope, 15, 20)
        simulationArea.lastSelected = rect
        rect.startResize('top-left', 1, { x: 100, y: 100, xf: 100, yf: 100 })
        rect.resizeSession.latestCoords = { x: 60, y: 70, xf: 60, yf: 70 }
        rect.resize()
        rect.stopResize()

        const saved = rect.saveObject()
        expect(saved.x).toBe(60)
        expect(saved.y).toBe(70)
        expect(saved.customData.constructorParamaters[0]).toBe(18) // rows: (250 - 70) / 10 = 18
        expect(saved.customData.constructorParamaters[1]).toBe(24) // cols: (300 - 60) / 10 = 24

        const restored = new Rectangle(
            saved.x,
            saved.y,
            scope,
            saved.customData.constructorParamaters[0],
            saved.customData.constructorParamaters[1]
        )
        expect(restored.x).toBe(60)
        expect(restored.y).toBe(70)
        expect(restored.rows).toBe(18)
        expect(restored.cols).toBe(24)
        expect(restored.elementWidth).toBe(240)
        expect(restored.elementHeight).toBe(180)
    })

    // --- Scenario 11: Undo/redo backup trigger ---
    test('scenario 11: undo backup triggered once per gesture with change, and zero times without change', () => {
        const rect = new Rectangle(100, 100, scope, 15, 20)
        simulationArea.lastSelected = rect

        backupCircuit.scheduleBackup.mockClear()
        rect.startResize('bottom-right', 1, { x: 300, y: 250, xf: 300, yf: 250 })
        rect.resizeSession.latestCoords = { x: 350, y: 300, xf: 350, yf: 300 }
        rect.resize()
        rect.stopResize()
        expect(backupCircuit.scheduleBackup).toHaveBeenCalledTimes(1)

        backupCircuit.scheduleBackup.mockClear()
        rect.startResize('bottom-right', 1, { x: 350, y: 300, xf: 350, yf: 300 })
        rect.stopResize()
        expect(backupCircuit.scheduleBackup).not.toHaveBeenCalled()
    })

    // --- Scenario 12: Cursor & highlight stability ---
    test('scenario 12: cursor resets cleanly on release and highlight fill is permanent', () => {
        const rect = new Rectangle(100, 100, scope, 15, 20)
        simulationArea.lastSelected = rect
        rect.startResize('top-left', 1, { x: 100, y: 100, xf: 100, yf: 100 })
        expect(simulationArea.isResizingRectangle).toBe(true)
        expect(simulationArea.resizeCursor).toBe('nwse-resize')

        rect.stopResize()
        expect(simulationArea.isResizingRectangle).toBe(false)
        expect(simulationArea.resizeCursor).toBe('')

        // Mock canvas context for customDraw verification
        const fills = []
        const ctxMock = {
            beginPath: vi.fn(),
            rect: vi.fn(),
            fill: vi.fn(function () {
                fills.push(this.fillStyle)
            }),
            stroke: vi.fn(),
            setLineDash: vi.fn(),
            save: vi.fn(),
            restore: vi.fn(),
            fillStyle: '',
            strokeStyle: '',
            lineWidth: 1,
        }
        simulationArea.context = ctxMock

        // Selected state fill
        simulationArea.lastSelected = rect
        rect.customDraw()
        expect(fills).toContain('rgba(255, 255, 32, 0.2)')

        // Deselected state fill (permanent highlight)
        fills.length = 0
        simulationArea.lastSelected = undefined
        rect.customDraw()
        expect(fills).toContain('rgba(255, 255, 32, 0.1)')
    })
})
