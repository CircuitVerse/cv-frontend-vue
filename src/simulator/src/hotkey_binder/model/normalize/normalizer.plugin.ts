interface KeyCodeType {
    no_conflict: () => KeyCodeType;
    fkey: (num: number) => number;
    numkey: (num: number | string) => number;
    key: (str: string) => number;
    key_equals: (key1: KeyEvent, key2: KeyEvent) => boolean;
    translate_key_code: (code: number) => number;
    translate_event: (e: KeyboardEvent) => KeyEvent;
    key_down: (e: KeyboardEvent) => void;
    key_up: (e: KeyboardEvent) => void;
    is_down: (key: KeyEvent) => boolean;
    hot_key: (key: KeyEvent) => string;
    [key: string]: any; // For dynamic key constants
}

interface KeyEvent {
    code: number;
    shift: boolean;
    alt: boolean;
    ctrl: boolean;
    meta: boolean;
}

interface CurrentKeys {
    codes: { [key: number]: number };
    ctrl: boolean;
    alt: boolean;
    shift: boolean;
    meta: boolean;
}

const modifiers: string[] = ['ctrl', 'alt', 'shift', 'meta'];
const KEY_MAP: { [key: number]: number } = {};

const shifted_symbols: { [key: number]: number } = {
    58: 59, // : -> ;
    43: 61, // = -> +
    60: 44, // < -> ,
    95: 45, // _ -> -
    62: 46, // > -> .
    63: 47, // ? -> /
    96: 192, // ` -> ~
    124: 92, // | -> \
    39: 222, // ' -> 222
    34: 222, // " -> 222
    33: 49, // ! -> 1
    64: 50, // @ -> 2
    35: 51, // # -> 3
    36: 52, // $ -> 4
    37: 53, // % -> 5
    94: 54, // ^ -> 6
    38: 55, // & -> 7
    42: 56, // * -> 8
    40: 57, // ( -> 9
    41: 58, // ) -> 0
    123: 91, // { -> [
    125: 93, // } -> ]
};

function isLower(ascii: number): boolean {
    return ascii >= 97 && ascii <= 122;
}

function capitalize(str: string): string {
    return str.substr(0, 1).toUpperCase() + str.substr(1).toLowerCase();
}

const is_gecko = navigator.userAgent.indexOf('Gecko') != -1;
const is_ie = navigator.userAgent.indexOf('MSIE') != -1;
const is_windows = navigator.platform.indexOf('Win') != -1;
const is_opera = window.opera && (window.opera as any).version() < 9.5;
const is_konqueror = navigator.vendor && navigator.vendor.indexOf('KDE') != -1;
const is_icab = navigator.vendor && navigator.vendor.indexOf('iCab') != -1;

const GECKO_IE_KEYMAP: { [key: number]: number } = {
    186: 59, // ;: in IE
    187: 61, // =+ in IE
    188: 44, // ,<
    109: 95, // -_ in Mozilla
    107: 61, // =+ in Mozilla
    189: 95, // -_ in IE
    190: 62, // .>
    191: 47, // /?
    192: 126, // `~
    219: 91, // {[
    220: 92, // \|
    221: 93, // }]
};

const OPERA_KEYMAP: { [key: number]: number } = {};

// Browser detection and keymap setup
if (is_opera && is_windows) {
    Object.assign(KEY_MAP, OPERA_KEYMAP);
} else if (is_opera || is_konqueror || is_icab) {
    const unshift = [33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 58, 43, 60, 95, 62, 63, 124, 34];
    Object.assign(KEY_MAP, OPERA_KEYMAP);
    for (const code of unshift) {
        KEY_MAP[code] = shifted_symbols[code];
    }
} else {
    Object.assign(KEY_MAP, GECKO_IE_KEYMAP);
}

if (is_konqueror) {
    KEY_MAP[0] = 45;
    KEY_MAP[127] = 46;
    KEY_MAP[45] = 95;
}

const key_names: { [key: number]: string } = {
    32: 'SPACE',
    13: 'ENTER',
    9: 'TAB',
    8: 'BACKSPACE',
    16: 'SHIFT',
    17: 'CTRL',
    18: 'ALT',
    20: 'CAPS_LOCK',
    144: 'NUM_LOCK',
    145: 'SCROLL_LOCK',
    37: 'LEFT',
    38: 'UP',
    39: 'RIGHT',
    40: 'DOWN',
    33: 'PAGE_UP',
    34: 'PAGE_DOWN',
    36: 'HOME',
    35: 'END',
    45: 'INSERT',
    46: 'DELETE',
    27: 'ESCAPE',
    19: 'PAUSE',
    222: "'",
    91: 'META',
};

function fn_name(code: number): string | false {
    if (code >= 112 && code <= 123) return 'F' + (code - 111);
    return false;
}

function num_name(code: number): string | false {
    if (code >= 96 && code < 106) return 'Num' + (code - 96);
    switch (code) {
        case 106: return 'Num*';
        case 111: return 'Num/';
        case 110: return 'Num.';
        default: return false;
    }
}

const current_keys: CurrentKeys = {
    codes: {},
    ctrl: false,
    alt: false,
    shift: false,
    meta: false,
};

function update_current_modifiers(key: KeyEvent): void {
    current_keys.ctrl = key.ctrl;
    current_keys.alt = key.alt;
    current_keys.shift = key.shift;
    current_keys.meta = key.meta;
}

function same_modifiers(key1: KeyEvent, key2: KeyEvent): boolean {
    return (
        key1.ctrl === key2.ctrl &&
        key1.alt === key2.alt &&
        key1.shift === key2.shift &&
        key1.meta === key2.meta
    );
}

const _KeyCode = (typeof window !== 'undefined' && (window as any).KeyCode) || undefined;

export const KeyCode: KeyCodeType = {
    no_conflict: function(): KeyCodeType {
        if (typeof window !== 'undefined') {
            (window as any).KeyCode = _KeyCode;
        }
        return KeyCode;
    },

    fkey: function(num: number): number {
        return 111 + num;
    },

    numkey: function(num: number | string): number {
        switch (num) {
            case '*': return 106;
            case '/': return 111;
            case '.': return 110;
            default: return 96 + Number(num);
        }
    },

    key: function(str: string): number {
        const c = str.charCodeAt(0);
        if (isLower(c)) return c - 32;
        return shifted_symbols[c] || c;
    },

    key_equals: function(key1: KeyEvent, key2: KeyEvent): boolean {
        return key1.code == key2.code && same_modifiers(key1, key2);
    },

    translate_key_code: function(code: number): number {
        return KEY_MAP[code] || code;
    },

    translate_event: function(e: KeyboardEvent): KeyEvent {
        const code = e.which || e.keyCode;
        return {
            code: KeyCode.translate_key_code(code),
            shift: e.shiftKey,
            alt: e.altKey,
            ctrl: e.ctrlKey,
            meta: e.metaKey,
        };
    },

    key_down: function(e: KeyboardEvent): void {
        const key = KeyCode.translate_event(e);
        current_keys.codes[key.code] = key.code;
        update_current_modifiers(key);
    },

    key_up: function(e: KeyboardEvent): void {
        const key = KeyCode.translate_event(e);
        delete current_keys.codes[key.code];
        update_current_modifiers(key);
    },

    is_down: function(key: KeyEvent): boolean {
        const code = key.code;
        if (code == KeyCode.CTRL) return current_keys.ctrl;
        if (code == KeyCode.ALT) return current_keys.alt;
        if (code == KeyCode.SHIFT) return current_keys.shift;

        return current_keys.codes[code] !== undefined && same_modifiers(key, current_keys);
    },

    hot_key: function(key: KeyEvent): string {
        const pieces: string[] = [];
        for (const modifier of modifiers) {
            if (key[modifier as keyof KeyEvent] && modifier.toUpperCase() != key_names[key.code]) {
                pieces.push(capitalize(modifier));
            }
        }

        const c = key.code;
        const key_name = key_names[c] || fn_name(c) || num_name(c) || String.fromCharCode(c);
        pieces.push(capitalize(key_name));
        return pieces.join('+');
    },
};

// Add key constants
for (const code in key_names) {
    KeyCode[key_names[code]] = Number(code);
} 