import Scope from './circuit'

// Declare global variables
declare let globalScope: Scope
declare let restrictedElements: readonly string[]

export function updateRestrictedElementsList(): void {
    if (restrictedElements.length === 0) return

    const { restrictedCircuitElementsUsed } = globalScope
    let restrictedStr: string = ''

    restrictedCircuitElementsUsed.forEach((element: string) => {
        restrictedStr += `${element}, `
    })

    if (restrictedStr === '') {
        restrictedStr = 'None'
    } else {
        restrictedStr = restrictedStr.slice(0, -2)
    }

    const listElement = document.getElementById('restrictedElementsDiv--list')
    if (listElement) {
        listElement.innerHTML = restrictedStr
    }
}

/**
 * @param scope - The circuit scope to check for restricted elements
 */

export function updateRestrictedElementsInScope(scope: Scope = globalScope): void {
    // Do nothing if no restricted elements
    if (restrictedElements.length === 0) return

    const restrictedElementsUsed: string[] = []
    restrictedElements.forEach((element: string) => {
        const elementArray = (scope as unknown as Record<string, unknown[]>)[element]
        if (elementArray && elementArray.length > 0) {
            restrictedElementsUsed.push(element)
        }
    })

    scope.restrictedCircuitElementsUsed = restrictedElementsUsed
    updateRestrictedElementsList()
}

export function showRestricted(): void {
    const restrictedDiv = document.getElementById('restrictedDiv')
    if (restrictedDiv) {
        restrictedDiv.classList.remove('display--none')
        // Show no help text for restricted elements
        const helpElement = document.getElementById('Help')
        if (helpElement) {
            helpElement.classList.remove('show')
        }
        restrictedDiv.innerHTML = 'The element has been restricted by mentor. Usage might lead to deduction in marks'
    }
}

export function hideRestricted(): void {
    const restrictedDiv = document.getElementById('restrictedDiv')
    if (restrictedDiv) {
        restrictedDiv.classList.add('display--none')
    }
}
