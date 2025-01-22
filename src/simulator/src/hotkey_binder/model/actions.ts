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

interface KeyMap {
    [key: string]: string
}

interface SimulationArea {
    lastSelected?: {
        newDirection: (direction: string) => void
        labelDirection: string
        labelDirectionFixed?: boolean
        x: number
        y: number
        helplink?: string
    }
}

type DirectionType = 'up' | 'down' | 'left' | 'right'

/**
 * Function used to add or change keys user or default
 * grabs the keycombo from localstorage &
 * calls the addShortcut function in a loop to bind them
 * @param {string} mode - user custom keys or default keys
 */
export const addKeys = (mode: 'user' | 'default'): void => {
    shortcut.removeAll()
    if (mode === 'user') {
        localStorage.removeItem('defaultKeys')
        const userKeys: KeyMap = JSON.parse(localStorage.getItem('userKeys') || '{}')
        for (const pref in userKeys) {
            let key = userKeys[pref]
            key = key.split(' ').join('')
            addShortcut(key, pref)
        }
        updateHTML('user')
    } else if (mode === 'default') {
        if (localStorage.userKeys) localStorage.removeItem('userKeys')
        const defaultKeys: KeyMap = JSON.parse(localStorage.getItem('defaultKeys') || '{}')
        for (const pref in defaultKeys) {
            let key = defaultKeys[pref]
            key = key.split(' ').join('')
            addShortcut(key, pref)
        }
        updateHTML('default')
    }
}

/**
 * Function used to check if new keys are added, adds missing keys if added
 */
export const checkUpdate = (): void => {
    const userK: KeyMap = localStorage.get('userKeys')
    if (Object.keys(userK).length !== Object.keys(defaultKeys).length) {
        for (const [key, value] of Object.entries(defaultKeys)) {
            if (!Object.keys(userK).includes(key)) {
                userK[key] = value
            }
        }
        localStorage.set('userKeys', userK)
    }
}

/**
 * Function used to set userKeys, grabs the keycombo from the panel UI
 * sets it to the localStorage & cals addKeys
 * removes the defaultkeys from localStorage
 */
export const setUserKeys = (): void => {
    if (localStorage.defaultKeys) localStorage.removeItem('defaultKeys')
    const userKeys: KeyMap = {}
    
    const preferenceChildren = document.getElementById('preference')?.children
    if (!preferenceChildren) return
    
    let x = 0
    while (x < preferenceChildren.length) {
        const keyChild = preferenceChildren[x]?.children[1]?.children[0]
        const valueChild = preferenceChildren[x]?.children[1]?.children[1]
        
        if (keyChild instanceof HTMLElement && valueChild instanceof HTMLElement) {
            userKeys[keyChild.innerText] = valueChild.innerText
        }
        x++
    }
    
    localStorage.set('userKeys', userKeys)
    addKeys('user')
}

/**
 * Function used to set defaultKeys, grabs the keycombo from the defaultkeys metadata
 * sets it to the localStorage & cals addKeys
 * removes the userkeys from localStorage if present
 * also checks for OS type
 */
export const setDefault = (): void => {
    if (localStorage.userKeys) localStorage.removeItem('userKeys')
    if (getOS() === 'MacOS') {
        const macDefaultKeys: KeyMap = {}
        for (const [key, value] of Object.entries(defaultKeys)) {
            macDefaultKeys[key] = value.split(' + ')[0] === 'Ctrl'
                ? value.replace('Ctrl', 'Meta')
                : value
            localStorage.set('defaultKeys', macDefaultKeys)
        }
    } else {
        localStorage.set('defaultKeys', defaultKeys)
    }
    addKeys('default')
}

/**
 * function to check if user entered keys are already assigned to other key
 * gives a warning message if keys already assigned
 */
export const warnOverride = (
    combo: string,
    target: HTMLElement,
    warning: HTMLInputElement
): void => {
    const preferenceChildren = document.getElementById('preference')?.children
    if (!preferenceChildren) return
    
    let x = 0
    while (x < preferenceChildren.length) {
        const keyChild = preferenceChildren[x]?.children[1]?.children[0]
        const valueChild = preferenceChildren[x]?.children[1]?.children[1]
        
        if (keyChild instanceof HTMLElement && valueChild instanceof HTMLElement) {
            const assignee = keyChild.innerText
            if (valueChild.innerText === combo && 
                assignee !== (target.previousElementSibling as HTMLElement)?.innerText) {
                warning.value = `This key(s) is already assigned to: ${assignee}, press Enter to override.`
                const editElement = document.getElementById('edit')
                if (editElement) {
                    editElement.style.border = '1.5px solid #dc5656'
                }
                return
            }
        }
        
        const editElement = document.getElementById('edit')
        if (editElement) {
            editElement.style.border = 'none'
        }
        x++
    }
}

export const elementDirection = (direct: string) => (): void => {
    if (simulationArea.lastSelected) {
        simulationArea.lastSelected.newDirection(direct.toUpperCase())

        const selectElement = document.querySelector<HTMLSelectElement>("select[name^='newDirection']")
        if (selectElement) {
            selectElement.value = direct.toUpperCase()
        }

        updateSystem()
    }
}

export const labelDirection = (direct: string) => (): void => {
    if (simulationArea.lastSelected && !simulationArea.lastSelected.labelDirectionFixed) {
        simulationArea.lastSelected.labelDirection = direct.toUpperCase()
        const selectElement = document.querySelector<HTMLSelectElement>("select[name^='newLabelDirection']")
        if (selectElement) {
            selectElement.value = direct.toUpperCase()
        }
        updateSystem()
    }
}

export const insertLabel = (): void => {
    if (simulationArea.lastSelected) {
        const labelInput = document.querySelector<HTMLInputElement>("input[name^='setLabel']")
        if (labelInput) {
            labelInput.focus()
            if (!labelInput.value) {
                labelInput.value = 'Untitled'
            }
            labelInput.select()
            updateSystem()
        }
    }
}

export const moveElement = (direct: DirectionType) => (): void => {
    if (simulationArea.lastSelected) {
        switch (direct) {
            case 'up':
                simulationArea.lastSelected.y -= 10
                break
            case 'down':
                simulationArea.lastSelected.y += 10
                break
            case 'left':
                simulationArea.lastSelected.x -= 10
                break
            case 'right':
                simulationArea.lastSelected.x += 10
                break
        }
        updateSystem()
    }
}

export const openHotkey = (): void => {
    const customShortcutElement = document.getElementById('customShortcut')
    if (customShortcutElement) {
        customShortcutElement.click()
    }
}

export const openDocumentation = (): void => {
    if (
        simulationArea.lastSelected === undefined ||
        simulationArea.lastSelected.helplink === undefined
    ) {
        window.open('https://docs.circuitverse.org/', '_blank')
    } else {
        window.open(simulationArea.lastSelected.helplink, '_blank')
    }
}

function updateSystem(): void {
    updateCanvasSet(true)
    wireToBeCheckedSet(1)
    scheduleUpdate(1)
}