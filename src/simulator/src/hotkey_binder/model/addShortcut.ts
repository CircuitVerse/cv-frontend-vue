import {
    elementDirection,
    insertLabel,
    labelDirection,
    openHotkey,
    moveElement,
    openDocumentation,
} from './actions'
import save from '../../data/save'
import { saveOffline, openOffline } from '../../data/project'
import createSaveAsImgPrompt from '../../data/saveImage'
import { createSubCircuitPrompt } from '../../subcircuit'
import { createCombinationalAnalysisPrompt } from '../../combinationalAnalysis'
import { shortcut } from './shortcuts.plugin'
import logixFunction from '../../data'
import { ShortcutOptions } from './model.types'

export type ActionType =
    | 'New Circuit'
    | 'Save Online'
    | 'Save Offline'
    | 'Download as Image'
    | 'Open Offline'
    | 'Insert Sub-circuit'
    | 'Combinational Analysis'
    | 'Direction Up'
    | 'Direction Down'
    | 'Direction Left'
    | 'Direction Right'
    | 'Insert Label'
    | 'Label Direction Up'
    | 'Label Direction Down'
    | 'Label Direction Left'
    | 'Label Direction Right'
    | 'Move Element Up'
    | 'Move Element Down'
    | 'Move Element Left'
    | 'Move Element Right'
    | 'Hotkey Preference'
    | 'Open Documentation'

export const addShortcut = (
    keys: string,
    action: ActionType,
    customOptions?: Partial<ShortcutOptions>
): void => {
    let callback: (() => void) | (() => Promise<void>)

    switch (action) {
        case 'New Circuit':
            callback = logixFunction.createNewCircuitScope
            break
        case 'Save Online':
            callback = save
            break
        case 'Save Offline':
            callback = saveOffline
            break
        case 'Download as Image':
            callback = createSaveAsImgPrompt
            break
        case 'Open Offline':
            callback = openOffline
            break
        case 'Insert Sub-circuit':
            callback = createSubCircuitPrompt
            break
        case 'Combinational Analysis':
            callback = createCombinationalAnalysisPrompt
            break
        case 'Direction Up':
            callback = elementDirection('up')
            break
        case 'Direction Down':
            callback = elementDirection('down')
            break
        case 'Direction Left':
            callback = elementDirection('left')
            break
        case 'Direction Right':
            callback = elementDirection('right')
            break
        case 'Insert Label':
            callback = insertLabel
            break
        case 'Label Direction Up':
            callback = labelDirection('up')
            break
        case 'Label Direction Down':
            callback = labelDirection('down')
            break
        case 'Label Direction Left':
            callback = labelDirection('left')
            break
        case 'Label Direction Right':
            callback = labelDirection('right')
            break
        case 'Move Element Up':
            callback = moveElement('up')
            break
        case 'Move Element Down':
            callback = moveElement('down')
            break
        case 'Move Element Left':
            callback = moveElement('left')
            break
        case 'Move Element Right':
            callback = moveElement('right')
            break
        case 'Hotkey Preference':
            callback = openHotkey
            break
        case 'Open Documentation':
            callback = openDocumentation
            break
        default:
            callback = () => console.error('No shortcut found..')
    }

    const options: ShortcutOptions = {
        type: 'keydown',
        propagate: false,
        target: document,
        disable_in_input: true,
        ...customOptions
    }

    shortcut.add(keys, callback, options)
}