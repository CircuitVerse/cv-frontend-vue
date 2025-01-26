/**
 * http://www.openjs.com/scripts/events/keyboard_shortcuts/
 * Version : 2.01.B
 * By Binny V A
 * License : BSD
 */

/**
 * Restrictions:
 *  The shortcut key combination should be specified in this format ... Modifier[+Modifier..]+Key.
 *  Can have a single key without Modifier .. Key, not Key + Key
 *  These restrictions must be be hardcoded to not let users input invalid key combo
 * There is no way to override Ctrl+N, Ctrl+T, or Ctrl+W in Google Chrome since version 4 of Chrome (shipped in 2010).
 *
 **/

//*! This plugin has been modified

interface ShortcutOptions {
    type?: string
    propagate?: boolean
    disable_in_input?: boolean
    target?: Document | string
    keycode?: number | false
}

interface ShortcutBinding {
    callback: EventListener
    target: Document | HTMLElement
    event: string
}

interface ModifierState {
    wanted: boolean
    pressed: boolean
}

export const shortcut = {
    all_shortcuts: {} as Record<string, ShortcutBinding>,

    add: function (shortcut_combination: string, callback: (e: KeyboardEvent) => void, opt?: ShortcutOptions): void {
        const default_options: ShortcutOptions = {
            type: 'keydown',
            propagate: false,
            disable_in_input: true,
            target: document,
            keycode: false,
        }

        const options: ShortcutOptions = opt ? { ...default_options, ...opt } : default_options

        let ele: Document | HTMLElement = options.target as Document | HTMLElement
        if (typeof options.target === 'string') {
            ele = document.getElementById(options.target) || document
        }

        shortcut_combination = shortcut_combination.toLowerCase()

        const func: EventListener = (evt: Event): void => {
            const e = evt as KeyboardEvent

            if (options.disable_in_input) {
                let element = e.target as HTMLElement
                if (element.nodeType === 3 && element.parentNode) {
                        element = element.parentNode as HTMLElement
                    } else if (element.nodeType === 3) {
                        return
                    }

                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    return
                }
            }

            const code = e.keyCode || e.which
            let character = String.fromCharCode(code).toLowerCase()

            if (code === 188) character = ','
            if (code === 190) character = '.'

            const keys = shortcut_combination.split('+')
            let kp = 0

            const shift_nums: Record<string, string> = {
                '`': '~', 1: '!', 2: '@', 3: '#', 4: '$', 5: '%', 
                6: '^', 7: '&', 8: '*', 9: '(', 0: ')', 
                '-': '_', '=': '+', ';': ':', "'": '"', 
                ',': '<', '.': '>', '/': '?', '\\': '|'
            }

            const special_keys: Record<string, number> = {
                esc: 27, escape: 27, tab: 9, space: 32, 
                return: 13, enter: 13, backspace: 8,
                scrolllock: 145, scroll_lock: 145, scroll: 145,
                capslock: 20, caps_lock: 20, caps: 20,
                numlock: 144, num_lock: 144, num: 144,
                pause: 19, break: 19, insert: 45, 
                home: 36, delete: 46, end: 35,
                pageup: 33, page_up: 33, pu: 33,
                pagedown: 34, page_down: 34, pd: 34,
                left: 37, up: 38, right: 39, down: 40,
                f1: 112, f2: 113, f3: 114, f4: 115, f5: 116,
                f6: 117, f7: 118, f8: 119, f9: 120, 
                f10: 121, f11: 122, f12: 123
            }

            const modifiers: Record<string, ModifierState> = {
                shift: { wanted: false, pressed: false },
                ctrl: { wanted: false, pressed: false },
                alt: { wanted: false, pressed: false },
                meta: { wanted: false, pressed: false }
            }

            modifiers.ctrl.pressed = e.ctrlKey
            modifiers.shift.pressed = e.shiftKey
            modifiers.alt.pressed = e.altKey
            modifiers.meta.pressed = e.metaKey

            for (let i = 0; i < keys.length; i++) {
                const k = keys[i]
                if (k === 'ctrl' || k === 'control') {
                    kp++
                    modifiers.ctrl.wanted = true
                } else if (k === 'shift') {
                    kp++
                    modifiers.shift.wanted = true
                } else if (k === 'alt') {
                    kp++
                    modifiers.alt.wanted = true
                } else if (k === 'meta') {
                    kp++
                    modifiers.meta.wanted = true
                } else if (k.length > 1) {
                    if (special_keys[k] === code) kp++
                } else if (options.keycode) {
                    if (options.keycode === code) kp++
                } else {
                    if (character === k) kp++
                    else if (shift_nums[character] && e.shiftKey) {
                        character = shift_nums[character]
                        if (character === k) kp++
                    }
                }
            }

            if (
                kp === keys.length &&
                modifiers.ctrl.pressed === modifiers.ctrl.wanted &&
                modifiers.shift.pressed === modifiers.shift.wanted &&
                modifiers.alt.pressed === modifiers.alt.wanted &&
                modifiers.meta.pressed === modifiers.meta.wanted
            ) {
                callback(e)

                if (!options.propagate) {
                    e.stopPropagation()
                    e.preventDefault()
                }
            }
        }

        this.all_shortcuts[shortcut_combination] = {
            callback: func,
            target: ele,
            event: options.type || 'keydown'
        }

        if (ele.addEventListener) {
            ele.addEventListener(options.type || 'keydown', func, false)
        } else if ((ele as any).attachEvent) {
            (ele as any).attachEvent('on' + (options.type || 'keydown'), func)
        } else {
            (ele as any)['on' + (options.type || 'keydown')] = func
        }
    },

    remove: function (shortcut_combination: string): void {
        shortcut_combination = shortcut_combination.toLowerCase()
        const binding = this.all_shortcuts[shortcut_combination]
        
        if (binding) {
            const { target, callback, event } = binding

            try{
                if (target.removeEventListener) {
                    target.removeEventListener(event, callback)
                } else if ((target as any).detachEvent) {
                    (target as any).detachEvent('on' + event, callback)
                } else {
                    (target as any)['on' + event] = null
                }
            } catch (error) {
                console.warn('Failed to remove event Listener:  ${error}'  )
            }
            
            delete this.all_shortcuts[shortcut_combination]
        }   else {
            console.warn('No binding found for shortcut: ${shortcut_combination}')
        }
    },

    removeAll: function (): void {
        const failures: string[] = []
    Object.keys(this.all_shortcuts).forEach(shortcut => {
        try {
            this.remove(shortcut)
        } catch (error) {
            failures.push(shortcut)
            console.error(`Failed to remove shortcut ${shortcut}: ${error}`)
        }
    })
    if (failures.length > 0) {
        console.warn(`Failed to remove ${failures.length} shortcuts: ${failures.join(', ')}`)
        }   
    }
}
