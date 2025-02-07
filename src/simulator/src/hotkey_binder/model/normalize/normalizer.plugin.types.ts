export interface IKeyCode {
    no_conflict: () => IKeyCode;
    fkey: (num: number) => number;
    numkey: (num: number | string) => number;
    key: (str: string) => number;
    key_equals: (key1: { code: number; ctrl: boolean; alt: boolean; shift: boolean; meta: boolean }, key2: { code: number; ctrl: boolean; alt: boolean; shift: boolean; meta: boolean }) => boolean;
    translate_key_code: (code: number) => number;
    translate_event: (e: KeyboardEvent) => { code: number; shift: boolean; alt: boolean; ctrl: boolean; meta: boolean };
    key_down: (e: KeyboardEvent) => void;
    key_up: (e: KeyboardEvent) => void;
    is_down: (key: { code: number; ctrl: boolean; alt: boolean; shift: boolean; meta: boolean }) => boolean;
    hot_key: (key: { code: number; ctrl: boolean; alt: boolean; shift: boolean; meta: boolean }) => string;
    [key: string]: any;
}