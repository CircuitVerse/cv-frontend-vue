import { describe, test, expect, vi } from 'vitest'
// NOTE: setup must stay the first import from ../src. It makes the
// simulator modules load in the right order (they import each other
// in a circle); importing events first fails with
// "Class extends value undefined".
import { setup } from '../src/setup'
import { paste } from '../src/events'

vi.mock('codemirror', async (importOriginal) => {
    const actual = await importOriginal()
    return {
        ...actual,
        fromTextArea: vi.fn(() => ({ setValue: () => {} })),
    }
})

vi.mock('codemirror-editor-vue3', () => ({
    defineSimpleMode: vi.fn(),
}))

describe('paste() with invalid clipboard data', () => {
    test.each([
        ['undefined', undefined],
        ['null', null],
        ['an empty string', ''],
        ['the string "undefined"', 'undefined'],
        ['plain text', 'another'],
        ['truncated JSON', '{"logixClipBoardData": tru'],
        ['JSON null', 'null'],
        ['a JSON number', '42'],
        ['a JSON object without the flag', '{"a": 1}'],
        ['the flag but no scopes', '{"logixClipBoardData": true}'],
    ])('does not throw for %s', (_name, input) => {
        expect(() => paste(input)).not.toThrow()
    })
})