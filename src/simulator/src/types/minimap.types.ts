export interface MiniMapAreaType {
    canvas: HTMLCanvasElement | null
    ctx: CanvasRenderingContext2D | null
    context?: CanvasRenderingContext2D
    pageHeight: number
    pageWidth: number
    pageY: number
    pageX: number
    minX: number
    maxX: number
    minY: number
    maxY: number
    setup(): void
    play(ratio: number): void
    resolve(ratio: number): void
    clear(): void
}
