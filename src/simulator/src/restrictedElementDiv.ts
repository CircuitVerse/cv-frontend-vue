import { Scope } from './types/restrictedElementDiv.types'

let globalScope: Scope = {
    restrictedCircuitElementsUsed: []
};
let restrictedElements: string[] = [];

export function updateRestrictedElementsList(): void {
    if (restrictedElements.length === 0) return;

    const { restrictedCircuitElementsUsed } = globalScope;
    let restrictedStr = '';

    restrictedCircuitElementsUsed.forEach((element: string) => {
        restrictedStr += `${element}, `;
    });

    if (restrictedStr === '') {
        restrictedStr = 'None';
    } else {
        restrictedStr = restrictedStr.slice(0, -2); // Remove the trailing comma and space
    }

    const restrictedElementsDiv = document.getElementById('restrictedElementsDiv--list');
    if (restrictedElementsDiv) {
        restrictedElementsDiv.innerHTML = restrictedStr;
    }
}

export function updateRestrictedElementsInScope(scope: Scope = globalScope): void {
    if (restrictedElements.length === 0) return;

    const restrictedElementsUsed: string[] = [];
    restrictedElements.forEach((element: string) => {
        if (scope[element] && scope[element].length > 0) {
            restrictedElementsUsed.push(element);
        }
    });

    scope.restrictedCircuitElementsUsed = restrictedElementsUsed;
    updateRestrictedElementsList();
}

export function showRestricted(): void {
    const restrictedDiv = document.getElementById('restrictedDiv');
    const helpDiv = document.getElementById('Help');

    if (restrictedDiv) {
        restrictedDiv.classList.remove('display--none');
    }

    if (helpDiv) {
        helpDiv.classList.remove('show');
    }

    if (restrictedDiv) {
        restrictedDiv.innerHTML = 'The element has been restricted by mentor. Usage might lead to deduction in marks';
    }
}

export function hideRestricted(): void {
    const restrictedDiv = document.getElementById('restrictedDiv');
    if (restrictedDiv) {
        restrictedDiv.classList.add('display--none');
    }
}