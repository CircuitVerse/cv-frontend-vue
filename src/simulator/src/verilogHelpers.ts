/*
 * Interface representing a node with properties required for Verilog name generation.
 */

interface VerilogNode {
    verilogLabel?: string
    label?: string
    parent: {
        verilogLabel: string
    }
}

/*
 * Sanitizes a label for Verilog code generation by handling special characters,
 * spaces, and numeric prefixes according to Verilog naming conventions.
 *
 * @param name - The label string to sanitize
 * @returns The sanitized label suitable for Verilog code
 *
 * @example
 * sanitizeLabel("my label") // Returns "my_label"
 * sanitizeLabel("123abc") // Returns "\\123abc "
 * sanitizeLabel("AND Inverse") // Returns "AND_inv"
 */

export function sanitizeLabel(name: string): string {
    let temp = name
    // if there is a space anywhere but the last place
    // replace spaces by "_"
    // last space is required for escaped id
    if (temp.search(/ /g) < temp.length - 1 && temp.search(/ /g) >= 0) {
        temp = temp.replace(/ Inverse/g, '_inv')
        temp = temp.replace(/ /g, '_')
    }
    // if first character is not \ already
    if (temp.substring(0, 1).search(/\\/g) < 0) {
        // if there are non-alphanum_ character, or first character is num, add \
        if (
            temp.search(/[\W]/g) > -1 ||
            temp.substring(0, 1).search(/[0-9]/g) > -1
        )
            temp = '\\' + temp + ' '
    }
    return temp
}

/*
 * Generates a Verilog-compatible node name for a circuit node.
 * Uses the node's existing verilogLabel if available, otherwise generates
 * a name based on the node's label or a default output naming convention.
 *
 * @param node - The node object containing label information and parent reference
 * @param currentCount - The current output index (0-based)
 * @param totalCount - The total number of outputs
 * @returns The generated Verilog node name
 *
 * @example
 * // Node with existing verilogLabel
 * generateNodeName({ verilogLabel: "wire1", parent: { verilogLabel: "mod" } }, 0, 1)
 * // Returns "wire1"
 *
 * @example
 * // Node without verilogLabel, single output
 * generateNodeName({ parent: { verilogLabel: "mod" } }, 0, 1)
 * // Returns "mod_out"
 */

export function generateNodeName(
    node: VerilogNode,
    currentCount: number,
    totalCount: number
): string {
    if (node.verilogLabel) return node.verilogLabel
    const parentVerilogLabel = node.parent.verilogLabel
    let nodeName: string
    if (node.label) {
        nodeName = sanitizeLabel(node.label)
    } else {
        nodeName = totalCount > 1 ? 'out_' + currentCount : 'out'
    }
    if (parentVerilogLabel.substring(0, 1).search(/\\/g) < 0)
        return parentVerilogLabel + '_' + nodeName
    else
        return (
            parentVerilogLabel.substring(0, parentVerilogLabel.length - 1) +
            '_' +
            nodeName +
            ' '
        )
}
