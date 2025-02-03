//This file holds the interfaces required for src/simulator/src/hotkey_binder/model
//to be continued for storing interfaces of the parent folder

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

export interface Storage {
    set<T>(key: string, obj: T): void;
    get<T>(key: string): T | null;
}

export interface SimulationArea {
    lastSelected?: {
        newDirection: (direction: string) => void
        labelDirection: string
        labelDirectionFixed?: boolean
        x: number
        y: number
        helplink?: string
    }
}