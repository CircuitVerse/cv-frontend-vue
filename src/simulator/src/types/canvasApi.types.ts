
export type Direction = 'RIGHT' | 'LEFT' | 'UP' | 'DOWN';
export type DirectionFix = Direction | 'right' | 'left' | 'up' | 'down';

export interface SimulationObject {
    x: number;
    y: number;
    absX(): number;
    absY(): number;
    objectType: string;
    upDimensionY: number;
    downDimensionY: number;
    leftDimensionX: number;
    rightDimensionX: number;
    [key: string]: any;
}

export interface Scope {
    scale: number;
    ox: number;
    oy: number;
    [key: string]: any;
}
// Global variable declarations
declare global {
    let globalScope: Scope;
    let width: number;
    let height: number;
    let DPR: number;
    let embed: boolean;
    let lightMode: boolean;
}