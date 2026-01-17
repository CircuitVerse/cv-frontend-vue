/* eslint-disable import/no-cycle */
import { simulationArea } from './simulationArea'

/**
 * Finds next available Y position for layout
 * @param x - X coordinate to check
 * @param scope - The scope to check positions in
 * @returns The next available Y position
 */
export function getNextPosition(x: number = 0, scope = globalScope): number {
    let possibleY = 20
    const done: Record<number, number> = {}
    for (let i = 0; i < scope.Input.length - 1; i++) {
        if (scope.Input[i].layoutProperties.x === x) {
            done[scope.Input[i].layoutProperties.y] = 1
        }
    }
    for (let i = 0; i < scope.Output.length; i++) {
        if (scope.Output[i].layoutProperties.x === x) {
            done[scope.Output[i].layoutProperties.y] = 1
        }
    }
    while (done[possibleY] || done[possibleY + 10] || done[possibleY - 10]) {
        possibleY += 10
    }
    const height = possibleY + 20
    if (height > scope.layout.height) {
        const oldHeight = scope.layout.height
        scope.layout.height = height
        for (let i = 0; i < scope.Input.length; i++) {
            if (scope.Input[i].layoutProperties.y === oldHeight) {
                scope.Input[i].layoutProperties.y = scope.layout.height
            }
        }
        for (let i = 0; i < scope.Output.length; i++) {
            if (scope.Output[i].layoutProperties.y === oldHeight) {
                scope.Output[i].layoutProperties.y = scope.layout.height
            }
        }
    }
    return possibleY
}

/**
 * Global modules registry
 */
const modules: Record<string, any> = {}

export default modules

/**
 * Changes input size of a circuit element
 * @param size - New input size (2-10)
 */
export function changeInputSize(this: any, size: number): any {
    if (size == undefined || size < 2 || size > 10) return
    if (this.inputSize == size) return
    size = parseInt(String(size), 10)
    const obj = new modules[this.objectType](
        this.x,
        this.y,
        this.scope,
        this.direction,
        size,
        this.bitWidth
    )
    this.delete()
    simulationArea.lastSelected = obj
    return obj
}
