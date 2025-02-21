//This file holds the interfaces required for src/simulator/src/hotkey_binder/model
//to be continued for storing interfaces of the parent folder

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

export interface ShortcutOptions {
    type?: string
    propagate?: boolean
    disable_in_input?: boolean
    target?: Document | string
    keycode?: number | false
}

export interface ShortcutBinding {
    callback: EventListener
    target: Document | HTMLElement
    event: string
}

export interface ModifierState {
    wanted: boolean
    pressed: boolean
}

export interface KeyMap {
    [key: string]: string
}
