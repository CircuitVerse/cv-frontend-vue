/* eslint-disable import/no-cycle */
import { simulationArea } from './simulationArea';

export function getNextPosition(x: number = 0, scope: GlobalScope): number {
    let possibleY: number = 20;
    const done: { [key: number]: number } = {};

    for (let i = 0; i < scope.Input.length - 1; i++) {
        if (scope.Input[i].layoutProperties.x === x) {
            done[scope.Input[i].layoutProperties.y] = 1;
        }
    }

    for (let i = 0; i < scope.Output.length; i++) {
        if (scope.Output[i].layoutProperties.x === x) {
            done[scope.Output[i].layoutProperties.y] = 1;
        }
    }

    while (done[possibleY] || done[possibleY + 10] || done[possibleY - 10]) {
        possibleY += 10;
    }

    const height: number = possibleY + 20;
    if (height > scope.layout.height) {
        const oldHeight: number = scope.layout.height;
        scope.layout.height = height;

        for (let i = 0; i < scope.Input.length; i++) {
            if (scope.Input[i].layoutProperties.y === oldHeight) {
                scope.Input[i].layoutProperties.y = scope.layout.height;
            }
        }

        for (let i = 0; i < scope.Output.length; i++) {
            if (scope.Output[i].layoutProperties.y === oldHeight) {
                scope.Output[i].layoutProperties.y = scope.layout.height;
            }
        }
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