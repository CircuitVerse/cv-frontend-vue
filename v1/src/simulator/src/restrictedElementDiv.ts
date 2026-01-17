/**
 * Updates the restricted elements list in the UI
 */
export function updateRestrictedElementsList(): void {
    if (restrictedElements.length === 0) return

    const { restrictedCircuitElementsUsed } = globalScope
    let restrictedStr = ''

    restrictedCircuitElementsUsed.forEach((element: string) => {
        restrictedStr += `${element}, `
    })

    if (restrictedStr === '') {
        restrictedStr = 'None'
    } else {
        restrictedStr = restrictedStr.slice(0, -2)
    }

    const listEl = document.getElementById('restrictedElementsDiv--list')
    if (listEl) listEl.innerHTML = restrictedStr
}

/**
 * Updates restricted elements used in the given scope
 * @param scope - The scope to check for restricted elements
 */
export function updateRestrictedElementsInScope(scope = globalScope): void {
    // Do nothing if no restricted elements
    if (restrictedElements.length === 0) return

    const restrictedElementsUsed: string[] = []
    restrictedElements.forEach((element: string) => {
        if (scope[element]?.length > 0) {
            restrictedElementsUsed.push(element)
        }
    })

    scope.restrictedCircuitElementsUsed = restrictedElementsUsed
    updateRestrictedElementsList()
}

/**
 * Shows the restricted element warning div
 */
export function showRestricted(): void {
    const restrictedDiv = document.getElementById('restrictedDiv')
    const helpDiv = document.getElementById('Help')

    if (restrictedDiv) {
        restrictedDiv.classList.remove('display--none')
        restrictedDiv.innerHTML = 'The element has been restricted by mentor. Usage might lead to deduction in marks'
    }
    // Show no help text for restricted elements
    if (helpDiv) helpDiv.classList.remove('show')
}

/**
 * Hides the restricted element warning div
 */
export function hideRestricted(): void {
    const restrictedDiv = document.getElementById('restrictedDiv')
    if (restrictedDiv) restrictedDiv.classList.add('display--none')
}
