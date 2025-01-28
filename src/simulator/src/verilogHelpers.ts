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
const NON_WORD_REGEX = /[\W]/g;
const NUMERIC_START_REGEX = /^[0-9]/;

function escapeString(str: string): string {
        if (!str.startsWith('\\') && (
                NON_WORD_REGEX.test(str) || 
                NUMERIC_START_REGEX.test(str)
            )) {
                return `\\${str}`;
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
 * Generates the base node name based on the node's label or a default value.
 * @param node - The node object.
 * @param currentCount - The current count of nodes.
 * @param totalCount - The total count of nodes.
 * @returns The base node name.
 */
function getBaseNodeName(node: Node, currentCount: number, totalCount: number): string {
    return node.label ? sanitizeLabel(node.label) : totalCount > 1 ? `out_${currentCount}` : 'out';
}

/**
 * Constructs the final node name based on the parent's label and the base node name.
 * @param parentVerilogLabel - The parent's label.
 * @param nodeName - The base node name.
 * @returns The final node name.
 */
function constructFinalNodeName(parentVerilogLabel: string, nodeName: string): string {
    if (parentVerilogLabel.substring(0, 1).search(/\\/g) < 0) {
        return `${parentVerilogLabel}_${nodeName}`;
    } else {
        return `${parentVerilogLabel.substring(0, parentVerilogLabel.length - 1)}_${nodeName} `;
    }
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
    const nodeName = getBaseNodeName(node, currentCount, totalCount);
    return constructFinalNodeName(parentVerilogLabel, nodeName);
}