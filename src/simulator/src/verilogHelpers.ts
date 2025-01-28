interface Node {
    verilogLabel?: string;
    parent: {
        verilogLabel: string;
    };
    label?: string;
}

/**
 * Replaces spaces in the string with underscores, except for the last space.
 * @param str - The input string.
 * @returns The string with spaces replaced by underscores.
 */
function replaceSpaces(str: string): string {
    if (str.search(/ /g) < str.length - 1 && str.search(/ /g) >= 0) {
        return str.replace(/ Inverse/g, '_inv').replace(/ /g, '_');
    }
    return str;
}

/**
 * Escapes the string if it starts with a number or contains non-alphanumeric characters.
 * @param str - The input string.
 * @returns The escaped string.
 */
function escapeString(str: string): string {
    if (str.substring(0, 1).search(/\\/g) < 0) {
        if (str.search(/[\W]/g) > -1 || str.substring(0, 1).search(/[0-9]/g) > -1) {
            return `\\${str} `;
        }
    }
    return str;
}

/**
 * Sanitizes a label by replacing spaces and escaping special characters.
 * @param name - The label to sanitize.
 * @returns The sanitized label.
 */
export function sanitizeLabel(name: string): string {
    let temp = replaceSpaces(name);
    return escapeString(temp);
}

/**
 * Generates a node name based on the node's properties and context.
 * @param node - The node object.
 * @param currentCount - The current count of nodes.
 * @param totalCount - The total count of nodes.
 * @returns The generated node name.
 */
export function generateNodeName(node: Node, currentCount: number, totalCount: number): string {
    if (node.verilogLabel) {
        return node.verilogLabel;
    }

    const parentVerilogLabel = node.parent.verilogLabel;
    const nodeName = node.label ? sanitizeLabel(node.label) : totalCount > 1 ? `out_${currentCount}` : 'out';

    if (parentVerilogLabel.substring(0, 1).search(/\\/g) < 0) {
        return `${parentVerilogLabel}_${nodeName}`;
    } else {
        return `${parentVerilogLabel.substring(0, parentVerilogLabel.length - 1)}_${nodeName} `;
    }
}