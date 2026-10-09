import { setUserKeys } from '../model/actions'

/**
 * fn to update the hotkey panel UI with the currently set configuration
 * @param {string} mode user preferred if present, or default keys configuration
 */
export const updateHTML = (mode) => {
    let x = 0
    let keys = {}
    try {
        const raw = localStorage.getItem(
            mode === 'user' ? 'userKeys' : 'defaultKeys'
        )
        keys = raw ? JSON.parse(raw) : {}
    } catch {
        keys = {}
    }
    while ($('#preference').children()[x]) {
        const command =
            $('#preference').children()[x]?.children[1]?.children[0]?.innerText
        const keywordElem =
            $('#preference').children()[x]?.children[1]?.children[1]
        if (command && keywordElem && keys[command] !== undefined) {
            keywordElem.innerText = keys[command]
        }
        x++
    }
}
/**
 * fn to override key of duplicate entries
 * old entry will be left blank & keys will be assigned to the new target
 * @param {*} combo
 */
export const override = (combo) => {
    let x = 0
    while ($('#preference').children()[x]) {
        const keywordElem = $('#preference').children()[x]?.children[1]?.children[1]
        if (keywordElem && keywordElem.innerText === combo) {
            keywordElem.innerText = ''
        }
        x++
    }
}

export const closeEdit = () => {
    $('#pressedKeys').text('')
    $('#edit').css('display', 'none')
}

export const submit = () => {
    $('#edit').css('display', 'none')
    setUserKeys()
    updateHTML('user')
}
