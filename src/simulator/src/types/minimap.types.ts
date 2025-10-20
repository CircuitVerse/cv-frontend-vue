// This interface defines the structure for the minimap area
// No imports needed for this interface file

/**
 * Interface for the miniMap area object
 */
export interface MiniMapAreaType {
    /** The canvas element used for the minimap */
    canvas: HTMLCanvasElement | null
    /** The 2D rendering context for the canvas */
    ctx: CanvasRenderingContext2D | null
    /** Page height */
    pageHeight: number
    /** Page width */
    pageWidth: number
    /** Page Y coordinate */
    pageY: number
    /** Page X coordinate */
    pageX: number
    /** Minimum X coordinate */
    minX: number
    /** Maximum X coordinate */
    maxX: number
    /** Minimum Y coordinate */
    minY: number
    /** Maximum Y coordinate */
    maxY: number

    /** Set up the minimap parameters and dimensions */
    setup(): void
    /** Draw the outline of minimap and call resolve */
    play(ratio: number): void
    /** Resolve all objects and draw them on minimap */
    resolve(ratio: number): void
    /** Clear the minimap */
    clear(): void
}
