import { setUserKeys } from '../model/actions'

/**
 * Update the hotkey panel UI with the currently set configuration
 * @param mode User preferred configuration or default keys
 */
export const updateHTML = (mode: 'user' | 'default'): void => {
    const preferenceContainer = document.getElementById('preference')
    if (!preferenceContainer) return

    const storageKey = mode === 'user' ? 'userKeys' : 'defaultKeys'
    let keys: Record<string, string> = {}

    try {
        const storedData = localStorage.getItem(storageKey)
        if (storedData) {
            keys = JSON.parse(storedData)
        }
    } catch (error) {
        console.error(`Failed to parse ${storageKey} from localStorage:`, error)
        return
    }

    // Update the key values in the preference container    
    const children = preferenceContainer.children
    for (let x = 0; x < children.length; x++) {
        const child = children[x]
        if (!(child instanceof HTMLElement)) continue

        const keyElement = child.querySelector('.key-name')
        const valueElement = child.querySelector('.key-value')
        
        if (keyElement instanceof HTMLElement && 
            valueElement instanceof HTMLElement) {
            valueElement.innerText = keys[keyElement.innerText] || ''
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
        const errorMessageElement = document.getElementById('error-message')
        if (errorMessageElement) {
            errorMessageElement.textContent = 'Failed to save hotkey configuration. Please try again.'
            errorMessageElement.style.display = 'block'
            
            // Optional: Automatically hide error after 5 seconds
            setTimeout(() => {
                errorMessageElement.style.display = 'none'
            }, 5000)
        }
    }
}