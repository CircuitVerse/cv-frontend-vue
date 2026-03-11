import Scope from './circuit'

// Global type declarations for window properties
declare const restrictedElements: string[]
declare let globalScope: Scope

/**
 * Updates the displayed list of restricted circuit elements used in the current scope.
 * Reads from globalScope.restrictedCircuitElementsUsed and updates the DOM.
 */
export function updateRestrictedElementsList(): void {
    if (restrictedElements.length === 0) return
    if (!globalScope) return

    const { restrictedCircuitElementsUsed } = globalScope
    const restrictedStr = restrictedCircuitElementsUsed.length > 0
        ? restrictedCircuitElementsUsed.join(', ')
        : 'None'

    const listElement = document.getElementById('restrictedElementsDiv--list')
    if (listElement) {
        listElement.textContent = restrictedStr
    }
}

/**
 * Scans the scope for restricted elements and updates scope.restrictedCircuitElementsUsed.
 * @param scope - The scope to scan (defaults to globalScope)
 */
export function updateRestrictedElementsInScope(scope: Scope = globalScope): void {
    if (restrictedElements.length === 0) return
    if (!scope) return

    const restrictedElementsUsed: string[] = []
    restrictedElements.forEach((element: string) => {
        // Access dynamic properties on Scope using index signature
        // Double cast needed as Scope lacks index signature but has dynamic properties
        const scopeElement = (scope as unknown as Record<string, unknown>)[element]
        if (Array.isArray(scopeElement) && scopeElement.length > 0) {
            restrictedElementsUsed.push(element)
        }
    })

    scope.restrictedCircuitElementsUsed = restrictedElementsUsed
    updateRestrictedElementsList()
}

/**
 * Shows the restricted element warning div and hides the help panel.
 */
export function showRestricted(): void {
    const restrictedDiv = document.getElementById('restrictedDiv')
    if (restrictedDiv) {
        restrictedDiv.classList.remove('display--none')
        restrictedDiv.textContent = 'The element has been restricted by mentor. Usage might lead to deduction in marks'
    }
    const helpDiv = document.getElementById('Help')
    if (helpDiv) {
        helpDiv.classList.remove('show')
    }
}

/**
 * Hides the restricted element warning div.
 */
export function hideRestricted(): void {
    const restrictedDiv = document.getElementById('restrictedDiv')
    if (restrictedDiv) {
        restrictedDiv.classList.add('display--none')
    }
}
