import {
    elementDirection,
    insertLabel,
    labelDirection,
    openHotkey,
    moveElement,
    openDocumentation,
} from './actions.js'
import save from '../../data/save.js'
import { saveOffline, openOffline } from '../../data/project.js'
import createSaveAsImgPrompt from '../../data/saveImage.js'
import { createSubCircuitPrompt } from '../../subcircuit.js'
import { createCombinationalAnalysisPrompt } from '../../combinationalAnalysis.js'
import { shortcut } from './shortcuts.plugin.js'
import logixFunction from '../../data.js'
import { ActionType, ShortcutOptions } from './model.types.js'

// Add space after comment as per linter rule
// Assign the callback func for the keymap here

export default function addShortcut(keys: string, action: ActionType): void {
    let callback: () => void = () => console.error('No shortcut found..')
    
    switch (action) {
        case 'New Circuit':
            callback = logixFunction.createNewCircuitScope // TODO: directly call rather than using dom click
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
    }

    const options: ShortcutOptions = {
        type: 'keydown',
        propagate: false,
        target: document,
        disable_in_input: true,
    }

    shortcut.add(keys, callback, options)
} 