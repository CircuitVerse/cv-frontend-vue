import { setUserKeys } from '../model/actions'

/**
 * fn to update the hotkey panel UI with the currently set configuration
 * @param {string} mode user preferred if present, or default keys configuration
 */
export const updateHTML = (mode) => {
    const preferenceChildren = document.querySelector('#preference').children
    const keys =
        mode === 'user'
            ? localStorage.get('userKeys')
            : localStorage.get('defaultKeys')
    Array.from(preferenceChildren).forEach((child) => {
        const key = child.children[1].children[0].innerText
        child.children[1].children[1].innerText = keys[key]
    })
}
/**
 * fn to override key of duplicate entries
 * old entry will be left blank & keys will be assigned to the new target
 * @param {*} combo
 */
export const override = (combo) => {
    let x = 0
    const preference = document.querySelector('#preference')
    while (preference.children[x]) {
        if (preference.children[x].children[1].children[1].innerText === combo)
            preference.children[x].children[1].children[1].innerText = ''
        x++
    }
}

export const closeEdit = () => {
    document.querySelector('#pressedKeys').textContent = ''
    document.querySelector('#edit').style.display = 'none'
}

export const submit = () => {
    document.querySelector('#edit').style.display = 'none'
    setUserKeys()
    updateHTML('user')
}
