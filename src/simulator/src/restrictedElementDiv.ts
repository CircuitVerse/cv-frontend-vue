import { Scope } from './types/restrictedElementDiv.types'

const globalScope: Scope = {
    restrictedCircuitElementsUsed: []
};
const restrictedElements: string[] = [];

export function updateRestrictedElementsList(): void {
    if (globalScope.restrictedCircuitElementsUsed.length === 0) {
        const restrictedElementsDiv = document.getElementById('restrictedElementsDiv--list');
        if (restrictedElementsDiv) {
            restrictedElementsDiv.innerHTML = 'None';
        }
        return;
    }
    const { restrictedCircuitElementsUsed } = globalScope;
    const restrictedStr = restrictedCircuitElementsUsed.join(', ');
    const restrictedElementsDiv = document.getElementById('restrictedElementsDiv--list');
    if (restrictedElementsDiv) {
        restrictedElementsDiv.innerHTML = restrictedStr;
    } else {
        console.error('Element restrictedElementsDiv--list not found');
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

const RESTRICTED_MESSAGE = 'The element has been restricted by mentor. Usage might lead to deduction in marks';
export function showRestricted(): void {
    const restrictedDiv = document.getElementById('restrictedDiv');
    const helpDiv = document.getElementById('Help');
    if (!restrictedDiv) {
        console.error('Element restrictedDiv not found');
        return;
    }
    restrictedDiv.classList.remove('display--none');
    restrictedDiv.innerHTML = RESTRICTED_MESSAGE;
    if (helpDiv) {
        helpDiv.classList.remove('show');
    }
}

export function hideRestricted(): void {
    const restrictedDiv = document.getElementById('restrictedDiv');
    if (restrictedDiv) {
        restrictedDiv.classList.add('display--none');
    }
}