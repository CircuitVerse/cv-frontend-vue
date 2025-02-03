/* eslint-disable import/no-cycle */
import { defaultKeys } from '../defaultKeys'
import { addShortcut } from './addShortcut'
import { updateHTML } from '../view/panel.ui'
import { simulationArea } from '../../simulationArea'
import {
    scheduleUpdate,
    wireToBeCheckedSet,
    updateCanvasSet,
} from '../../engine'

import { getOS } from './utils'
import { shortcut } from './shortcuts.plugin'

import { KeyMap } from './modelInterfaces'

type DirectionType = 'up' | 'down' | 'left' | 'right'

/**
 * Function used to add or change keys user or default
 * grabs the keycombo from localstorage &
 * calls the addShortcut function in a loop to bind them
 * @param {string} mode - user custom keys or default keys
 */
export const addKeys = (mode: 'user' | 'default'): void => {
    shortcut.removeAll()
    const keys = mode === 'user' ? getUserKeys() : getDefaultKeys()
    bindKeys(keys, mode)
}

/**
 * Get user keys from localStorage
 */
const getUserKeys = (): KeyMap => {
    localStorage.removeItem('defaultKeys')
    return JSON.parse(localStorage.getItem('userKeys') || '{}')
}

/**
 * Get default keys from localStorage
 */
const getDefaultKeys = (): KeyMap => {
    if (localStorage.userKeys) localStorage.removeItem('userKeys')
    return JSON.parse(localStorage.getItem('defaultKeys') || '{}')
}

/**
 * Bind keys to shortcuts
 */
const bindKeys = (keys: KeyMap, mode: 'user' | 'default'): void => {
    Object.entries(keys).forEach(([pref, key]) => {
        const normalizedKey = key.split(' ').join('')
        addShortcut(normalizedKey, pref)
    })
    updateHTML(mode)
}

/**
 * Function used to check if new keys are added, adds missing keys if added
 */
export const checkUpdate = (): void => {
    const userK: KeyMap = JSON.parse(localStorage.getItem('userKeys') || '{}')
    if (Object.keys(userK).length !== Object.keys(defaultKeys).length) {
        addMissingKeys(userK)
        localStorage.setItem('userKeys', JSON.stringify(userK))
    }
}

/**
 * Add missing keys to user keys
 */
const addMissingKeys = (userK: KeyMap): void => {
    Object.entries(defaultKeys).forEach(([key, value]) => {
        if (!userK[key]) {
            userK[key] = value
        }
    })
}

/**
 * Function used to set userKeys, grabs the keycombo from the panel UI
 * sets it to the localStorage & calls addKeys
 * removes the defaultkeys from localStorage
 */
export const setUserKeys = (): void => {
    if (localStorage.defaultKeys) localStorage.removeItem('defaultKeys')
    const userKeys = getUserKeysFromUI()
    localStorage.setItem('userKeys', JSON.stringify(userKeys))
    addKeys('user')
}

/**
 * Get user keys from the UI
 */
const getUserKeysFromUI = (): KeyMap => {
    const userKeys: KeyMap = {}
    const preferenceChildren = document.getElementById('preference')?.children
    if (!preferenceChildren) return userKeys

    Array.from(preferenceChildren).forEach((child) => {
        const keyChild = child?.children[1]?.children[0]
        const valueChild = child?.children[1]?.children[1]

        if (keyChild instanceof HTMLElement && valueChild instanceof HTMLElement) {
            userKeys[keyChild.innerText] = valueChild.innerText
        }
    })
    return userKeys
}

/**
 * Function used to set defaultKeys, grabs the keycombo from the defaultkeys metadata
 * sets it to the localStorage & calls addKeys
 * removes the userkeys from localStorage if present
 * also checks for OS type
 */
export const setDefault = (): void => {
    if (localStorage.userKeys) localStorage.removeItem('userKeys')
    const keys = getOS() === 'MacOS' ? getMacDefaultKeys() : defaultKeys
    localStorage.setItem('defaultKeys', JSON.stringify(keys))
    addKeys('default')
}

/**
 * Get default keys for MacOS
 */
const getMacDefaultKeys = (): KeyMap => {
    const macDefaultKeys: KeyMap = {}
    Object.entries(defaultKeys).forEach(([key, value]) => {
        macDefaultKeys[key] = value.split(' + ')[0] === 'Ctrl' ? value.replace('Ctrl', 'Meta') : value
    })
    return macDefaultKeys
}

/**
 * Function to check if user entered keys are already assigned to other key
 * gives a warning message if keys already assigned
 */
export const warnOverride = (
    combo: string,
    target: HTMLElement,
    warning: HTMLInputElement
): void => {
    const preferenceChildren = document.getElementById('preference')?.children
    if (!preferenceChildren) return

    const isComboAssigned = checkIfComboIsAssigned(combo, target, preferenceChildren)
    if (isComboAssigned) {
        warning.value = `This key(s) is already assigned to: ${isComboAssigned}, press Enter to override.`
        setEditElementBorder('#dc5656')
    } else {
        setEditElementBorder('none')
    }
}

/**
 * Check if the key combo is already assigned to another key
 */
const checkIfComboIsAssigned = (
    combo: string,
    target: HTMLElement,
    preferenceChildren: HTMLCollection
): string | undefined => {
    return Array.from(preferenceChildren).reduce<string | undefined>((acc, child) => {
        if (acc) return acc
        return getAssigneeFromPreference(child, combo, target)
    }, undefined)
}

/**
 * Get the assignee from a preference element if the combo matches
 */
const getAssigneeFromPreference = (
    preferenceElement: Element | null,
    combo: string,
    target: HTMLElement
): string | undefined => {
    const keyChild = preferenceElement?.children[1]?.children[0]
    const valueChild = preferenceElement?.children[1]?.children[1]

    if (keyChild instanceof HTMLElement && valueChild instanceof HTMLElement) {
        const assignee = keyChild.innerText
        if (valueChild.innerText === combo && 
            assignee !== (target.previousElementSibling as HTMLElement)?.innerText) {
            return assignee
        }
    }
    return undefined
}

/**
 * Set border style for edit element
 */
const setEditElementBorder = (color: string): void => {
    const editElement = document.getElementById('edit')
    if (editElement) {
        editElement.style.border = color === 'none' ? 'none' : `1.5px solid ${color}`
    }
}

/**
 * Update element direction
 */
export const elementDirection = (direct: string) => (): void => {
    if (simulationArea.lastSelected) {
        simulationArea.lastSelected.newDirection(direct.toUpperCase())
        updateSelectElement("select[name^='newDirection']", direct.toUpperCase())
        updateSystem()
    }
}

/**
 * Update label direction
 */
export const labelDirection = (direct: string) => (): void => {
    if (simulationArea.lastSelected && !simulationArea.lastSelected.labelDirectionFixed) {
        simulationArea.lastSelected.labelDirection = direct.toUpperCase()
        updateSelectElement("select[name^='newLabelDirection']", direct.toUpperCase())
        updateSystem()
    }
}

/**
 * Update select element value
 */
const updateSelectElement = (selector: string, value: string): void => {
    const selectElement = document.querySelector<HTMLSelectElement>(selector)
    if (selectElement) {
        selectElement.value = value
    }
}

/**
 * Insert label into input field
 */
export const insertLabel = (): void => {
    if (!simulationArea.lastSelected) return

    const labelInput = document.querySelector<HTMLInputElement>("input[name^='setLabel']")
    if (!labelInput) return

    focusAndSetLabel(labelInput)
    updateSystem()
}

/**
 * Focus on the label input and set a default value if empty
 */
const focusAndSetLabel = (labelInput: HTMLInputElement): void => {
    labelInput.focus()
    if (!labelInput.value) {
        labelInput.value = 'Untitled'
    }
    labelInput.select()
}

/**
 * Move element in a specific direction
 */
export const moveElement = (direct: DirectionType) => (): void => {
    if (simulationArea.lastSelected) {
        const { x, y } = simulationArea.lastSelected
        const newPosition = calculateNewPosition(direct, x, y)
        simulationArea.lastSelected.x = newPosition.x
        simulationArea.lastSelected.y = newPosition.y
        updateSystem()
    }
}

/**
 * Calculate new position based on direction
 */
const calculateNewPosition = (direct: DirectionType, x: number, y: number): { x: number; y: number } => {
    switch (direct) {
        case 'up': return { x, y: y - 10 }
        case 'down': return { x, y: y + 10 }
        case 'left': return { x: x - 10, y }
        case 'right': return { x: x + 10, y }
    }
}

/**
 * Open hotkey settings
 */
export const openHotkey = (): void => {
    document.getElementById('customShortcut')?.click()
}

/**
 * Open documentation
 */
export const openDocumentation = (): void => {
    const url = simulationArea.lastSelected?.helplink || 'https://docs.circuitverse.org/'
    window.open(url, '_blank')
}

/**
 * Update system state
 */
function updateSystem(): void {
    updateCanvasSet(true)
    wireToBeCheckedSet(1)
    scheduleUpdate(1)
}