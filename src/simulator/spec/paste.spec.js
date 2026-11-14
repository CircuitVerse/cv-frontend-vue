import { describe, test, expect, vi } from 'vitest'
// NOTE: setup must stay the first import from ../src. It makes the
// simulator modules load in the right order (they import each other
// in a circle); importing events first fails with
// "Class extends value undefined".
import { setup } from '../src/setup'
import { paste } from '../src/events'
import { scopeList } from '../src/circuit'
import { isValidClipboardData } from '../src/clipboardValidation'

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

// Valid JSON with the clipboard flag, but a malformed shape.
const validScope = { id: 'valid-scope', name: 'Valid', allNodes: [] }
const malformedPayloads = [
    ['a null scope', { logixClipBoardData: true, scopes: [null], allNodes: [] }],
    ['a non-object scope', { logixClipBoardData: true, scopes: [42], allNodes: [] }],
    [
        'a scope without allNodes',
        {
            logixClipBoardData: true,
            scopes: [{ id: 'invalid-import', name: 'Imported' }],
            allNodes: [],
        },
    ],
    [
        'a scope whose allNodes is not an array',
        {
            logixClipBoardData: true,
            scopes: [{ id: 'bad-nodes', name: 'Bad', allNodes: {} }],
            allNodes: [],
        },
    ],
    [
        'a scope without an id',
        { logixClipBoardData: true, scopes: [{ name: 'No id', allNodes: [] }], allNodes: [] },
    ],
    [
        'a scope whose module list is not an array',
        {
            logixClipBoardData: true,
            scopes: [{ id: 'bad-module', name: 'Bad', allNodes: [], Input: 'oops' }],
            allNodes: [],
        },
    ],
    [
        'a valid scope followed by an invalid one',
        { logixClipBoardData: true, scopes: [validScope, null], allNodes: [] },
    ],
    [
        'a valid scope followed by one without allNodes',
        {
            logixClipBoardData: true,
            scopes: [validScope, { id: 'second', name: 'Second' }],
            allNodes: [],
        },
    ],
    [
        'a root payload without allNodes',
        { logixClipBoardData: true, scopes: [validScope] },
    ],
    ['scopes that is not an array', { logixClipBoardData: true, scopes: {}, allNodes: [] }],
    [
        'a root layout that is a string',
        { logixClipBoardData: true, scopes: [], allNodes: [], layout: 'bad' },
    ],
    [
        'a scope layout that is a string',
        {
            logixClipBoardData: true,
            scopes: [{ id: 'bad-layout', name: 'Bad', allNodes: [], layout: 'bad' }],
            allNodes: [],
        },
    ],
    [
        'a scope name that is empty after stripping tags',
        {
            logixClipBoardData: true,
            scopes: [validScope, { id: 'tags-only', name: '<b></b>', allNodes: [] }],
            allNodes: [],
        },
    ],
    [
        'a whitespace-only scope name',
        {
            logixClipBoardData: true,
            scopes: [{ id: 'blank', name: '   ', allNodes: [] }],
            allNodes: [],
        },
    ],
    [
        'a null entry in the root allNodes',
        { logixClipBoardData: true, scopes: [validScope], allNodes: [null] },
    ],
    [
        'a null entry in a scope allNodes',
        {
            logixClipBoardData: true,
            scopes: [validScope, { id: 'null-node', name: 'N', allNodes: [null] }],
            allNodes: [],
        },
    ],
    [
        'a null entry in a root module list',
        { logixClipBoardData: true, scopes: [validScope], allNodes: [], Input: [null] },
    ],
    [
        'a null entry in a scope module list',
        {
            logixClipBoardData: true,
            scopes: [validScope, { id: 'null-mod', name: 'M', allNodes: [], Input: [null] }],
            allNodes: [],
        },
    ],
]

describe('paste() with malformed but valid JSON', () => {
    test.each(malformedPayloads)('rejects %s without throwing', (_name, payload) => {
        expect(() => paste(JSON.stringify(payload))).not.toThrow()
    })

    test.each(malformedPayloads)(
        'does not partially modify simulator state for %s',
        (_name, payload) => {
            const before = Object.keys(scopeList)
            paste(JSON.stringify(payload))
            expect(Object.keys(scopeList)).toEqual(before)
        }
    )
})

describe('isValidClipboardData()', () => {
    test.each(malformedPayloads)('returns false for %s', (_name, payload) => {
        expect(isValidClipboardData(payload)).toBe(false)
    })

    test('returns true for a scope with a numeric id (real subcircuit copy)', () => {
        expect(
            isValidClipboardData({
                logixClipBoardData: true,
                scopes: [{ id: 17688253621, name: 'Main', allNodes: [], SubCircuit: [] }],
                allNodes: [],
                SubCircuit: [],
            })
        ).toBe(true)
    })

    test.each([
        ['a boolean id', true],
        ['an object id', {}],
        ['a NaN id', NaN],
        ['an empty-string id', ''],
    ])('returns false for %s', (_name, id) => {
        expect(
            isValidClipboardData({
                logixClipBoardData: true,
                scopes: [{ id, name: 'Bad', allNodes: [] }],
                allNodes: [],
            })
        ).toBe(false)
    })

    test('returns true for valid layout objects and names containing tags', () => {
        expect(
            isValidClipboardData({
                logixClipBoardData: true,
                scopes: [
                    {
                        id: 1,
                        name: '<b>Main</b>',
                        allNodes: [{ x: 100, y: 20, type: 1, bitWidth: 1, label: '', connections: [] }],
                        layout: { width: 100, height: 40, title_x: 50, title_y: 13, titleEnabled: true },
                    },
                ],
                allNodes: [],
                layout: { width: 100, height: 40, title_x: 50, title_y: 13, titleEnabled: true },
            })
        ).toBe(true)
    })

    test('returns true for a well-formed payload', () => {
        expect(
            isValidClipboardData({
                logixClipBoardData: true,
                scopes: [validScope],
                allNodes: [],
                Input: [],
            })
        ).toBe(true)
    })
})