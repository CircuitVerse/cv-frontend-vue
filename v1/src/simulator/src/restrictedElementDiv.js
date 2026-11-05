export function updateRestrictedElementsList() {
    if (restrictedElements.length === 0) return

    const { restrictedCircuitElementsUsed } = globalScope
    let restrictedStr = ''

    restrictedCircuitElementsUsed.forEach((element) => {
        restrictedStr += `${element}, `
    })

    if (restrictedStr === '') {
        restrictedStr = 'None'
    } else {
        restrictedStr = restrictedStr.slice(0, -2)
    }

    const listEl = document.getElementById('restrictedElementsDiv--list')
    if (listEl && listEl.innerHTML !== restrictedStr) {
        listEl.innerHTML = restrictedStr
    }
}

export function updateRestrictedElementsInScope(scope = globalScope) {
    // Do nothing if no restricted elements
    if (restrictedElements.length === 0) return

    const restrictedElementsUsed = []
    restrictedElements.forEach((element) => {
        if (scope[element].length > 0) {
            restrictedElementsUsed.push(element)
        }
    })

    scope.restrictedCircuitElementsUsed = restrictedElementsUsed
    updateRestrictedElementsList()
}

export function showRestricted() {
    const restrictedDiv = document.getElementById('restrictedDiv')
    if (restrictedDiv) {
        restrictedDiv.classList.remove('display--none')
        const msg = 'The element has been restricted by mentor. Usage might lead to deduction in marks'
        if (restrictedDiv.innerHTML !== msg) {
            restrictedDiv.innerHTML = msg
        }
    }
    // Show no help text for restricted elements
    document.getElementById('Help')?.classList.remove('show')
}

export function hideRestricted() {
    document.getElementById('restrictedDiv').classList.add('display--none')
}
