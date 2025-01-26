import { setUserKeys } from '../model/actions'

/**
 * Get keys from localStorage
 * @param storageKey Key to retrieve from localStorage
 * @returns Parsed keys or an empty object if parsing fails
 */
const getKeysFromStorage = (storageKey: string): Record<string, string> => {
    try {
        const storedData = localStorage.getItem(storageKey)
        return storedData ? JSON.parse(storedData) : {}
    } catch (error) {
        console.error(`Failed to parse ${storageKey} from localStorage:`, error)
        return {}
    }
}

/**
 * Update a single key-value pair in the UI
 * @param child Container element for the key-value pair
 * @param keys Object containing key-value mappings
 */
const updateKeyValuePair = (child: HTMLElement, keys: Record<string, string>): void => {
    const keyElement = child.querySelector('.key-name')
    const valueElement = child.querySelector('.key-value')

    if (keyElement instanceof HTMLElement && valueElement instanceof HTMLElement) {
        valueElement.innerText = keys[keyElement.innerText] || ''
    }
}

/**
 * Update the hotkey panel UI with the currently set configuration
 * @param mode User preferred configuration or default keys
 */
export const updateHTML = (mode: 'user' | 'default'): void => {
    const preferenceContainer = document.getElementById('preference')
    if (!preferenceContainer) return

    const storageKey = mode === 'user' ? 'userKeys' : 'defaultKeys'
    const keys = getKeysFromStorage(storageKey)

    Array.from(preferenceContainer.children).forEach((child) => {
        if (child instanceof HTMLElement) {
            updateKeyValuePair(child, keys)
        }
    })
}

/**
 * Override key of duplicate entries
 * @param combo Key combination to override
 */
export const override = (combo: string): void => {
    const preferenceContainer = document.getElementById('preference')
    if (!preferenceContainer) return

    Array.from(preferenceContainer.children).forEach((child) => {
        const valueElement = (child as HTMLElement).querySelector('.key-value')
        if (valueElement instanceof HTMLElement && valueElement.innerText === combo) {
            valueElement.innerText = ''
        }
    })
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
 * Display an error message to the user
 * @param message Error message to display
 */
const showErrorMessage = (message: string): void => {
    const errorMessageElement = document.getElementById('error-message')
    if (!errorMessageElement) return

    errorMessageElement.textContent = message
    errorMessageElement.style.display = 'block'

    // Automatically hide error after 5 seconds
    setTimeout(() => {
        errorMessageElement.style.display = 'none'
    }, 5000)
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
        showErrorMessage('Failed to save hotkey configuration. Please try again.')
    }
}