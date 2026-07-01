// Validates and parses output.json from the Yosys VFS result

export function parseYosysOutput(vfsResult) {
    if (!vfsResult || typeof vfsResult !== 'object') {
        throw new Error('Yosys did not return a valid virtual filesystem result.')
    }

    var raw = vfsResult['output.json']

    if (raw == null) {
        throw new Error('Yosys did not produce output.json; synthesis may have failed silently.')
    }

    if (raw instanceof Uint8Array) {
        raw = new TextDecoder().decode(raw)
    }

    if (typeof raw !== 'string') {
        throw new Error('Yosys output.json has an unsupported type: ' + typeof raw)
    }

    if (!raw.trim()) {
        throw new Error('Yosys produced an empty output.json.')
    }

    try {
        return JSON.parse(raw)
    } catch (err) {
        throw new Error('Yosys produced invalid JSON in output.json: ' + err.message)
    }
}
