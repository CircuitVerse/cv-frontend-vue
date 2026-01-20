/**
 * @file canvasApi.ts
 * @description Canvas drawing utilities for the circuit simulator.
 * Provides helper functions for drawing circuit elements with rotation,
 * scaling, and coordinate transformation support.
 */

import { backgroundArea } from './backgroundArea';
import { simulationArea } from './simulationArea';
import miniMapArea, { removeMiniMap, updatelastMinimapShown } from './minimap';
import { colors } from './themer/themer';
import { updateOrder } from './metadata';

/*** Global Variable Declarations ***/

// TODO: Replace with proper Scope type when circuit.ts is migrated
declare const globalScope: any;
declare const width: number;
declare const height: number;
declare const DPR: number;
declare const embed: boolean;
declare const lightMode: boolean;

/*** Type Definitions ***/

/**
 * Valid direction values for canvas element orientation.
 * Used throughout drawing functions to handle rotation transformations.
 */
export type Direction = 'RIGHT' | 'LEFT' | 'UP' | 'DOWN';

/**
 * Alias for the Canvas 2D rendering context.
 * Provides better semantic meaning in function signatures.
 */
type CanvasContext = CanvasRenderingContext2D;

/**
 * Direction to angle mapping for text rotation.
 * Values are in radians.
 */
interface DirectionAngleMap {
    readonly RIGHT: number;
    readonly LEFT: number;
    readonly DOWN: number;
    readonly UP: number;
}

/**
 * Interface for the MiniMap area object.
 * @TODO Remove when minimap.js is converted to TypeScript
 */
interface MiniMapArea {
    canvas: HTMLElement | null;
    setup(): void;
    /** Allows additional unmigrated properties */
    [key: string]: unknown;
}

/*** Constants ***/

/** Base unit size for grid spacing (in pixels) */
const unit: number = 10;

/** Direction angle mapping for text rotation (in radians) */
const directionAngles: DirectionAngleMap = {
    RIGHT: 0,
    LEFT: 0,
    DOWN: Math.PI / 2,
    UP: -Math.PI / 2,
} as const;

/*** Internal Helper Functions ***/

/**
 * Rotates angle values based on direction.
 * Used internally by arc drawing functions.
 *
 * @param start - Start angle in radians
 * @param stop - Stop angle in radians
 * @param dir - Direction for rotation transformation
 * @returns Tuple of [newStart, newStop, counterClockwise]
 *
 * @internal
 * @private
 */
function rotateAngle(
    start: number,
    stop: number,
    dir: Direction
): [number, number, boolean] {
    if (dir === 'LEFT') {
        return [start, stop, true];
    }
    if (dir === 'DOWN') {
        return [start - Math.PI / 2, stop - Math.PI / 2, true];
    }
    if (dir === 'UP') {
        return [start - Math.PI / 2, stop - Math.PI / 2, false];
    }
    return [start, stop, false];
}

/*** Exported Functions ***/

/**
 * Finds and updates the bounding dimensions of all objects in a scope.
 * Iterates through all circuit elements and calculates min/max boundaries.
 *
 * @param scope - The scope object containing circuit elements (defaults to globalScope)
 *
 * @example
 * // Update dimensions for the current scope
 * findDimensions();
 *
 * @example
 * // Update dimensions for a specific scope
 * findDimensions(customScope);
 *
 * @category canvas
 */
export function findDimensions(scope: any = globalScope): void {
    let totalObjects = 0;
    simulationArea.minWidth = undefined as unknown as number;
    simulationArea.maxWidth = undefined as unknown as number;
    simulationArea.minHeight = undefined as unknown as number;
    simulationArea.maxHeight = undefined as unknown as number;

    for (let i = 0; i < updateOrder.length; i++) {
        if (updateOrder[i] !== 'wires') {
            const elements = scope[updateOrder[i]];
            for (let j = 0; j < elements.length; j++) {
                totalObjects += 1;
                const obj = elements[j];
                if (totalObjects === 1) {
                    simulationArea.minWidth = obj.absX();
                    simulationArea.minHeight = obj.absY();
                    simulationArea.maxWidth = obj.absX();
                    simulationArea.maxHeight = obj.absY();
                }
                if (obj.objectType !== 'Node') {
                    if (obj.y - obj.upDimensionY < simulationArea.minHeight) {
                        simulationArea.minHeight = obj.y - obj.upDimensionY;
                    }
                    if (obj.y + obj.downDimensionY > simulationArea.maxHeight) {
                        simulationArea.maxHeight = obj.y + obj.downDimensionY;
                    }
                    if (obj.x - obj.leftDimensionX < simulationArea.minWidth) {
                        simulationArea.minWidth = obj.x - obj.leftDimensionX;
                    }
                    if (obj.x + obj.rightDimensionX > simulationArea.maxWidth) {
                        simulationArea.maxWidth = obj.x + obj.rightDimensionX;
                    }
                } else {
                    if (obj.absY() < simulationArea.minHeight) {
                        simulationArea.minHeight = obj.absY();
                    }
                    if (obj.absY() > simulationArea.maxHeight) {
                        simulationArea.maxHeight = obj.absY();
                    }
                    if (obj.absX() < simulationArea.minWidth) {
                        simulationArea.minWidth = obj.absX();
                    }
                    if (obj.absX() > simulationArea.maxWidth) {
                        simulationArea.maxWidth = obj.absX();
                    }
                }
            }
        }
    }
    simulationArea.objectList = updateOrder;
}

/**
 * Changes the zoom scale level relative to a focal point.
 * Adjusts origin offset to maintain the focal point position.
 *
 * @param delta - Amount to change scale by (positive = zoom in, negative = zoom out)
 * @param xx - X coordinate of focal point, or 'zoomButton' for button-triggered zoom
 * @param yy - Y coordinate of focal point, or 'zoomButton' for button-triggered zoom
 * @param method - Zoom method: 1 = mouse position, 2 = center, 3 = center (same as 2)
 *
 * @example
 * // Zoom in at mouse position
 * changeScale(0.1, mouseX, mouseY, 1);
 *
 * @example
 * // Zoom out centered on screen
 * changeScale(-0.1, undefined, undefined, 2);
 *
 * @category canvas
 */
export function changeScale(
    delta: number,
    xx?: number | string,
    yy?: number | string,
    method: number = 1
): void {
    let focalX: number;
    let focalY: number;

    // method = 3/2 - Zoom wrt center of screen
    // method = 1 - Zoom wrt position of mouse
    // Otherwise zoom wrt to selected object

    if (method === 3) {
        focalX = (width / 2 - globalScope.ox) / globalScope.scale;
        focalY = (height / 2 - globalScope.oy) / globalScope.scale;
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
            focalX = simulationArea.lastSelected.x;
            focalY = simulationArea.lastSelected.y;
        } else {
            // mouse location
            if (method === 1) {
                focalX = simulationArea.mouseX;
                focalY = simulationArea.mouseY;
            } else if (method === 2) {
                focalX = (width / 2 - globalScope.ox) / globalScope.scale;
                focalY = (height / 2 - globalScope.oy) / globalScope.scale;
            } else {
                focalX = simulationArea.mouseX;
                focalY = simulationArea.mouseY;
            }
        }
    } else {
        focalX = xx as number;
        focalY = yy as number;
    }

    const oldScale = globalScope.scale;
    globalScope.scale = Math.max(
        0.5,
        Math.min(4 * DPR, globalScope.scale + delta)
    );
    globalScope.scale = Math.round(globalScope.scale * 10) / 10;
    globalScope.ox -= Math.round(focalX * (globalScope.scale - oldScale));
    globalScope.oy -= Math.round(focalY * (globalScope.scale - oldScale));

    // MiniMap
    if (!embed && !lightMode) {
        findDimensions(globalScope);
        (miniMapArea as MiniMapArea).setup();
        const miniMap = document.querySelector('#miniMap') as HTMLElement | null;
        if (miniMap) {
            miniMap.style.display = 'block';
            updatelastMinimapShown();
            miniMap.style.display = 'block';
            setTimeout(removeMiniMap, 2000);
        }
    }
}

/**
 * Draws the background grid pattern with dots and lines.
 * Called when zoom level or screen size changes.
 * For normal panning, the canvas itself is moved to give the illusion of movement.
 *
 * @param showDots - Whether to draw dot pattern (default: true)
 * @param transparentBackground - Whether to use transparent background (default: false)
 * @param force - Force redraw even if scale hasn't changed (default: false)
 *
 * @example
 * // Draw standard grid with dots
 * dots(true, false);
 *
 * @example
 * // Force redraw with transparent background
 * dots(true, true, true);
 *
 * @category canvas
 */
export function dots(
    showDots: boolean = true,
    transparentBackground: boolean = false,
    force: boolean = false
): void {
    const scale = unit * globalScope.scale;
    const ox = globalScope.ox % scale; // offset
    const oy = globalScope.oy % scale; // offset

    const backgroundCtx = backgroundArea.context;
    if (!backgroundCtx) return;

    const canvas = backgroundArea.canvas;
    if (!canvas) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    canvas.style.left = `${(ox - scale) / DPR}px`;
    canvas.style.top = `${(oy - scale) / DPR}px`;

    if (globalScope.scale === simulationArea.prevScale && !force) return;

    simulationArea.prevScale = globalScope.scale;

    backgroundCtx.beginPath();
    backgroundArea.clear();

    if (!transparentBackground) {
        backgroundCtx.fillStyle = colors['canvas_fill'];
        backgroundCtx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    if (showDots) {
        backgroundCtx.fillStyle = colors['dot_fill'];
        for (let i = 0; i < canvasWidth; i += scale) {
            for (let j = 0; j < canvasHeight; j += scale) {
                backgroundCtx.beginPath();
                backgroundCtx.arc(i, j, scale / 10, 0, Math.PI * 2);
                backgroundCtx.fill();
            }
        }
    }

    backgroundCtx.strokeStyle = colors['canvas_stroke'];
    backgroundCtx.lineWidth = 1;

    if (!embed) {
        const correction = 0.5 * (backgroundCtx.lineWidth % 2);
        for (let i = 0; i < canvasWidth; i += scale) {
            backgroundCtx.moveTo(Math.round(i + correction) - correction, 0);
            backgroundCtx.lineTo(
                Math.round(i + correction) - correction,
                canvasHeight
            );
        }
        for (let j = 0; j < canvasHeight; j += scale) {
            backgroundCtx.moveTo(0, Math.round(j + correction) - correction);
            backgroundCtx.lineTo(
                canvasWidth,
                Math.round(j + correction) - correction
            );
        }
        backgroundCtx.stroke();
    }
}

/**
 * Draws a bezier curve on the simulation canvas with direction-based rotation.
 * All coordinates are relative to a center point (xx, yy).
 *
 * @param x1 - First control point X offset
 * @param y1 - First control point Y offset
 * @param x2 - Second control point X offset
 * @param y2 - Second control point Y offset
 * @param x3 - End point X offset
 * @param y3 - End point Y offset
 * @param xx - Center X coordinate
 * @param yy - Center Y coordinate
 * @param dir - Direction for rotation ('RIGHT', 'LEFT', 'UP', 'DOWN')
 *
 * @category canvas
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
    [x1, y1] = rotate(x1, y1, dir);
    [x2, y2] = rotate(x2, y2, dir);
    [x3, y3] = rotate(x3, y3, dir);
    const { ox, oy } = globalScope;
    x1 *= globalScope.scale;
    y1 *= globalScope.scale;
    x2 *= globalScope.scale;
    y2 *= globalScope.scale;
    x3 *= globalScope.scale;
    y3 *= globalScope.scale;
    xx *= globalScope.scale;
    yy *= globalScope.scale;
    const ctx = simulationArea.context;
    if (!ctx) return;
    ctx.bezierCurveTo(
        Math.round(xx + ox + x1),
        Math.round(yy + oy + y1),
        Math.round(xx + ox + x2),
        Math.round(yy + oy + y2),
        Math.round(xx + ox + x3),
        Math.round(yy + oy + y3)
    );
}

/**
 * Moves the canvas path cursor to a position with direction-based rotation.
 *
 * @param ctx - Canvas 2D rendering context
 * @param x1 - X offset from center
 * @param y1 - Y offset from center
 * @param xx - Center X coordinate
 * @param yy - Center Y coordinate
 * @param dir - Direction for rotation
 * @param bypass - Skip line width correction if true (default: false)
 *
 * @category canvas
 */
export function moveTo(
    ctx: CanvasContext,
    x1: number,
    y1: number,
    xx: number,
    yy: number,
    dir: Direction,
    bypass: boolean = false
): void {
    const correction = 0.5 * (ctx.lineWidth % 2);
    let newX: number;
    let newY: number;
    [newX, newY] = rotate(x1, y1, dir);
    newX *= globalScope.scale;
    newY *= globalScope.scale;
    xx *= globalScope.scale;
    yy *= globalScope.scale;
    if (bypass) {
        ctx.moveTo(
            Math.round(xx + globalScope.ox + newX),
            Math.round(yy + globalScope.oy + newY)
        );
    } else {
        ctx.moveTo(
            Math.round(xx + globalScope.ox + newX - correction) + correction,
            Math.round(yy + globalScope.oy + newY - correction) + correction
        );
    }
}

/**
 * Draws a line from the current position to a new position with direction-based rotation.
 *
 * @param ctx - Canvas 2D rendering context
 * @param x1 - X offset from center
 * @param y1 - Y offset from center
 * @param xx - Center X coordinate
 * @param yy - Center Y coordinate
 * @param dir - Direction for rotation
 *
 * @category canvas
 */
export function lineTo(
    ctx: CanvasContext,
    x1: number,
    y1: number,
    xx: number,
    yy: number,
    dir: Direction
): void {
    let newX: number;
    let newY: number;

    const correction = 0.5 * (ctx.lineWidth % 2);
    [newX, newY] = rotate(x1, y1, dir);
    newX *= globalScope.scale;
    newY *= globalScope.scale;
    xx *= globalScope.scale;
    yy *= globalScope.scale;
    ctx.lineTo(
        Math.round(xx + globalScope.ox + newX - correction) + correction,
        Math.round(yy + globalScope.oy + newY - correction) + correction
    );
}

/**
 * Draws an arc on the canvas with direction-based rotation.
 * The arc direction (clockwise/counter-clockwise) is determined by the dir parameter.
 *
 * @param ctx - Canvas 2D rendering context
 * @param sx - X offset of arc center from element center
 * @param sy - Y offset of arc center from element center
 * @param radius - Arc radius
 * @param start - Start angle in radians
 * @param stop - Stop angle in radians
 * @param xx - Element center X coordinate
 * @param yy - Element center Y coordinate
 * @param dir - Direction for rotation
 *
 * @category canvas
 */
export function arc(
    ctx: CanvasContext,
    sx: number,
    sy: number,
    radius: number,
    start: number,
    stop: number,
    xx: number,
    yy: number,
    dir: Direction
): void {
    let Sx: number;
    let Sy: number;
    let newStart: number;
    let newStop: number;
    let counterClock: boolean;
    const correction = 0.5 * (ctx.lineWidth % 2);
    [Sx, Sy] = rotate(sx, sy, dir);
    Sx *= globalScope.scale;
    Sy *= globalScope.scale;
    xx *= globalScope.scale;
    yy *= globalScope.scale;
    radius *= globalScope.scale;
    [newStart, newStop, counterClock] = rotateAngle(start, stop, dir);
    ctx.arc(
        Math.round(xx + globalScope.ox + Sx + correction) - correction,
        Math.round(yy + globalScope.oy + Sy + correction) - correction,
        Math.round(radius),
        newStart,
        newStop,
        counterClock
    );
}

/**
 * Draws an arc on the canvas with direction-based rotation (variant).
 * Similar to arc() but with different counter-clockwise handling.
 *
 * @param ctx - Canvas 2D rendering context
 * @param sx - X offset of arc center from element center
 * @param sy - Y offset of arc center from element center
 * @param radius - Arc radius
 * @param start - Start angle in radians
 * @param stop - Stop angle in radians
 * @param xx - Element center X coordinate
 * @param yy - Element center Y coordinate
 * @param dir - Direction for rotation
 *
 * @category canvas
 */
export function arc2(
    ctx: CanvasContext,
    sx: number,
    sy: number,
    radius: number,
    start: number,
    stop: number,
    xx: number,
    yy: number,
    dir: Direction
): void {
    let Sx: number;
    let Sy: number;
    let newStart: number;
    let newStop: number;
    let counterClock: boolean;
    const correction = 0.5 * (ctx.lineWidth % 2);
    [Sx, Sy] = rotate(sx, sy, dir);
    Sx *= globalScope.scale;
    Sy *= globalScope.scale;
    xx *= globalScope.scale;
    yy *= globalScope.scale;
    radius *= globalScope.scale;
    [newStart, newStop, counterClock] = rotateAngle(start, stop, dir);
    let pi = 0;
    if (counterClock) {
        pi = Math.PI;
    }
    ctx.arc(
        Math.round(xx + globalScope.ox + Sx + correction) - correction,
        Math.round(yy + globalScope.oy + Sy + correction) - correction,
        Math.round(radius),
        newStart + pi,
        newStop + pi
    );
}

/**
 * Draws a complete circle (0 to 2π) with direction-based positioning.
 *
 * @param ctx - Canvas 2D rendering context
 * @param sx - X offset of circle center from element center
 * @param sy - Y offset of circle center from element center
 * @param radius - Circle radius
 * @param xx - Element center X coordinate
 * @param yy - Element center Y coordinate
 * @param dir - Direction for rotation
 *
 * @category canvas
 */
export function drawCircle2(
    ctx: CanvasContext,
    sx: number,
    sy: number,
    radius: number,
    xx: number,
    yy: number,
    dir: Direction
): void {
    let Sx: number;
    let Sy: number;
    [Sx, Sy] = rotate(sx, sy, dir);
    Sx *= globalScope.scale;
    Sy *= globalScope.scale;
    xx *= globalScope.scale;
    yy *= globalScope.scale;
    radius *= globalScope.scale;
    ctx.arc(
        Math.round(xx + globalScope.ox + Sx),
        Math.round(yy + globalScope.oy + Sy),
        Math.round(radius),
        0,
        2 * Math.PI
    );
}

/**
 * Draws a rectangle at absolute coordinates (no rotation support).
 *
 * @param ctx - Canvas 2D rendering context
 * @param x1 - X coordinate of top-left corner
 * @param y1 - Y coordinate of top-left corner
 * @param x2 - Width of rectangle
 * @param y2 - Height of rectangle
 *
 * @category canvas
 */
export function rect(
    ctx: CanvasContext,
    x1: number,
    y1: number,
    x2: number,
    y2: number
): void {
    const correction = 0.5 * (ctx.lineWidth % 2);
    x1 *= globalScope.scale;
    y1 *= globalScope.scale;
    x2 *= globalScope.scale;
    y2 *= globalScope.scale;
    ctx.rect(
        Math.round(globalScope.ox + x1 - correction) + correction,
        Math.round(globalScope.oy + y1 - correction) + correction,
        Math.round(x2),
        Math.round(y2)
    );
}

/**
 * Draws an image on the canvas at the specified position and size.
 *
 * @param ctx - Canvas 2D rendering context
 * @param img - Image source to draw
 * @param x1 - X coordinate for image placement
 * @param y1 - Y coordinate for image placement
 * @param w_canvas - Width to draw the image
 * @param h_canvas - Height to draw the image
 *
 * @category canvas
 */
export function drawImage(
    ctx: CanvasContext,
    img: CanvasImageSource,
    x1: number,
    y1: number,
    w_canvas: number,
    h_canvas: number
): void {
    x1 *= globalScope.scale;
    y1 *= globalScope.scale;
    x1 += globalScope.ox;
    y1 += globalScope.oy;

    w_canvas *= globalScope.scale;
    h_canvas *= globalScope.scale;
    ctx.drawImage(img, x1, y1, w_canvas, h_canvas);
}

/**
 * Draws a rectangle with direction-based rotation relative to a center point.
 *
 * @param ctx - Canvas 2D rendering context
 * @param x1 - X offset of top-left corner from center
 * @param y1 - Y offset of top-left corner from center
 * @param x2 - Width of rectangle
 * @param y2 - Height of rectangle
 * @param xx - Center X coordinate
 * @param yy - Center Y coordinate
 * @param dir - Direction for rotation (default: 'RIGHT')
 *
 * @category canvas
 */
export function rect2(
    ctx: CanvasContext,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    xx: number,
    yy: number,
    dir: Direction = 'RIGHT'
): void {
    const correction = 0.5 * (ctx.lineWidth % 2);
    [x1, y1] = rotate(x1, y1, dir);
    [x2, y2] = rotate(x2, y2, dir);
    x1 *= globalScope.scale;
    y1 *= globalScope.scale;
    x2 *= globalScope.scale;
    y2 *= globalScope.scale;
    xx *= globalScope.scale;
    yy *= globalScope.scale;
    ctx.rect(
        Math.round(globalScope.ox + xx + x1 - correction) + correction,
        Math.round(globalScope.oy + yy + y1 - correction) + correction,
        Math.round(x2),
        Math.round(y2)
    );
}

/**
 * Rotates coordinates based on direction.
 * Used for transforming element positions based on their orientation.
 *
 * @param x1 - X coordinate to rotate
 * @param y1 - Y coordinate to rotate
 * @param dir - Direction for rotation
 * @returns Tuple of [rotatedX, rotatedY]
 *
 * @example
 * // Rotate coordinates for a LEFT-facing element
 * const [newX, newY] = rotate(10, 5, 'LEFT');
 * // Returns: [-10, 5]
 *
 * @category canvas
 */
export function rotate(x1: number, y1: number, dir: Direction): [number, number] {
    if (dir === 'LEFT') {
        return [-x1, y1];
    }
    if (dir === 'DOWN') {
        return [y1, x1];
    }
    if (dir === 'UP') {
        return [y1, -x1];
    }
    return [x1, y1];
}

/**
 * Calculates the correct line width based on current scale.
 * Ensures lines are at least 1 pixel wide.
 *
 * @param w - Desired line width
 * @returns Corrected line width (minimum 1)
 *
 * @category canvas
 */
export function correctWidth(w: number): number {
    return Math.max(1, Math.round(w * globalScope.scale));
}

/**
 * Draws a line between two points with the specified color and width.
 *
 * @param ctx - Canvas 2D rendering context
 * @param x1 - Start X coordinate
 * @param y1 - Start Y coordinate
 * @param x2 - End X coordinate
 * @param y2 - End Y coordinate
 * @param color - Line color (CSS color string)
 * @param lineWidth - Line width
 *
 * @category canvas
 */
export function drawLine(
    ctx: CanvasContext,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string,
    lineWidth: number
): void {
    x1 *= globalScope.scale;
    y1 *= globalScope.scale;
    x2 *= globalScope.scale;
    y2 *= globalScope.scale;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineWidth = correctWidth(lineWidth);
    const correction = 0.5 * (ctx.lineWidth % 2);
    let hCorrection = 0;
    let vCorrection = 0;
    if (y1 === y2) vCorrection = correction;
    if (x1 === x2) hCorrection = correction;
    ctx.moveTo(
        Math.round(x1 + globalScope.ox + hCorrection) - hCorrection,
        Math.round(y1 + globalScope.oy + vCorrection) - vCorrection
    );
    ctx.lineTo(
        Math.round(x2 + globalScope.ox + hCorrection) - hCorrection,
        Math.round(y2 + globalScope.oy + vCorrection) - vCorrection
    );
    ctx.stroke();
}

/**
 * Validates if a string is a valid CSS color.
 * Uses a DOM element trick to check if the browser recognizes the color.
 *
 * @param color - Color string to validate
 * @returns True if the color is valid, false otherwise
 *
 * @example
 * validColor('red');      // true
 * validColor('#ff0000');  // true
 * validColor('invalid');  // false
 *
 * @category canvas
 */
export function validColor(color: string): boolean {
    const newDiv = document.createElement('div');
    newDiv.style.border = `1px solid ${color}`;
    return newDiv.style.borderColor !== '';
}

/**
 * Converts a CSS color string to RGBA values.
 * Creates a temporary canvas to extract color components.
 *
 * @param color - CSS color string
 * @returns Uint8ClampedArray containing [R, G, B, A] values (0-255)
 *
 * @example
 * const rgba = colorToRGBA('red');
 * // Returns: Uint8ClampedArray [255, 0, 0, 255]
 *
 * @category canvas
 */
export function colorToRGBA(color: string): Uint8ClampedArray {
    const cvs = document.createElement('canvas');
    cvs.height = 1;
    cvs.width = 1;
    const ctx = cvs.getContext('2d');
    if (!ctx) {
        return new Uint8ClampedArray([0, 0, 0, 0]);
    }
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    return ctx.getImageData(0, 0, 1, 1).data;
}

/**
 * Draws a filled circle at the specified position.
 *
 * @param ctx - Canvas 2D rendering context
 * @param x1 - X coordinate of circle center
 * @param y1 - Y coordinate of circle center
 * @param r - Circle radius
 * @param color - Fill color (CSS color string)
 *
 * @category canvas
 */
export function drawCircle(
    ctx: CanvasContext,
    x1: number,
    y1: number,
    r: number,
    color: string
): void {
    x1 *= globalScope.scale;
    y1 *= globalScope.scale;
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(
        Math.round(x1 + globalScope.ox),
        Math.round(y1 + globalScope.oy),
        Math.round(r * globalScope.scale),
        0,
        Math.PI * 2,
        false
    );
    ctx.closePath();
    ctx.fill();
}

/**
 * Displays a message box on the canvas (e.g., for showing node values).
 * Draws a yellow background with black text and shadow.
 *
 * @param ctx - Canvas 2D rendering context
 * @param str - Message string to display
 * @param x1 - X coordinate for message position
 * @param y1 - Y coordinate for message position
 * @param fontSize - Font size in pixels (default: 10)
 *
 * @category canvas
 */
export function canvasMessage(
    ctx: CanvasContext,
    str: string,
    x1: number,
    y1: number,
    fontSize: number = 10
): void {
    if (!str || !str.length) return;

    ctx.font = `${Math.round(fontSize * globalScope.scale)}px Raleway`;
    ctx.textAlign = 'center';
    const boxWidth = ctx.measureText(str).width / globalScope.scale + 8;
    const boxHeight = 13;
    ctx.strokeStyle = 'black';
    ctx.lineWidth = correctWidth(1);
    ctx.fillStyle = 'yellow';
    ctx.save();
    ctx.beginPath();
    rect(ctx, x1 - boxWidth / 2, y1 - boxHeight / 2 - 3, boxWidth, boxHeight);
    ctx.shadowColor = '#999';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    ctx.stroke();
    ctx.fill();
    ctx.restore();
    x1 *= globalScope.scale;
    y1 *= globalScope.scale;
    ctx.beginPath();
    ctx.fillStyle = 'black';
    ctx.fillText(
        str,
        Math.round(x1 + globalScope.ox),
        Math.round(y1 + globalScope.oy)
    );
    ctx.fill();
}

/**
 * Draws text on the canvas at the specified position.
 *
 * @param ctx - Canvas 2D rendering context
 * @param str - Text string to draw
 * @param x1 - X coordinate for text position
 * @param y1 - Y coordinate for text position
 * @param fontSize - Font size in pixels (default: 20)
 *
 * @category canvas
 */
export function fillText(
    ctx: CanvasContext,
    str: string,
    x1: number,
    y1: number,
    fontSize: number = 20
): void {
    x1 *= globalScope.scale;
    y1 *= globalScope.scale;
    ctx.font = `${Math.round(fontSize * globalScope.scale)}px Raleway`;
    ctx.fillText(
        str,
        Math.round(x1 + globalScope.ox),
        Math.round(y1 + globalScope.oy)
    );
}

/**
 * Draws text with direction-based rotation relative to a center point.
 * Text is rotated to align with the element direction.
 *
 * @param ctx - Canvas 2D rendering context
 * @param str - Text string to draw
 * @param x1 - X offset from center
 * @param y1 - Y offset from center
 * @param xx - Center X coordinate
 * @param yy - Center Y coordinate
 * @param dir - Direction for rotation
 *
 * @category canvas
 */
export function fillText2(
    ctx: CanvasContext,
    str: string,
    x1: number,
    y1: number,
    xx: number,
    yy: number,
    dir: Direction
): void {
    x1 *= globalScope.scale;
    y1 *= globalScope.scale;
    [x1, y1] = rotate(x1, y1, dir);
    xx *= globalScope.scale;
    yy *= globalScope.scale;

    ctx.font = `${Math.round(14 * globalScope.scale)}px Raleway`;
    ctx.save();
    ctx.translate(
        Math.round(xx + x1 + globalScope.ox),
        Math.round(yy + y1 + globalScope.oy)
    );
    ctx.rotate(directionAngles[dir]);
    ctx.textAlign = 'center';
    ctx.fillText(
        str,
        0,
        Math.round(4 * globalScope.scale) * (1 - 0 * +(dir === 'DOWN'))
    );
    ctx.restore();
}

/**
 * Draws text with direction-based rotation and custom formatting.
 *
 * @param ctx - Canvas 2D rendering context
 * @param str - Text string to draw
 * @param x1 - X offset from center
 * @param y1 - Y offset from center
 * @param xx - Center X coordinate
 * @param yy - Center Y coordinate
 * @param dir - Direction for rotation
 * @param fontSize - Font size in pixels (default: 14)
 * @param textAlign - Text alignment (default: 'center')
 *
 * @category canvas
 */
export function fillText4(
    ctx: CanvasContext,
    str: string,
    x1: number,
    y1: number,
    xx: number,
    yy: number,
    dir: Direction,
    fontSize: number = 14,
    textAlign: CanvasTextAlign = 'center'
): void {
    x1 *= globalScope.scale;
    y1 *= globalScope.scale;
    [x1, y1] = rotate(x1, y1, dir);
    xx *= globalScope.scale;
    yy *= globalScope.scale;

    ctx.font = `${Math.round(fontSize * globalScope.scale)}px Raleway`;
    ctx.textAlign = textAlign;
    ctx.fillText(
        str,
        xx + x1 + globalScope.ox,
        yy +
            y1 +
            globalScope.oy +
            Math.round((fontSize / 3) * globalScope.scale)
    );
}

/**
 * Draws text with additional offset and custom font settings.
 *
 * @param ctx - Canvas 2D rendering context
 * @param str - Text string to draw
 * @param x1 - X coordinate for text position
 * @param y1 - Y coordinate for text position
 * @param xx - Additional X offset (default: 0)
 * @param yy - Additional Y offset (default: 0)
 * @param fontSize - Font size in pixels (default: 14)
 * @param font - Font family name (default: 'Raleway')
 * @param textAlign - Text alignment (default: 'center')
 *
 * @category canvas
 */
export function fillText3(
    ctx: CanvasContext,
    str: string,
    x1: number,
    y1: number,
    xx: number = 0,
    yy: number = 0,
    fontSize: number = 14,
    font: string = 'Raleway',
    textAlign: CanvasTextAlign = 'center'
): void {
    x1 *= globalScope.scale;
    y1 *= globalScope.scale;
    xx *= globalScope.scale;
    yy *= globalScope.scale;

    ctx.font = `${Math.round(fontSize * globalScope.scale)}px ${font}`;
    ctx.textAlign = textAlign;
    ctx.fillText(
        str,
        Math.round(xx + x1 + globalScope.ox),
        Math.round(yy + y1 + globalScope.oy)
    );
}

/*** Exported Constants ***/

/**
 * Maps each direction to its opposite.
 * Used for flipping element orientations.
 */
export const oppositeDirection: Readonly<Record<Direction, Direction>> = {
    RIGHT: 'LEFT',
    LEFT: 'RIGHT',
    DOWN: 'UP',
    UP: 'DOWN',
} as const;

/**
 * Normalizes direction values from various input formats.
 * Handles both lowercase and uppercase direction strings.
 */
export const fixDirection: Readonly<Record<string, Direction>> = {
    right: 'LEFT',
    left: 'RIGHT',
    down: 'UP',
    up: 'DOWN',
    LEFT: 'LEFT',
    RIGHT: 'RIGHT',
    UP: 'UP',
    DOWN: 'DOWN',
} as const;
