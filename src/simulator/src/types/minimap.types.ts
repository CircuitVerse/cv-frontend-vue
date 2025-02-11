interface Wire {
    node1: { absX: () => number; absY: () => number };
    node2: { absX: () => number; absY: () => number };
}

export interface CircuitElement {
    x: number;
    y: number;
    leftDimensionX: number;
    rightDimensionX: number;
    upDimensionY: number;
    downDimensionY: number;
}

export interface GlobalScope {
    oy: number;
    ox: number;
    scale: number;
    wires: Wire[];
    root: unknown;
    [key: string]: Wire[] | CircuitElement[] | number | unknown;
}

export interface MiniMapArea {
    canvas: HTMLCanvasElement;
    pageY: number;
    pageX: number;
    pageHeight: number;
    pageWidth: number;
    minY: number;
    maxY: number;
    minX: number;
    maxX: number;
    ctx: CanvasRenderingContext2D;
    setup(): void;
    play(ratio: number): void;
    resolve(ratio: number): void;
    clear(): void;
}