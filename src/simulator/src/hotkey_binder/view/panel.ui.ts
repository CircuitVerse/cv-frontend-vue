import { setUserKeys } from '../model/actions'

/**
 * Update the hotkey panel UI with the currently set configuration
 * @param mode User preferred configuration or default keys
 */
export const updateHTML = (mode: 'user' | 'default'): void => {
    const preferenceContainer = document.getElementById('preference')
    if (!preferenceContainer) return

    if (mode === 'user') {
        const userKeys = localStorage.get('userKeys') as Record<string, string>
        const children = preferenceContainer.children

        for (let x = 0; x < children.length; x++) {
            const child = children[x] as HTMLElement
            const keyElement = child.querySelector('.key-name') as HTMLElement
            const valueElement = child.querySelector('.key-value') as HTMLElement
            
            if (keyElement && valueElement) {
                valueElement.innerText = userKeys[keyElement.innerText] || ''
            }
        }
    } else if (mode === 'default') {
        const defaultKeys = localStorage.get('defaultKeys') as Record<string, string>
        const children = preferenceContainer.children

        for (let x = 0; x < children.length; x++) {
            const child = children[x] as HTMLElement
            const keyElement = child.querySelector('.key-name') as HTMLElement
            const valueElement = child.querySelector('.key-value') as HTMLElement
            
            if (keyElement && valueElement) {
                valueElement.innerText = defaultKeys[keyElement.innerText] || ''
            }
        }
    }
}

/**
 * Override key of duplicate entries
 * @param combo Key combination to override
 */
export const override = (combo: string): void => {
    const preferenceContainer = document.getElementById('preference')
    if (!preferenceContainer) return

    const children = preferenceContainer.children
    for (let x = 0; x < children.length; x++) {
        const child = children[x] as HTMLElement
        const valueElement = child.querySelector('.key-value') as HTMLElement
        
        if (valueElement && valueElement.innerText === combo) {
            valueElement.innerText = ''
        }
    }
}

/**
 * Close the edit interface
 */
export const closeEdit = (): void => {
    const pressedKeysElement = document.getElementById('pressedKeys')
    const editElement = document.getElementById('edit')
    
    if (pressedKeysElement) pressedKeysElement.textContent = ''
    if (editElement) editElement.style.display = 'none'
}

/**
 * Submit user key configurations
 */
export const submit = async (): Promise<void> => {
    const editElement = document.getElementById('edit')
    if (editElement) editElement.style.display = 'none'
    
    try {
                await setUserKeys()
                updateHTML('user')
            } catch (error) {
                console.error('Failed to save user keys:', error)
                // TODO: Add user feedback for failure case
            }
}