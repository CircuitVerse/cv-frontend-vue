import CircuitElement from '../circuitElement'
import { simulationArea } from '../simulationArea'
import { correctWidth, rect } from '../canvasApi'
import { updateCanvasSet, scheduleUpdate } from '../engine'
import { scheduleBackup } from '../data/backupCircuit'

/**
 * Global canvas pointerdown dispatcher.
 * Tracks the specific canvas element it is attached to.
 * When the simulator remounts and simulationArea.setup() assigns a new canvas,
 * ensureCanvasDispatcher() detects the mismatch, removes the old listener,
 * and attaches to the new canvas — preventing ghost listeners and missing dispatchers.
 * Resizing is disabled in embed mode.
 * @param {PointerEvent} e - Pointerdown event on canvas
 */
let attachedCanvas = null

function handleCanvasPointerDown(e) {
    if (typeof embed !== 'undefined' && embed) return
    if (e.button !== 0) return
    const selected = simulationArea.lastSelected
    if (!selected || !(selected instanceof Rectangle)) return
    if (selected.scope !== globalScope || selected.newElement) return

    const coords = selected.getEventCoordinates(e)
    const handle = selected.getHandleAt(coords.xf, coords.yf)
    if (handle) {
        if (e.target && e.target.setPointerCapture && e.pointerId !== undefined) {
            try {
                e.target.setPointerCapture(e.pointerId)
            } catch (err) {
                // Ignore capture errors on unsupported pointers
            }
        }
        selected.startResize(handle, e.pointerId, coords)
        e.stopPropagation()
        e.preventDefault()
    }
}

/**
 * Ensures the single canvas pointerdown dispatcher is attached to the current canvas.
 * Compares the stored canvas reference with the current one. When they differ
 * (e.g. after simulator remount and simulationArea.setup() replacing the element),
 * removes the listener from the old canvas and attaches it to the new one.
 */
function ensureCanvasDispatcher() {
    const canvas = simulationArea.canvas || document.getElementById('simulationArea')
    if (!canvas) return
    if (canvas === attachedCanvas) return

    // Canvas has changed (remount) — remove stale listener from old canvas
    if (attachedCanvas) {
        attachedCanvas.removeEventListener('pointerdown', handleCanvasPointerDown)
    }

    canvas.addEventListener('pointerdown', handleCanvasPointerDown)
    attachedCanvas = canvas
}

/**
 * @class
 * Rectangle
 * @extends CircuitElement
 * @param {number} x - x coordinate of element.
 * @param {number} y - y coordinate of element.
 * @param {Scope=} scope - Circuit on which element is drawn
 * @param {number=} rows - number of rows
 * @param {number=} cols - number of columns.
 * @category modules
 */
export default class Rectangle extends CircuitElement {
    constructor(x, y, scope = globalScope, rows = 15, cols = 20) {
        super(x, y, scope, 'RIGHT', 1)
        this.directionFixed = true
        this.fixedBitWidth = true
        this.rectangleObject = false
        this.cols = cols || parseInt(prompt('Enter cols:'), 10) || 20
        this.rows = rows || parseInt(prompt('Enter rows:'), 10) || 15
        this.setSize()

        // Resizing state
        this.resizing = false
        this.activeHandle = null
        this.activePointerId = null
        this.resizeSession = null

        // Bound listener references for active resize session only
        this.onPointerMove = this.onPointerMove.bind(this)
        this.onPointerUp = this.onPointerUp.bind(this)
        this.onLostPointerCapture = this.onLostPointerCapture.bind(this)

        ensureCanvasDispatcher()
    }

    /**
     * Clean up event listeners and reset global cursor on deletion
     */
    delete() {
        if (this.resizing) {
            this.stopResize()
        }
        if (simulationArea.resizeCursor) {
            simulationArea.resizeCursor = ''
            if (simulationArea.canvas) {
                simulationArea.canvas.style.cursor = 'default'
            }
        }
        super.delete()
    }

    /**
     * Clean up event listeners and reset global cursor on clean deletion
     */
    cleanDelete() {
        if (this.resizing) {
            this.stopResize()
        }
        if (simulationArea.resizeCursor) {
            simulationArea.resizeCursor = ''
            if (simulationArea.canvas) {
                simulationArea.canvas.style.cursor = 'default'
            }
        }
        super.cleanDelete()
    }

    /**
     * Convert DOM Mouse/Pointer Event coordinates into circuit coordinates.
     * Matches the coordinate conversion in panMove() from commands/pointer.ts.
     * @param {MouseEvent|PointerEvent|TouchEvent} e - DOM event
     * @returns {{x: number, y: number, xf: number, yf: number}} Computed canvas coordinates
     */
    getEventCoordinates(e) {
        const canvas = simulationArea.canvas || document.getElementById('simulationArea')
        if (!canvas) {
            return {
                x: 0,
                y: 0,
                xf: 0,
                yf: 0,
            }
        }

        const clientX = e.clientX !== undefined
            ? e.clientX
            : (e.touches && e.touches[0] ? e.touches[0].clientX : 0)
        const clientY = e.clientY !== undefined
            ? e.clientY
            : (e.touches && e.touches[0] ? e.touches[0].clientY : 0)

        const rectBounds = canvas.getBoundingClientRect()
        const dpr = typeof DPR !== 'undefined' ? DPR : (window.DPR || window.devicePixelRatio || 1)
        const rawX = (clientX - rectBounds.left) * dpr
        const rawY = (clientY - rectBounds.top) * dpr

        const activeScope = this.scope || globalScope
        const scale = activeScope.scale || 1
        const ox = activeScope.ox !== undefined ? activeScope.ox : 0
        const oy = activeScope.oy !== undefined ? activeScope.oy : 0

        const xf = (rawX - ox) / scale
        const yf = (rawY - oy) / scale

        return {
            x: Math.round(xf / 10) * 10,
            y: Math.round(yf / 10) * 10,
            xf,
            yf,
        }
    }

    /**
     * Detect if a coordinate hits any handle or bounding edge.
     * Disabled in embed mode.
     * @param {number} mouseXf - unrounded x in world coordinates
     * @param {number} mouseYf - unrounded y in world coordinates
     * @returns {string|null} handle name or null
     */
    getHandleAt(mouseXf, mouseYf) {
        if (typeof embed !== 'undefined' && embed) return null
        if (mouseXf === undefined || mouseYf === undefined) return null

        const activeScope = this.scope || globalScope
        const scale = activeScope.scale || 1
        const xx = this.x
        const yy = this.y
        const w = this.elementWidth
        const h = this.elementHeight

        // Hit-test threshold in world units (scaled from screen pixels)
        const threshold = Math.max(8, 10 / scale)
        const cornerThreshold = threshold * 1.5

        // 1. Check 4 corners first
        if (Math.hypot(mouseXf - xx, mouseYf - yy) <= cornerThreshold) {
            return 'top-left'
        }
        if (Math.hypot(mouseXf - (xx + w), mouseYf - yy) <= cornerThreshold) {
            return 'top-right'
        }
        if (Math.hypot(mouseXf - (xx + w), mouseYf - (yy + h)) <= cornerThreshold) {
            return 'bottom-right'
        }
        if (Math.hypot(mouseXf - xx, mouseYf - (yy + h)) <= cornerThreshold) {
            return 'bottom-left'
        }

        // 2. Check 4 edges
        if (
            Math.abs(mouseYf - yy) <= threshold &&
            mouseXf >= xx - threshold &&
            mouseXf <= xx + w + threshold
        ) {
            return 'top'
        }
        if (
            Math.abs(mouseYf - (yy + h)) <= threshold &&
            mouseXf >= xx - threshold &&
            mouseXf <= xx + w + threshold
        ) {
            return 'bottom'
        }
        if (
            Math.abs(mouseXf - xx) <= threshold &&
            mouseYf >= yy - threshold &&
            mouseYf <= yy + h + threshold
        ) {
            return 'left'
        }
        if (
            Math.abs(mouseXf - (xx + w)) <= threshold &&
            mouseYf >= yy - threshold &&
            mouseYf <= yy + h + threshold
        ) {
            return 'right'
        }

        return null
    }

    /**
     * Return corresponding CSS cursor for given handle
     * @param {string} handle - Handle identifier
     * @returns {string} CSS cursor string
     */
    getCursorForHandle(handle) {
        switch (handle) {
            case 'top-left':
            case 'bottom-right':
                return 'nwse-resize'
            case 'top-right':
            case 'bottom-left':
                return 'nesw-resize'
            case 'top':
            case 'bottom':
                return 'ns-resize'
            case 'left':
            case 'right':
                return 'ew-resize'
            default:
                return 'default'
        }
    }

    /**
     * Start resizing from a specific handle.
     * Initializes a single-source-of-truth resize session and binds active pointer listeners.
     * Resizing is disabled in embed mode and when not in the active globalScope.
     * @param {string} handle - The handle name being dragged
     * @param {number=} pointerId - Optional pointer identifier for pointer capture
     * @param {object=} startCoords - Optional initial coordinates
     */
    startResize(handle, pointerId = null, startCoords = null) {
        if (typeof embed !== 'undefined' && embed) return
        if (this.scope !== globalScope) return

        const initialCoords = startCoords ? { ...startCoords } : {
            x: this.x,
            y: this.y,
            xf: this.x,
            yf: this.y,
        }

        this.resizing = true
        this.activeHandle = handle
        this.activePointerId = pointerId

        this.resizeSession = {
            handle,
            pointerId,
            startCoords: { ...initialCoords },
            latestCoords: { ...initialCoords },
            origX: this.x,
            origY: this.y,
            origCols: this.cols,
            origRows: this.rows,
            fixedLeft: this.x,
            fixedTop: this.y,
            fixedRight: this.x + this.elementWidth,
            fixedBottom: this.y + this.elementHeight,
        }

        simulationArea.lastSelected = this
        simulationArea.selected = true
        this.clicked = true
        this.hover = true

        const cursor = this.getCursorForHandle(handle)

        // Set global engine flags to lock cursor and bypass hover checks in renderCanvas()
        simulationArea.isResizingRectangle = true
        simulationArea.resizeCursor = cursor

        document.body.style.cursor = cursor
        if (simulationArea.canvas) {
            simulationArea.canvas.style.cursor = cursor
            simulationArea.canvas.addEventListener('lostpointercapture', this.onLostPointerCapture)
        }

        // Attach window listeners strictly for the active resize lifecycle
        window.addEventListener('pointermove', this.onPointerMove)
        window.addEventListener('pointerup', this.onPointerUp)
        window.addEventListener('pointercancel', this.onPointerUp)
    }

    /**
     * Stop active resize operation, record backup if geometry changed, teardown session listeners, and clean up cursor.
     * Idempotent and safe when called multiple times.
     */
    stopResize() {
        if (!this.resizing && !this.resizeSession) return

        // Finalize resize computation with latest session coordinates
        if (this.resizeSession) {
            this.resize()

            const hasChanged =
                this.x !== this.resizeSession.origX ||
                this.y !== this.resizeSession.origY ||
                this.cols !== this.resizeSession.origCols ||
                this.rows !== this.resizeSession.origRows

            if (hasChanged) {
                scheduleBackup(this.scope || globalScope)
            }
        }

        // Teardown active resize listeners immediately
        window.removeEventListener('pointermove', this.onPointerMove)
        window.removeEventListener('pointerup', this.onPointerUp)
        window.removeEventListener('pointercancel', this.onPointerUp)

        // Release pointer capture if active
        const canvas = simulationArea.canvas || document.getElementById('simulationArea')
        if (canvas) {
            canvas.removeEventListener('lostpointercapture', this.onLostPointerCapture)
            if (this.activePointerId !== null && this.activePointerId !== undefined && canvas.releasePointerCapture) {
                try {
                    canvas.releasePointerCapture(this.activePointerId)
                } catch (err) {
                    // Ignore capture release error
                }
            }
        }

        this.resizing = false
        this.activeHandle = null
        this.activePointerId = null
        this.resizeSession = null

        // Reset global engine flags so standard cursor management resumes cleanly
        simulationArea.isResizingRectangle = false
        simulationArea.resizeCursor = ''

        // Clear locked cursor styles
        document.body.style.cursor = ''
        if (simulationArea.canvas) {
            simulationArea.canvas.style.cursor = 'default'
        }

        updateCanvasSet(true)
        scheduleUpdate(1)
    }

    /**
     * Dynamically updates the rectangle dimensions strictly using the active resize session.
     * Computes new dimensions solely from the session state (fixed opposite edges and latest coordinates).
     * Never reads simulationArea.mouseX or simulationArea.mouseY to avoid stale press coordinate snap-back.
     * Idempotent: calling with no arguments any number of times produces the same geometry.
     * Safe no-op when there is no active session.
     */
    resize() {
        if (!this.resizing || !this.resizeSession) return

        const { handle, fixedLeft, fixedTop, fixedRight, fixedBottom, latestCoords } = this.resizeSession
        if (!latestCoords) return

        const mouseX = latestCoords.x
        const mouseY = latestCoords.y

        let newX = this.x
        let newY = this.y
        let newCols = this.cols
        let newRows = this.rows

        // Horizontal resizing
        if (handle === 'top-left' || handle === 'left' || handle === 'bottom-left') {
            const targetWidth = fixedRight - mouseX
            newCols = Math.max(5, Math.min(1000, Math.round(targetWidth / 10)))
            newX = fixedRight - newCols * 10
        } else if (handle === 'top-right' || handle === 'right' || handle === 'bottom-right') {
            const targetWidth = mouseX - fixedLeft
            newCols = Math.max(5, Math.min(1000, Math.round(targetWidth / 10)))
            newX = fixedLeft
        }

        // Vertical resizing
        if (handle === 'top-left' || handle === 'top' || handle === 'top-right') {
            const targetHeight = fixedBottom - mouseY
            newRows = Math.max(5, Math.min(1000, Math.round(targetHeight / 10)))
            newY = fixedBottom - newRows * 10
        } else if (handle === 'bottom-left' || handle === 'bottom' || handle === 'bottom-right') {
            const targetHeight = mouseY - fixedTop
            newRows = Math.max(5, Math.min(1000, Math.round(targetHeight / 10)))
            newY = fixedTop
        }

        const changed =
            this.x !== newX ||
            this.y !== newY ||
            this.cols !== newCols ||
            this.rows !== newRows

        if (changed) {
            this.x = newX
            this.y = newY
            this.cols = newCols
            this.rows = newRows
            this.setSize()

            // Update DOM inputs in Properties Panel if open
            const colInput = document.getElementById('Columns')
            if (colInput && document.activeElement !== colInput) {
                colInput.value = this.cols
            }
            const rowInput = document.getElementById('Rows')
            if (rowInput && document.activeElement !== rowInput) {
                rowInput.value = this.rows
            }

            updateCanvasSet(true)
            scheduleUpdate(1)
        }
    }

    /**
     * Active resize pointer move listener.
     * Converts client coordinates via standard canvas transform, updates session latestCoords, and triggers resize().
     * @param {PointerEvent|MouseEvent} e - The pointer move event
     */
    onPointerMove(e) {
        if (this.scope !== globalScope) {
            this.stopResize()
            return
        }

        if (this.resizing && this.resizeSession) {
            const coords = this.getEventCoordinates(e)
            this.resizeSession.latestCoords = coords
            this.resize()
        }
    }

    /**
     * Active resize pointer up/cancel listener.
     * Terminates the active resize session.
     */
    onPointerUp() {
        if (this.resizing) {
            this.stopResize()
        }
    }

    /**
     * Handles lost pointer capture event to cleanly terminate active resize session.
     */
    onLostPointerCapture() {
        if (this.resizing) {
            this.stopResize()
        }
    }

    /**
     * Override isHover to consider drag handles and bypass hit detection during active resize.
     * Disabled in embed mode.
     * @returns {boolean}
     */
    isHover() {
        if (this.scope !== globalScope) return false
        // Bypass hover checks during resize drag so engine does not reset cursor
        if (this.resizing) return true

        const mouseXf = simulationArea.mouseXf
        const mouseYf = simulationArea.mouseYf
        if (mouseXf !== undefined && mouseYf !== undefined) {
            if (this.getHandleAt(mouseXf, mouseYf)) {
                return true
            }
        }
        return super.isHover()
    }

    /**
     * Override startDragging to intercept drag-handle resizing.
     * Disabled in embed mode.
     */
    startDragging() {
        if (typeof embed !== 'undefined' && embed) {
            super.startDragging()
            return
        }
        if (this.scope !== globalScope || this.resizing) return

        const handle = this.getHandleAt(simulationArea.mouseXf, simulationArea.mouseYf)
        if (handle && simulationArea.lastSelected === this) {
            const startCoords = {
                x: simulationArea.mouseX,
                y: simulationArea.mouseY,
                xf: simulationArea.mouseXf,
                yf: simulationArea.mouseYf,
            }
            this.startResize(handle, null, startCoords)
            return
        }

        super.startDragging()
    }

    /**
     * Override drag to perform resizing when a handle is active.
     */
    drag() {
        if (this.scope !== globalScope) return
        if (this.resizing) {
            this.resize()
            return
        }
        super.drag()
    }

    /**
     * Override update to manage resizing lifecycle and prevent accidental moves.
     * When resizing is active, updates from the session without reading mouseX/mouseY.
     * Reliant solely on pointerup/pointercancel/lostpointercapture to stop resizing.
     * @returns {boolean|undefined}
     */
    update() {
        if (this.scope !== globalScope) {
            if (this.resizing) this.stopResize()
            return false
        }
        ensureCanvasDispatcher()

        if (this.newElement) {
            return super.update()
        }

        if (this.resizing) {
            // Relies on pointerup/pointercancel to terminate resize.
            // Do NOT guard with simulationArea.mouseDown to avoid timing race conditions.
            simulationArea.lastSelected = this
            simulationArea.selected = true
            this.clicked = true
            this.hover = true

            // Keep cursor locked
            const cursor = this.getCursorForHandle(this.activeHandle)
            simulationArea.isResizingRectangle = true
            simulationArea.resizeCursor = cursor
            document.body.style.cursor = cursor
            if (simulationArea.canvas) simulationArea.canvas.style.cursor = cursor

            this.resize()
            return true
        }

        // Hover cursor management when selected and hovering over handles
        if (simulationArea.lastSelected === this && simulationArea.canvas && !simulationArea.isResizingRectangle) {
            const handle = this.getHandleAt(simulationArea.mouseXf, simulationArea.mouseYf)
            if (handle) {
                const cursor = this.getCursorForHandle(handle)
                simulationArea.resizeCursor = cursor
                simulationArea.canvas.style.cursor = cursor
            } else if (simulationArea.resizeCursor) {
                simulationArea.resizeCursor = ''
                if (this.isHover()) {
                    simulationArea.canvas.style.cursor = 'move'
                }
            }
        } else if (simulationArea.lastSelected !== this && simulationArea.resizeCursor && !simulationArea.isResizingRectangle) {
            simulationArea.resizeCursor = ''
        }

        return super.update()
    }

    /**
     * @memberof Rectangle
     * @param {number} size - new size of rows
     * @returns {Rectangle}
     */
    changeRowSize(size) {
        if (size === undefined || size < 5 || size > 1000) return
        if (this.rows === size) return
        this.rows = parseInt(size, 10)
        this.setSize()
        return this
    }

    /**
     * @memberof Rectangle
     * @param {number} size - new size of columns
     * @returns {Rectangle}
     */
    changeColSize(size) {
        if (size === undefined || size < 5 || size > 1000) return
        if (this.cols === size) return
        this.cols = parseInt(size, 10)
        this.setSize()
        return this
    }

    /**
     * @memberof Rectangle
     * listener function to change direction of rectangle
     * @param {string} dir - new direction
     */
    keyDown3(dir) {
        if (dir === 'ArrowRight') {
            this.changeColSize(this.cols + 2)
        }
        if (dir === 'ArrowLeft') {
            this.changeColSize(this.cols - 2)
        }
        if (dir === 'ArrowDown') {
            this.changeRowSize(this.rows + 2)
        }
        if (dir === 'ArrowUp') {
            this.changeRowSize(this.rows - 2)
        }
    }

    /**
     * @memberof Rectangle
     * fn to create save Json Data of object
     * @returns {JSON}
     */
    customSave() {
        const data = {
            constructorParamaters: [this.rows, this.cols],
        }
        return data
    }

    /**
     * Render visible drag handles at bounding box corners and midpoints.
     * Disabled in embed mode.
     * @param {CanvasRenderingContext2D} ctx - 2D rendering context
     */
    drawHandles(ctx) {
        if (typeof embed !== 'undefined' && embed) return

        const activeScope = this.scope || globalScope
        const scale = activeScope.scale || 1
        const ox = activeScope.ox !== undefined ? activeScope.ox : 0
        const oy = activeScope.oy !== undefined ? activeScope.oy : 0

        const xx = this.x
        const yy = this.y
        const w = this.elementWidth
        const h = this.elementHeight

        const handlePoints = [
            [xx, yy], // top-left
            [xx + w / 2, yy], // top
            [xx + w, yy], // top-right
            [xx + w, yy + h / 2], // right
            [xx + w, yy + h], // bottom-right
            [xx + w / 2, yy + h], // bottom
            [xx, yy + h], // bottom-left
            [xx, yy + h / 2], // left
        ]

        const handleSize = 8
        const half = handleSize / 2

        ctx.save()
        ctx.setLineDash([])
        for (const [hx, hy] of handlePoints) {
            const sx = Math.round(ox + hx * scale)
            const sy = Math.round(oy + hy * scale)

            ctx.fillStyle = '#FFFFFF'
            ctx.strokeStyle = '#0055D4'
            ctx.lineWidth = 1.5

            ctx.beginPath()
            ctx.rect(sx - half, sy - half, handleSize, handleSize)
            ctx.fill()
            ctx.stroke()
        }
        ctx.restore()
    }

    /**
     * @memberof Rectangle
     * function to draw element with permanent light yellow background
     */
    customDraw() {
        var ctx = simulationArea.context
        const xx = this.x
        const yy = this.y
        const w = this.elementWidth
        const h = this.elementHeight

        const isSelected =
            simulationArea.lastSelected === this ||
            simulationArea.multipleObjectSelections.includes(this)

        // 1. Permanent light yellow highlight fill (lower z-index background)
        ctx.beginPath()
        rect(ctx, xx, yy, w, h)
        ctx.fillStyle = isSelected
            ? 'rgba(255, 255, 32, 0.2)'
            : 'rgba(255, 255, 32, 0.1)'
        ctx.fill()

        // 2. Dashed bounding border
        ctx.beginPath()
        ctx.strokeStyle = isSelected ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.6)'
        ctx.setLineDash([5 * globalScope.scale, 5 * globalScope.scale])
        ctx.lineWidth = correctWidth(1.5)
        rect(ctx, xx, yy, w, h)
        ctx.stroke()
        ctx.setLineDash([])

        // 3. Draw resize drag handles when selected
        if (isSelected) {
            this.drawHandles(ctx)
        }
    }

    /**
     * @memberof Rectangle
     * function to reset or (internally) set size
     */
    setSize() {
        this.elementWidth = this.cols * 10
        this.elementHeight = this.rows * 10
        this.upDimensionY = 0
        this.leftDimensionX = 0
        this.rightDimensionX = this.elementWidth
        this.downDimensionY = this.elementHeight
    }
}

/**
 * @memberof Rectangle
 * Help Tip
 * @type {string}
 * @category modules
 */
Rectangle.prototype.tooltipText =
    'Rectangle ToolTip : Used to Box the Circuit or area you want to highlight.'
Rectangle.prototype.helplink =
    'https://docs.circuitverse.org/chapter4/chapter4-annotation#rectangle'
Rectangle.prototype.propagationDelayFixed = true

/**
 * @memberof Rectangle
 * Mutable properties of the element
 * @type {JSON}
 * @category modules
 */
Rectangle.prototype.mutableProperties = {
    cols: {
        name: 'Columns',
        type: 'number',
        max: '1000',
        min: '5',
        func: 'changeColSize',
    },
    rows: {
        name: 'Rows',
        type: 'number',
        max: '1000',
        min: '5',
        func: 'changeRowSize',
    },
}
Rectangle.prototype.objectType = 'Rectangle'
