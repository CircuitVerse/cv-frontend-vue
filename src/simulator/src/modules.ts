/* eslint-disable import/no-cycle */
import { simulationArea } from './simulationArea';

// Define interfaces for the scope and its properties
interface LayoutProperties {
    x: number;
    y: number;
}

interface InputOutputElement {
    layoutProperties: LayoutProperties;
}

interface Scope {
    Input: InputOutputElement[];
    Output: InputOutputElement[];
    layout: {
        height: number;
    };
}

interface GlobalScope extends Scope {
    // Add any additional properties or methods specific to GlobalScope here
}

interface Module {
    new (
        x: number,
        y: number,
        scope: GlobalScope,
        direction: string,
        size: number,
        bitWidth: number
    ): ModuleInstance;
}

interface ModuleInstance {
    delete(): void;
}

// Define the type for the modules object
interface Modules {
    [key: string]: Module;
}

// Define the type for the changeInputSize function's context
interface ChangeInputSizeContext {
    inputSize: number;
    objectType: string;
    x: number;
    y: number;
    scope: GlobalScope;
    direction: string;
    bitWidth: number;
    delete(): void;
}

/**
 * Helper function to mark occupied Y positions in the `done` object.
 */
function markOccupiedYPositions(elements: InputOutputElement[], x: number, done: { [key: number]: number }): void {
    for (const element of elements) {
        if (element.layoutProperties.x === x) {
            done[element.layoutProperties.y] = 1;
        }
    }
}

/**
 * Helper function to find the next available Y position.
 */
function findNextAvailableY(done: { [key: number]: number }, startY: number): number {
    let possibleY = startY;
    while (done[possibleY] || done[possibleY + 10] || done[possibleY - 10]) {
        possibleY += 10;
    }
    return possibleY;
}

/**
 * Helper function to update element positions when the layout height changes.
 */
function updateElementPositions(elements: InputOutputElement[], oldHeight: number, newHeight: number): void {
    for (const element of elements) {
        if (element.layoutProperties.y === oldHeight) {
            element.layoutProperties.y = newHeight;
        }
    }
}

export function getNextPosition(x: number = 0, scope: GlobalScope): number {
    const done: { [key: number]: number } = {};

    // Mark occupied Y positions for Input and Output elements
    markOccupiedYPositions(scope.Input, x, done);
    markOccupiedYPositions(scope.Output, x, done);

    // Find the next available Y position
    const possibleY = findNextAvailableY(done, 20);

    // Calculate the new height and update the layout if necessary
    const height = possibleY + 20;
    if (height > scope.layout.height) {
        const oldHeight = scope.layout.height;
        scope.layout.height = height;

        // Update positions of Input and Output elements
        updateElementPositions(scope.Input, oldHeight, scope.layout.height);
        updateElementPositions(scope.Output, oldHeight, scope.layout.height);
    }

    return possibleY;
}

/**
 * Global
 */
export const modules: Modules = {};

export function changeInputSize(this: ChangeInputSizeContext, size: number): ModuleInstance | void {
    if (size === undefined || size < 2 || size > 10) return;
    if (this.inputSize === size) return;

    size = parseInt(size.toString(), 10);

    const obj: ModuleInstance = new modules[this.objectType](
        this.x,
        this.y,
        this.scope,
        this.direction,
        size,
        this.bitWidth
    );

    this.delete();
    simulationArea.lastSelected = obj;
    return obj;
}