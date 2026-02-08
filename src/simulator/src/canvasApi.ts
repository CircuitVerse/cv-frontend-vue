/* eslint-disable no-param-reassign */
import { backgroundArea } from './backgroundArea'
import { simulationArea } from './simulationArea'
import miniMapArea, { removeMiniMap, updatelastMinimapShown } from './minimap'
import { colors } from './themer/themer'
import { updateOrder } from './metadata'
import { 
    Direction, 
    DirectionFix, 
    Scope, 
    SimulationObject 
} from './types/canvasApi.types'

const unit: number = 10

/**
 * Finds dimensions of all objects in the scope
 * @param scope The scope to find dimensions in
 */
export function findDimensions(scope: Scope = globalScope): void {
    let totalObjects: number = 0
    simulationArea.minWidth = Infinity
    simulationArea.maxWidth = -Infinity
    simulationArea.minHeight = Infinity
    simulationArea.maxHeight = -Infinity

    for (let i = 0; i < updateOrder.length; i++) {
        if (updateOrder[i] !== 'wires') {
            for (let j = 0; j < scope[updateOrder[i]].length; j++) {
                totalObjects += 1
                const obj: SimulationObject = scope[updateOrder[i]][j]

                if (totalObjects === 1) {
                    simulationArea.minWidth = obj.absX()
                    simulationArea.minHeight = obj.absY()
                    simulationArea.maxWidth = obj.absX()
                    simulationArea.maxHeight = obj.absY()
                }

                if (obj.objectType !== 'Node') {
                    if (obj.y - obj.upDimensionY < simulationArea.minHeight!) {
                        simulationArea.minHeight = obj.y - obj.upDimensionY
                    }
                    if (
                        obj.y + obj.downDimensionY >
                        simulationArea.maxHeight!
                    ) {
                        simulationArea.maxHeight = obj.y + obj.downDimensionY
                    }
                    if (obj.x - obj.leftDimensionX < simulationArea.minWidth!) {
                        simulationArea.minWidth = obj.x - obj.leftDimensionX
                    }
                    if (
                        obj.x + obj.rightDimensionX >
                        simulationArea.maxWidth!
                    ) {
                        simulationArea.maxWidth = obj.x + obj.rightDimensionX
                    }
                } else {
                    if (obj.absY() < simulationArea.minHeight!) {
                        simulationArea.minHeight = obj.absY()
                    }
                    if (obj.absY() > simulationArea.maxHeight!) {
                        simulationArea.maxHeight = obj.absY()
                    }
                    if (obj.absX() < simulationArea.minWidth!) {
                        simulationArea.minWidth = obj.absX()
                    }
                    if (obj.absX() > simulationArea.maxWidth!) {
                        simulationArea.maxWidth = obj.absX()
                    }
                }
            }
        }
    }
    simulationArea.objectList = updateOrder
}

/**
 * Function used to change the zoom level with respect to a point
 * @param delta The change in scale
 * @param xx X coordinate of the focus point
 * @param yy Y coordinate of the focus point
 * @param method The method to use for zooming (1: mouse position, 2: center of screen, 3: center of screen)
 */
export function changeScale(
    delta: number,
    xx?: number | 'zoomButton',
    yy?: number | 'zoomButton',
    method: number = 1
): void {
    // method = 3/2 - Zoom wrt center of screen
    // method = 1 - Zoom wrt position of mouse
    // Otherwise zoom wrt to selected object

    if (method === 3) {
        xx = (width / 2 - globalScope.ox) / globalScope.scale
        yy = (height / 2 - globalScope.oy) / globalScope.scale
    } else if (
        xx === undefined ||
        yy === undefined ||
        xx === 'zoomButton' ||
        yy === 'zoomButton'
    ) {
        if (
            simulationArea.lastSelected &&
            simulationArea.lastSelected.objectType !== 'Wire'
        ) {
            // selected object
            xx = simulationArea.lastSelected.x
            yy = simulationArea.lastSelected.y
        } else {
            // mouse location
            // eslint-disable-next-line no-lonely-if
            if (method === 1) {
                xx = simulationArea.mouseX
                yy = simulationArea.mouseY
            } else if (method === 2) {
                xx = (width / 2 - globalScope.ox) / globalScope.scale
                yy = (height / 2 - globalScope.oy) / globalScope.scale
            }
        }
    }

    const focusX = xx as number
    const focusY = yy as number

    const oldScale: number = globalScope.scale
    globalScope.scale = Math.max(
        0.5,
        Math.min(4 * DPR, globalScope.scale + delta)
    )
    globalScope.scale = Math.round(globalScope.scale * 10) / 10
    globalScope.ox -= Math.round(focusX * (globalScope.scale - oldScale)) // Shift accordingly, so that we zoom wrt to the selected point
    globalScope.oy -= Math.round(focusY * (globalScope.scale - oldScale))

    // MiniMap
    if (!embed && !lightMode) {
        findDimensions(globalScope)
        miniMapArea.setup()
        const miniMap = document.querySelector('#miniMap') as HTMLElement
        if (miniMap) {
            miniMap.style.display = 'block'
            updatelastMinimapShown()
            miniMap.style.display = 'block'
            setTimeout(removeMiniMap, 2000)
        }
    }
}

/**
 * Draws dots on the screen
 * the function is called only when the zoom level or size of screen changes.
 * Otherwise for normal panning, the canvas itself is moved to give the illusion of movement
 * @param dots Whether to draw dots
 * @param transparentBackground Whether the background should be transparent
 * @param force Force redraw even if scale hasn't changed
 */
export function dots(
    dots: boolean = true,
    transparentBackground: boolean = false,
    force: boolean = false
): void {
    const scale = unit * globalScope.scale
    const ox = globalScope.ox % scale // offset
    const oy = globalScope.oy % scale // offset

    const backgroundCtx = backgroundArea.context
    if (!backgroundCtx || !backgroundArea.canvas) return

    const canvasWidth = backgroundArea.canvas.width // max X distance
    const canvasHeight = backgroundArea.canvas.height // max Y distance

    backgroundArea.canvas.style.left = `${(ox - scale) / DPR}px` // adjust left position of canvas
    backgroundArea.canvas.style.top = `${(oy - scale) / DPR}px` // adjust top position of canvas

    if (globalScope.scale === simulationArea.prevScale && !force) return

    simulationArea.prevScale = globalScope.scale // set the previous scale to current scale

    backgroundCtx.beginPath()
    backgroundArea.clear()

    if (!transparentBackground) {
        backgroundCtx.fillStyle = colors['canvas_fill']
        backgroundCtx.fillRect(0, 0, canvasWidth, canvasHeight)
    }

    if (dots) {
        backgroundCtx.fillStyle = colors['dot_fill']
        for (let i = 0; i < canvasWidth; i += scale) {
            for (let j = 0; j < canvasHeight; j += scale) {
                backgroundCtx.beginPath()
                backgroundCtx.arc(i, j, scale / 10, 0, Math.PI * 2)
                backgroundCtx.fill()
            }
        }
    }

    backgroundCtx.strokeStyle = colors['canvas_stroke']
    backgroundCtx.lineWidth = 1

    if (!embed) {
        const correction = 0.5 * (backgroundCtx.lineWidth % 2)
        for (let i = 0; i < canvasWidth; i += scale) {
            backgroundCtx.moveTo(Math.round(i + correction) - correction, 0)
            backgroundCtx.lineTo(
                Math.round(i + correction) - correction,
                canvasHeight
            )
        }
        for (let j = 0; j < canvasHeight; j += scale) {
            backgroundCtx.moveTo(0, Math.round(j + correction) - correction)
            backgroundCtx.lineTo(
                canvasWidth,
                Math.round(j + correction) - correction
            )
        }
        backgroundCtx.stroke()
    }
    // Old Code
    // function drawPixel(x, y, r, g, b, a) {
    //     var index = (x + y * canvasWidth) * 4;
    //     canvasData.data[index + 0] = r;
    //     canvasData.data[index + 1] = g;
    //     canvasData.data[index + 2] = b;
    //     canvasData.data[index + 3] = a;
    // }
    // if (dots) {
    //     var canvasData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    //
    //
    //
    //     for (var i = 0 + ox; i < canvasWidth; i += scale)
    //         for (var j = 0 + oy; j < canvasHeight; j += scale)
    //             drawPixel(i, j, 0, 0, 0, 255);
    //     ctx.putImageData(canvasData, 0, 0);
    // }
}
/**
 * Helper canvas API starts here
 * All canvas functions are wrt to a center point (xx,yy),
 * direction is used to abstract rotation of everything by a certain angle
 * Possible values for direction = "RIGHT" (default), "LEFT", "UP", "DOWN"
*/

/**
 * Bezier curve helper function
 * @param x1 Control point 1 x
 * @param y1 Control point 1 y
 * @param x2 Control point 2 x
 * @param y2 Control point 2 y
 * @param x3 End point x
 * @param y3 End point y
 * @param xx Center x coordinate
 * @param yy Center y coordinate
 * @param dir Direction
 */
export function bezierCurveTo(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    xx: number,
    yy: number,
    dir: Direction
): void {
    ;[x1, y1] = rotate(x1, y1, dir)
    ;[x2, y2] = rotate(x2, y2, dir)
    ;[x3, y3] = rotate(x3, y3, dir)

    const { ox, oy } = globalScope
    x1 *= globalScope.scale
    y1 *= globalScope.scale
    x2 *= globalScope.scale
    y2 *= globalScope.scale
    x3 *= globalScope.scale
    y3 *= globalScope.scale
    xx *= globalScope.scale
    yy *= globalScope.scale

    const ctx = simulationArea.context
    if (!ctx) return

    ctx.bezierCurveTo(
        Math.round(xx + ox + x1),
        Math.round(yy + oy + y1),
        Math.round(xx + ox + x2),
        Math.round(yy + oy + y2),
        Math.round(xx + ox + x3),
        Math.round(yy + oy + y3)
    )
}

/**
 * Move to a point on the canvas
 * @param ctx Canvas context
 * @param x1 X coordinate
 * @param y1 Y coordinate
 * @param xx Center X coordinate
 * @param yy Center Y coordinate
 * @param dir Direction
 * @param bypass Whether to bypass the correction
 */
export function moveTo(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    xx: number,
    yy: number,
    dir: Direction,
    bypass: boolean = false
): void {
    const correction = 0.5 * (ctx.lineWidth % 2)
    let newX: number
    let newY: number

    ;[newX, newY] = rotate(x1, y1, dir)
    newX *= globalScope.scale
    newY *= globalScope.scale
    xx *= globalScope.scale
    yy *= globalScope.scale

    if (bypass) {
        ctx.moveTo(
            Math.round(xx + globalScope.ox + newX),
            Math.round(yy + globalScope.oy + newY)
        )
    } else {
        ctx.moveTo(
            Math.round(xx + globalScope.ox + newX - correction) + correction,
            Math.round(yy + globalScope.oy + newY - correction) + correction
        )
    }
}

/**
 * Line to a point on the canvas
 * @param ctx Canvas context
 * @param x1 X coordinate
 * @param y1 Y coordinate
 * @param xx Center X coordinate
 * @param yy Center Y coordinate
 * @param dir Direction
 */
export function lineTo(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    xx: number,
    yy: number,
    dir: Direction
): void {
    let newX: number
    let newY: number

    const correction = 0.5 * (ctx.lineWidth % 2)
    ;[newX, newY] = rotate(x1, y1, dir)
    newX *= globalScope.scale
    newY *= globalScope.scale
    xx *= globalScope.scale
    yy *= globalScope.scale

    ctx.lineTo(
        Math.round(xx + globalScope.ox + newX - correction) + correction,
        Math.round(yy + globalScope.oy + newY - correction) + correction
    )
}

/**
 * Draw an arc on the canvas
 * @param ctx Canvas context
 * @param sx Shift X
 * @param sy Shift Y
 * @param radius Radius
 * @param start Start angle
 * @param stop End angle
 * @param xx Center X coordinate
 * @param yy Center Y coordinate
 * @param dir Direction
 */
export function arc(
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    radius: number,
    start: number,
    stop: number,
    xx: number,
    yy: number,
    dir: Direction
): void {
    let Sx: number
    let Sy: number
    let newStart: number
    let newStop: number
    let counterClock: boolean

    const correction = 0.5 * (ctx.lineWidth % 2)
    ;[Sx, Sy] = rotate(sx, sy, dir)
    Sx *= globalScope.scale
    Sy *= globalScope.scale
    xx *= globalScope.scale
    yy *= globalScope.scale
    radius *= globalScope.scale

    ;[newStart, newStop, counterClock] = rotateAngle(start, stop, dir)
    ctx.arc(
        Math.round(xx + globalScope.ox + Sx + correction) - correction,
        Math.round(yy + globalScope.oy + Sy + correction) - correction,
        Math.round(radius),
        newStart,
        newStop,
        counterClock
    )
}

/**
 * Draw an arc on the canvas with additional pi offset
 * @param ctx Canvas context
 * @param sx Shift X
 * @param sy Shift Y
 * @param radius Radius
 * @param start Start angle
 * @param stop End angle
 * @param xx Center X coordinate
 * @param yy Center Y coordinate
 * @param dir Direction
 */
export function arc2(
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    radius: number,
    start: number,
    stop: number,
    xx: number,
    yy: number,
    dir: Direction
): void {
    let Sx: number
    let Sy: number
    let newStart: number
    let newStop: number
    let counterClock: boolean

    const correction = 0.5 * (ctx.lineWidth % 2)
    ;[Sx, Sy] = rotate(sx, sy, dir)
    Sx *= globalScope.scale
    Sy *= globalScope.scale
    xx *= globalScope.scale
    yy *= globalScope.scale
    radius *= globalScope.scale

    ;[newStart, newStop, counterClock] = rotateAngle(start, stop, dir)
    const pi = counterClock ? Math.PI : 0

    ctx.arc(
        Math.round(xx + globalScope.ox + Sx + correction) - correction,
        Math.round(yy + globalScope.oy + Sy + correction) - correction,
        Math.round(radius),
        newStart + pi,
        newStop + pi
    )
}

/**
 * Draw a circle on the canvas
 * @param ctx Canvas context
 * @param sx Shift X
 * @param sy Shift Y
 * @param radius Radius
 * @param xx Center X coordinate
 * @param yy Center Y coordinate
 * @param dir Direction
 */
export function drawCircle2(
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    radius: number,
    xx: number,
    yy: number,
    dir: Direction
): void {
    let Sx: number
    let Sy: number

    ;[Sx, Sy] = rotate(sx, sy, dir)
    Sx *= globalScope.scale
    Sy *= globalScope.scale
    xx *= globalScope.scale
    yy *= globalScope.scale
    radius *= globalScope.scale

    ctx.arc(
        Math.round(xx + globalScope.ox + Sx),
        Math.round(yy + globalScope.oy + Sy),
        Math.round(radius),
        0,
        2 * Math.PI
    )
}

/**
 * Draw a rectangle on the canvas
 * @param ctx Canvas context
 * @param x1 X1 coordinate
 * @param y1 Y1 coordinate
 * @param x2 X2 coordinate (width)
 * @param y2 Y2 coordinate (height)
 */
export function rect(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number
): void {
    const correction = 0.5 * (ctx.lineWidth % 2)
    x1 *= globalScope.scale
    y1 *= globalScope.scale
    x2 *= globalScope.scale
    y2 *= globalScope.scale

    ctx.rect(
        Math.round(globalScope.ox + x1 - correction) + correction,
        Math.round(globalScope.oy + y1 - correction) + correction,
        Math.round(x2),
        Math.round(y2)
    )
}

/**
 * Draw an image on the canvas
 * @param ctx Canvas context
 * @param img Image to draw
 * @param x1 X coordinate
 * @param y1 Y coordinate
 * @param w_canvas Width
 * @param h_canvas Height
 */
export function drawImage(
    ctx: CanvasRenderingContext2D,
    img: CanvasImageSource,
    x1: number,
    y1: number,
    w_canvas: number,
    h_canvas: number
): void {
    x1 *= globalScope.scale
    y1 *= globalScope.scale
    x1 += globalScope.ox
    y1 += globalScope.oy

    w_canvas *= globalScope.scale
    h_canvas *= globalScope.scale

    ctx.drawImage(img, x1, y1, w_canvas, h_canvas)
}

/**
 * Draw a rectangle on the canvas with a center point and direction
 * @param ctx Canvas context
 * @param x1 X1 coordinate
 * @param y1 Y1 coordinate
 * @param x2 X2 coordinate (width)
 * @param y2 Y2 coordinate (height)
 * @param xx Center X coordinate
 * @param yy Center Y coordinate
 * @param dir Direction
 */
export function rect2(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    xx: number,
    yy: number,
    dir: Direction = 'RIGHT'
): void {
    const correction = 0.5 * (ctx.lineWidth % 2)

    ;[x1, y1] = rotate(x1, y1, dir)
    ;[x2, y2] = rotate(x2, y2, dir)
    x1 *= globalScope.scale
    y1 *= globalScope.scale
    x2 *= globalScope.scale
    y2 *= globalScope.scale
    xx *= globalScope.scale
    yy *= globalScope.scale

    ctx.rect(
        Math.round(globalScope.ox + xx + x1 - correction) + correction,
        Math.round(globalScope.oy + yy + y1 - correction) + correction,
        Math.round(x2),
        Math.round(y2)
    )
}

/**
 * Rotate coordinates based on direction
 * @param x1 X coordinate
 * @param y1 Y coordinate
 * @param dir Direction
 * @returns Rotated coordinates [x, y]
 */
export function rotate(
    x1: number,
    y1: number,
    dir: Direction
): [number, number] {
    if (dir === 'LEFT') {
        return [-x1, y1]
    }
    if (dir === 'DOWN') {
        return [y1, x1]
    }
    if (dir === 'UP') {
        return [y1, -x1]
    }
    return [x1, y1]
}

/**
 * Correct width based on scale
 * @param w Width
 * @returns Corrected width
 */
export function correctWidth(w: number): number {
    return Math.max(1, Math.round(w * globalScope.scale))
}

/**
 * Rotate angle based on direction
 * @param start Start angle
 * @param stop End angle
 * @param dir Direction
 * @returns [newStart, newStop, counterClock]
 */
function rotateAngle(
    start: number,
    stop: number,
    dir: Direction
): [number, number, boolean] {
    if (dir === 'LEFT') {
        return [start, stop, true]
    }
    if (dir === 'DOWN') {
        return [start - Math.PI / 2, stop - Math.PI / 2, true]
    }
    if (dir === 'UP') {
        return [start - Math.PI / 2, stop - Math.PI / 2, false]
    }
    return [start, stop, false]
}

/**
 * Draw a line on the canvas
 * @param ctx Canvas context
 * @param x1 X1 coordinate
 * @param y1 Y1 coordinate
 * @param x2 X2 coordinate
 * @param y2 Y2 coordinate
 * @param color Line color
 * @param width Line width
 */
export function drawLine(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string,
    width: number
): void {
    x1 *= globalScope.scale
    y1 *= globalScope.scale
    x2 *= globalScope.scale
    y2 *= globalScope.scale

    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineCap = 'round'
    ctx.lineWidth = correctWidth(width) //* globalScope.scale;

    const correction = 0.5 * (ctx.lineWidth % 2)
    const hCorrection = y1 === y2 ? correction : 0
    const vCorrection = x1 === x2 ? correction : 0

    ctx.moveTo(
        Math.round(x1 + globalScope.ox + hCorrection) - hCorrection,
        Math.round(y1 + globalScope.oy + vCorrection) - vCorrection
    )
    ctx.lineTo(
        Math.round(x2 + globalScope.ox + hCorrection) - hCorrection,
        Math.round(y2 + globalScope.oy + vCorrection) - vCorrection
    )
    ctx.stroke()
}

/**
 * Checks if a string color is valid using a DOM hack
 * @param color Color to check
 * @returns Whether the color is valid
 */
export function validColor(color: string): boolean {
    const newDiv = document.createElement('div')
    newDiv.style.border = `1px solid ${color}`
    return newDiv.style.borderColor !== ''
}

/**
 * Convert a color string to RGBA values
 * @param color Color to convert
 * @returns RGBA values as Uint8ClampedArray
 */
export function colorToRGBA(color: string): Uint8ClampedArray {
    const cvs = document.createElement('canvas')
    cvs.height = 1
    cvs.width = 1
    const ctx = cvs.getContext('2d')!
    ctx.fillStyle = color
    ctx.fillRect(0, 0, 1, 1)
    return ctx.getImageData(0, 0, 1, 1).data
}

/**
 * Draw a filled circle on the canvas
 * @param ctx Canvas context
 * @param x1 X coordinate
 * @param y1 Y coordinate
 * @param r Radius
 * @param color Fill color
 */
export function drawCircle(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    r: number,
    color: string
): void {
    x1 *= globalScope.scale
    y1 *= globalScope.scale

    ctx.beginPath()
    ctx.fillStyle = color
    ctx.arc(
        Math.round(x1 + globalScope.ox),
        Math.round(y1 + globalScope.oy),
        Math.round(r * globalScope.scale),
        0,
        Math.PI * 2,
        false
    )
    ctx.closePath()
    ctx.fill()
}

/**
 * Display a message on the canvas
 * @param ctx Canvas context
 * @param str Message to display
 * @param x1 X coordinate
 * @param y1 Y coordinate
 * @param fontSize Font size
 */
export function canvasMessage(
    ctx: CanvasRenderingContext2D,
    str: string,
    x1: number,
    y1: number,
    fontSize: number = 10
): void {
    if (!str || !str.length) return

    ctx.font = `${Math.round(fontSize * globalScope.scale)}px Raleway`
    ctx.textAlign = 'center'
    const width = ctx.measureText(str).width / globalScope.scale + 8
    const height = 13
    ctx.strokeStyle = 'black'
    ctx.lineWidth = correctWidth(1)
    ctx.fillStyle = 'yellow'
    ctx.save()
    ctx.beginPath()
    rect(ctx, x1 - width / 2, y1 - height / 2 - 3, width, height)
    ctx.shadowColor = '#999'
    ctx.shadowBlur = 10
    ctx.shadowOffsetX = 3
    ctx.shadowOffsetY = 3
    ctx.stroke()
    ctx.fill()
    ctx.restore()

    x1 *= globalScope.scale
    y1 *= globalScope.scale
    ctx.beginPath()
    ctx.fillStyle = 'black'
    ctx.fillText(
        str,
        Math.round(x1 + globalScope.ox),
        Math.round(y1 + globalScope.oy)
    )
    ctx.fill()
}

/**
 * Draw text on the canvas
 * @param ctx Canvas context
 * @param str Text to draw
 * @param x1 X coordinate
 * @param y1 Y coordinate
 * @param fontSize Font size
 */
export function fillText(
    ctx: CanvasRenderingContext2D,
    str: string,
    x1: number,
    y1: number,
    fontSize: number = 20
): void {
    x1 *= globalScope.scale
    y1 *= globalScope.scale
    ctx.font = `${Math.round(fontSize * globalScope.scale)}px Raleway`
    ctx.fillText(
        str,
        Math.round(x1 + globalScope.ox),
        Math.round(y1 + globalScope.oy)
    )
}

/**
 * Draw text with rotation on the canvas
 * @param ctx Canvas context
 * @param str Text to draw
 * @param x1 X coordinate
 * @param y1 Y coordinate
 * @param xx Center X coordinate
 * @param yy Center Y coordinate
 * @param dir Direction
 */
export function fillText2(
    ctx: CanvasRenderingContext2D,
    str: string,
    x1: number,
    y1: number,
    xx: number,
    yy: number,
    dir: Direction
): void {
    const angle: Record<Direction, number> = {
        RIGHT: 0,
        LEFT: 0,
        DOWN: Math.PI / 2,
        UP: -Math.PI / 2,
    }

    x1 *= globalScope.scale
    y1 *= globalScope.scale
    ;[x1, y1] = rotate(x1, y1, dir)
    xx *= globalScope.scale
    yy *= globalScope.scale

    ctx.font = `${Math.round(14 * globalScope.scale)}px Raleway`
    ctx.save()
    ctx.translate(
        Math.round(xx + x1 + globalScope.ox),
        Math.round(yy + y1 + globalScope.oy)
    )
    ctx.rotate(angle[dir])
    ctx.textAlign = 'center'
    ctx.fillText(
        str,
        0,
        Math.round(4 * globalScope.scale) * (1 - 0 * +(dir === 'DOWN'))
    )
    ctx.restore()
}

/**
 * Draw text with rotation and alignment on the canvas
 * @param ctx Canvas context
 * @param str Text to draw
 * @param x1 X coordinate
 * @param y1 Y coordinate
 * @param xx Center X coordinate
 * @param yy Center Y coordinate
 * @param dir Direction
 * @param fontSize Font size
 * @param textAlign Text alignment
 */
export function fillText4(
    ctx: CanvasRenderingContext2D,
    str: string,
    x1: number,
    y1: number,
    xx: number,
    yy: number,
    dir: Direction,
    fontSize: number = 14,
    textAlign: CanvasTextAlign = 'center'
): void {
    const angle: Record<Direction, number> = {
        RIGHT: 0,
        LEFT: 0,
        DOWN: Math.PI / 2,
        UP: -Math.PI / 2,
    }

    x1 *= globalScope.scale
    y1 *= globalScope.scale
    ;[x1, y1] = rotate(x1, y1, dir)
    xx *= globalScope.scale
    yy *= globalScope.scale

    ctx.font = `${Math.round(fontSize * globalScope.scale)}px Raleway`
    ctx.textAlign = textAlign
    ctx.fillText(
        str,
        xx + x1 + globalScope.ox,
        yy +
            y1 +
            globalScope.oy +
            Math.round((fontSize / 3) * globalScope.scale)
    )
}

/**
 * Draw text with custom font and alignment on the canvas
 * @param ctx Canvas context
 * @param str Text to draw
 * @param x1 X coordinate
 * @param y1 Y coordinate
 * @param xx Center X coordinate
 * @param yy Center Y coordinate
 * @param fontSize Font size
 * @param font Font family
 * @param textAlign Text alignment
 */
export function fillText3(
    ctx: CanvasRenderingContext2D,
    str: string,
    x1: number,
    y1: number,
    xx: number = 0,
    yy: number = 0,
    fontSize: number = 14,
    font: string = 'Raleway',
    textAlign: CanvasTextAlign = 'center'
): void {
    x1 *= globalScope.scale
    y1 *= globalScope.scale
    xx *= globalScope.scale
    yy *= globalScope.scale

    ctx.font = `${Math.round(fontSize * globalScope.scale)}px ${font}`
    ctx.textAlign = textAlign
    ctx.fillText(
        str,
        Math.round(xx + x1 + globalScope.ox),
        Math.round(yy + y1 + globalScope.oy)
    )
}

export const oppositeDirection: Record<Direction, Direction> = {
    RIGHT: 'LEFT',
    LEFT: 'RIGHT',
    DOWN: 'UP',
    UP: 'DOWN',
}

export const fixDirection: Record<DirectionFix, Direction> = {
    right: 'LEFT',
    left: 'RIGHT',
    down: 'UP',
    up: 'DOWN',
    LEFT: 'LEFT',
    RIGHT: 'RIGHT',
    UP: 'UP',
    DOWN: 'DOWN',
}
