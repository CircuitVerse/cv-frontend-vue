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
        const options = this.getOptions(opt);
        const ele = this.getTargetElement(options.target);
        shortcut_combination = shortcut_combination.toLowerCase();

        const func = this.createEventListener(shortcut_combination, callback, options);
        this.registerShortcut(shortcut_combination, func, ele, options.type || 'keydown');
    },

    remove: function (shortcut_combination: string): void {
        shortcut_combination = shortcut_combination.toLowerCase();
        const binding = this.all_shortcuts[shortcut_combination];

        if (binding) {
            this.unregisterShortcut(binding);
            delete this.all_shortcuts[shortcut_combination];
        } else {
            console.warn(`No binding found for shortcut: ${shortcut_combination}`);
        }
    },

    removeAll: function (): void {
        const failures: string[] = [];
        Object.keys(this.all_shortcuts).forEach(shortcut => {
            try {
                this.remove(shortcut);
            } catch (error) {
                failures.push(shortcut);
                console.error(`Failed to remove shortcut ${shortcut}: ${error}`);
            }
        });
        if (failures.length > 0) {
            console.warn(`Failed to remove ${failures.length} shortcuts: ${failures.join(', ')}`);
        }
    },

    getOptions: function (opt?: ShortcutOptions): ShortcutOptions {
        const default_options: ShortcutOptions = {
            type: 'keydown',
            propagate: false,
            disable_in_input: true,
            target: document,
            keycode: false,
        };
        return opt ? { ...default_options, ...opt } : default_options;
    },

    getTargetElement: function (target: Document | string | undefined): Document | HTMLElement {
        if (typeof target === 'string') {
            return document.getElementById(target) || document;
        }
        return target || document;
    },

    createEventListener: function (shortcut_combination: string, callback: (e: KeyboardEvent) => void, options: ShortcutOptions): EventListener {
        return (evt: Event): void => {
            const e = evt as KeyboardEvent;

            if (this.shouldIgnoreEvent(e, options)) {
                return;
            }

            if (this.isShortcutMatch(shortcut_combination, e, options)) {
                this.handleShortcutMatch(e, callback, options);
            }
        };
    },

    shouldIgnoreEvent: function (e: KeyboardEvent, options: ShortcutOptions): boolean {
        return (options.disable_in_input ?? true) && this.isInputElement(e.target as HTMLElement);
    },

    handleShortcutMatch: function (e: KeyboardEvent, callback: (e: KeyboardEvent) => void, options: ShortcutOptions): void {
        callback(e);

        if (!options.propagate) {
            e.stopPropagation();
            e.preventDefault();
        }
    },

    isInputElement: function (element: HTMLElement): boolean {
        if (element.nodeType === 3 && element.parentNode) {
            element = element.parentNode as HTMLElement;
        } else if (element.nodeType === 3) {
            return true;
        }
        return element.tagName === 'INPUT' || element.tagName === 'TEXTAREA';
    },

    isShortcutMatch: function (shortcut_combination: string, e: KeyboardEvent, options: ShortcutOptions): boolean {
        const keys = shortcut_combination.split('+');
        const modifiers = this.getModifiersState(keys, e);
        const character = this.getCharacterFromKeyCode(e);

        return this.checkKeysMatch(keys, character, e, options) &&
               this.checkModifiersMatch(modifiers);
    },

    getModifiersState: function (keys: string[], e: KeyboardEvent): Record<string, ModifierState> {
        const modifiers: Record<string, ModifierState> = {
            shift: { wanted: false, pressed: e.shiftKey },
            ctrl: { wanted: false, pressed: e.ctrlKey },
            alt: { wanted: false, pressed: e.altKey },
            meta: { wanted: false, pressed: e.metaKey }
        };

        keys.forEach(k => {
            if (k === 'ctrl' || k === 'control') modifiers.ctrl.wanted = true;
            else if (k === 'shift') modifiers.shift.wanted = true;
            else if (k === 'alt') modifiers.alt.wanted = true;
            else if (k === 'meta') modifiers.meta.wanted = true;
        });

        return modifiers;
    },

    getCharacterFromKeyCode: function (e: KeyboardEvent): string {
        const code = e.keyCode || e.which;
        let character = String.fromCharCode(code).toLowerCase();

        if (code === 188) character = ',';
        if (code === 190) character = '.';

        return character;
    },

    checkKeysMatch: function (keys: string[], character: string, e: KeyboardEvent, options: ShortcutOptions): boolean {
        let kp = 0;

        keys.forEach(k => {
            if (this.isModifierKey(k)) {
                kp++;
            } else if (this.isSpecialKeyMatch(k, e)) {
                kp++;
            } else if (options.keycode && this.isKeyCodeMatch(options.keycode, e)) {
                kp++;
            } else if (this.isCharacterMatch(k, character, e)) {
                kp++;
            }
        });

        return kp === keys.length;
    },

    isModifierKey: function (key: string): boolean {
        return key === 'ctrl' || key === 'control' || key === 'shift' || key === 'alt' || key === 'meta';
    },

    isSpecialKeyMatch: function (key: string, e: KeyboardEvent): boolean {
        const special_keys: Record<string, number> = {
            esc: 27, escape: 27, tab: 9, space: 32, return: 13, enter: 13, backspace: 8,
            scrolllock: 145, scroll_lock: 145, scroll: 145, capslock: 20, caps_lock: 20, caps: 20,
            numlock: 144, num_lock: 144, num: 144, pause: 19, break: 19, insert: 45, home: 36,
            delete: 46, end: 35, pageup: 33, page_up: 33, pu: 33, pagedown: 34, page_down: 34, pd: 34,
            left: 37, up: 38, right: 39, down: 40, f1: 112, f2: 113, f3: 114, f4: 115, f5: 116,
            f6: 117, f7: 118, f8: 119, f9: 120, f10: 121, f11: 122, f12: 123
        };

        return special_keys[key] === (e.keyCode || e.which);
    },

    isKeyCodeMatch: function (keycode: number | false, e: KeyboardEvent): boolean {
        return keycode === (e.keyCode || e.which);
    },

    isCharacterMatch: function (key: string, character: string, e: KeyboardEvent): boolean {
        const shift_nums: Record<string, string> = {
            '`': '~', 1: '!', 2: '@', 3: '#', 4: '$', 5: '%', 6: '^', 7: '&', 8: '*', 9: '(', 0: ')',
            '-': '_', '=': '+', ';': ':', "'": '"', ',': '<', '.': '>', '/': '?', '\\': '|'
        };

        if (character === key) {
            return true;
        } else if (shift_nums[character] && e.shiftKey) {
            return shift_nums[character] === key;
        }

        return false;
    },

    checkModifiersMatch: function (modifiers: Record<string, ModifierState>): boolean {
        return modifiers.ctrl.pressed === modifiers.ctrl.wanted &&
               modifiers.shift.pressed === modifiers.shift.wanted &&
               modifiers.alt.pressed === modifiers.alt.wanted &&
               modifiers.meta.pressed === modifiers.meta.wanted;
    },

    registerShortcut: function (shortcut_combination: string, func: EventListener, ele: Document | HTMLElement, event: string): void {
        this.all_shortcuts[shortcut_combination] = {
            callback: func,
            target: ele,
            event: event
        };

        if (ele.addEventListener) {
            ele.addEventListener(event, func, false);
        } else if ((ele as any).attachEvent) {
            (ele as any).attachEvent('on' + event, func);
        } else {
            (ele as any)['on' + event] = func;
        }
    },

    unregisterShortcut: function (binding: ShortcutBinding): void {
        const { target, callback, event } = binding;

        try {
            if (target.removeEventListener) {
                target.removeEventListener(event, callback);
            } else if ((target as any).detachEvent) {
                (target as any).detachEvent('on' + event, callback);
            } else {
                (target as any)['on' + event] = null;
            }
        } catch (error) {
            console.warn(`Failed to remove event Listener: ${error}`);
        }
    }
};