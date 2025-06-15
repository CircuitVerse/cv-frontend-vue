/* eslint-disable import/no-cycle */
import { simulationArea } from './simulationArea'

// Define types for Input/Output layout
interface LayoutProperties {
  x: number
  y: number
}

interface IOComponent {
  layoutProperties: LayoutProperties
}

interface Scope {
  Input: IOComponent[]
  Output: IOComponent[]
  layout: {
    height: number
  }
}

// Assume globalScope exists in your global context
declare const globalScope: Scope

export function getNextPosition(x = 0, scope: Scope = globalScope): number {
  let possibleY = 20
  const done: Record<number, 1> = {}

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

// Define `this` context type
interface ChangeInputSizeContext {
  inputSize: number
  objectType: string
  x: number
  y: number
  scope: any
  direction: number
  bitWidth: number
  delete: () => void
}

export function changeInputSize(this: ChangeInputSizeContext, size?: number): any {
  if (size === undefined || size < 2 || size > 10) return
  if (this.inputSize === size) return

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
