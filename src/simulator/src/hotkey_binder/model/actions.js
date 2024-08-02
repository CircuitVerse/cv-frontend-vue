import { defaultKeys } from '../defaultKeys'
import { addShortcut } from './addShortcut'
import { updateHTML } from '../view/panel.ui'
import { simulationArea } from '../../simulationArea'
import {
    scheduleUpdate,
    wireToBeCheckedSet,
    updateCanvasSet,
} from '../../engine'

import { getOS } from './utils.js'
import { shortcut } from './shortcuts.plugin.js'
/**
 * Function used to add or change keys user or default
 * grabs the keycombo from localstorage &
 * calls the addShortcut function in a loop to bind them
 * @param {string} mode - user custom keys or default keys
 */
export const addKeys = (mode) => {
    shortcut.removeAll()
    if (mode === 'user') {
        localStorage.removeItem('defaultKeys')
        let userKeys = localStorage.get('userKeys')
        for (let pref in userKeys) {
            let key = userKeys[pref]
            key = key.split(' ').join('')
            addShortcut(key, pref)
        }
        updateHTML('user')
    } else if (mode == 'default') {
        if (localStorage.userKeys) localStorage.removeItem('userKeys')
        let defaultKeys = localStorage.get('defaultKeys')
        for (let pref in defaultKeys) {
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
export const checkUpdate = () => {
    const userK = localStorage.get('userKeys')
    if (Object.size(userK) !== Object.size(defaultKeys)) {
        for (const [key, value] of Object.entries(defaultKeys)) {
            if (!Object.keys(userK).includes(key)) {
                userK[key] = value
            }
        }
        localStorage.set('userKeys', userK)
    } else {
        return
    }
}
/**
 * Function used to set userKeys, grabs the keycombo from the panel UI
 * sets it to the localStorage & cals addKeys
 * removes the defaultkeys from localStorage
 */
export const setUserKeys = () => {
    if (localStorage.defaultKeys) localStorage.removeItem('defaultKeys')
    let userKeys = {}
    let x = 0
    while (document.getElementById('#preference').children()[x]) {
        userKeys[
            document.getElementById('#preference').children()[x].children[1].children[0].innerText
        ] = document.getElementById('#preference').children()[x].children[1].children[1].innerText
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
export const setDefault = () => {
    if (localStorage.userKeys) localStorage.removeItem('userKeys')
    if (getOS() === 'MacOS') {
        const macDefaultKeys = {}
        for (let [key, value] of Object.entries(defaultKeys)) {
            if (value.split(' + ')[0] == 'Ctrl');
            macDefaultKeys[key] =
                value.split(' + ')[0] == 'Ctrl'
                    ? value.replace('Ctrl', 'Meta')
                    : value
            localStorage.set('defaultKeys', macDefaultKeys)
        }
    } else {
        localStorage.set('defaultKeys', defaultKeys) //TODO add a confirmation alert
    }
    addKeys('default')
}
/**
 * function to check if user entered keys are already assigned to other key
 * gives a warning message if keys already assigned
 * @param {string} combo the key combo
 * @param {string} target the target option of the panel
 */
export const warnOverride = (combo, target, warning) => {
    let x = 0
    while (document.getElementById('#preference').children()[x]) {
        if (
            document.getElementById('#preference').children()[x].children[1].children[1].innerText ===
            combo &&
            document.getElementById('#preference').children()[x].children[1].children[0].innerText !==
            target.previousElementSibling.innerText
        ) {
            const assignee =
                document.getElementById('#preference').children()[x].children[1].children[0].innerText
            // $('#warning').text(
            //     `This key(s) is already assigned to: ${assignee}, press Enter to override.`
            // )
            warning.value = `This key(s) is already assigned to: ${assignee}, press Enter to override.`
            document.getElementById('#edit').style.border = '1.5px solid #dc5656'
            return
        } else {
            document.getElementById('#edit').style.border = 'none'
        }
        x++
    }
}

export const elementDirection = (direct) => () => {
    if (simulationArea.lastSelected) {
        simulationArea.lastSelected.newDirection(direct.toUpperCase())
        document.querySelector("select[name |= 'newDirection']").value = direct.toUpperCase()
        updateSystem()
    }
}

export const labelDirection = (direct) => () => {
    if (
        simulationArea.lastSelected &&
        !simulationArea.lastSelected.labelDirectionFixed
    ) {
        simulationArea.lastSelected.labelDirection = direct.toUpperCase()
        document.querySelector("select[name |= 'newLabelDirection']").value = direct.toUpperCase()
        updateSystem()
    }
}

export const insertLabel = () => {
    if (simulationArea.lastSelected) {
        document.querySelector("input[name |= 'setLabel']").focus()
        document.querySelector("input[name |= 'setLabel']").value.length
            ? null
            : document.querySelector("input[name |= 'setLabel']").value('Untitled')
        document.querySelector("input[name |= 'setLabel']").select()
        updateSystem()
    }
}

export const moveElement = (direct) => () => {
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

export const openHotkey = () => document.querySelector('#customShortcut').click()

export const createNewCircuitScopeCall = () => {
    const createNewCircuitScopeElement = document.querySelector('#createNewCircuitScope');
    if (createNewCircuitScopeElement) {
        createNewCircuitScopeElement.click();
    }
} // TODO: remove later

export const openDocumentation = () => {
    if (
        simulationArea.lastSelected == undefined ||
        simulationArea.lastSelected.helplink == undefined
    ) {
        // didn't select any element or documentation not found
        window.open('https://docs.circuitverse.org/', '_blank')
    } else {
        window.open(simulationArea.lastSelected.helplink, '_blank')
    }
}

function updateSystem() {
    updateCanvasSet(true)
    wireToBeCheckedSet(1)
    scheduleUpdate(1)
}
