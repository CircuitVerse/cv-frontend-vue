/**
 * @file verilogHelpers.ts
 * @description Utility functions for Verilog code generation and label sanitization.
 */


/*** Type Definitions ***/

/**
 * Minimal interface for parent elements referenced in Verilog generation.
 * Represents the essential properties of a CircuitElement needed for node naming.
 *
 * @TODO [MIGRATION] Replace with actual CircuitElement type once circuitElement.js is migrated to TypeScript
 * @see {@link file://./circuitElement.js}
 */
interface VerilogParentElement {
    /** Verilog label for the parent element */
    readonly verilogLabel: string;
}

/**
 * Minimal interface for Node objects used in Verilog helper functions.
 * Represents the essential properties of a Node needed for Verilog name generation.
 *
 * @TODO [MIGRATION] Replace with actual Node type once node.js is migrated to TypeScript
 * @see {@link file://./node.js}
 */
interface VerilogNode {
    /** Optional Verilog label assigned to this node */
    readonly verilogLabel?: string;

    /** Optional human-readable label for this node */
    readonly label?: string;

    /** Parent circuit element containing this node */
    readonly parent: VerilogParentElement;
}


/*** Regex Pattern Constants ***/

/**
 * Pattern to match one or more space characters globally.
 * Used for detecting and replacing spaces in labels.
 */
const SPACE_PATTERN: RegExp = / /g;

/**
 * Pattern to match " Inverse" suffix (with preceding space).
 * Used to replace " Inverse" with "_inv" for cleaner Verilog identifiers.
 */
const INVERSE_SUFFIX_PATTERN: RegExp = / Inverse/g;

/**
 * Pattern to match a backslash at the start of a string.
 * Used to detect escaped Verilog identifiers.
 */
const ESCAPE_PREFIX_PATTERN: RegExp = /\\/g;

/**
 * Pattern to match any non-word character (not alphanumeric or underscore).
 * Special characters in Verilog require escaping with backslash.
 */
const NON_WORD_CHAR_PATTERN: RegExp = /[\W]/g;

/**
 * Pattern to match a numeric digit (0-9).
 * Verilog identifiers cannot start with a digit.
 */
const DIGIT_PATTERN: RegExp = /[0-9]/g;


/*** Exported Functions ***/

/**
 * Sanitizes a label string to create a valid Verilog identifier.
 *
 * This function performs the following transformations:
 * 1. Replaces " Inverse" suffixes with "_inv"
 * 2. Replaces internal spaces with underscores
 * 3. Escapes identifiers that contain special characters or start with a digit
 *
 * Verilog escaped identifiers start with a backslash and end with a space.
 *
 * @param name - The raw label string to sanitize
 * @returns A valid Verilog identifier string
 *
 * @example
 * // Simple alphanumeric label - no changes needed
 * sanitizeLabel("myLabel") // Returns: "myLabel"
 *
 * @example
 * // Label with spaces - spaces replaced with underscores
 * sanitizeLabel("my label") // Returns: "my_label"
 *
 * @example
 * // Label with " Inverse" suffix - converted to "_inv"
 * sanitizeLabel("gate Inverse") // Returns: "gate_inv"
 *
 * @example
 * // Label starting with digit - escaped
 * sanitizeLabel("123abc") // Returns: "\\123abc "
 *
 * @example
 * // Label with special characters - escaped
 * sanitizeLabel("my-label") // Returns: "\\my-label "
 *
 * @category verilog
 * @see {@link generateNodeName} - Uses this function for node label sanitization
 */
export function sanitizeLabel(name: string): string {
    let temp: string = name;

    // If there is a space anywhere but the last place,
    // replace spaces by "_".
    // Last space is required for escaped identifiers.
    const spaceIndex: number = temp.search(SPACE_PATTERN);
    if (spaceIndex < temp.length - 1 && spaceIndex >= 0) {
        // Replace " Inverse" suffix with "_inv" for cleaner naming
        temp = temp.replace(INVERSE_SUFFIX_PATTERN, '_inv');
        // Replace remaining spaces with underscores
        temp = temp.replace(SPACE_PATTERN, '_');
    }

    // Check if first character is not already a backslash (escaped)
    const firstChar: string = temp.substring(0, 1);
    if (firstChar.search(ESCAPE_PREFIX_PATTERN) < 0) {
        // If there are non-alphanumeric/underscore characters,
        // or if the first character is a digit, add escape sequence
        const hasNonWordChar: boolean = temp.search(NON_WORD_CHAR_PATTERN) > -1;
        const startsWithDigit: boolean = firstChar.search(DIGIT_PATTERN) > -1;

        if (hasNonWordChar || startsWithDigit) {
            // Escaped Verilog identifiers start with \\ and end with a space
            temp = '\\' + temp + ' ';
        }
    }

    return temp;
}

/**
 * Generates a unique Verilog-compatible node name based on the node's properties.
 *
 * The naming priority is:
 * 1. If node has a verilogLabel, use it directly
 * 2. If node has a label, sanitize and combine with parent's verilogLabel
 * 3. Otherwise, generate a default name like "parentLabel_out" or "parentLabel_out_N"
 *
 * For escaped parent labels (starting with backslash), the output preserves
 * the escaped format by keeping the backslash prefix and trailing space.
 *
 * @param node - The node object containing label information
 * @param currentCount - Current index for multi-output nodes (0-indexed)
 * @param totalCount - Total number of output nodes
 * @returns A unique Verilog-compatible node name
 *
 * @example
 * // Node with explicit verilogLabel
 * const node1 = { verilogLabel: "custom_out", parent: { verilogLabel: "gate1" } };
 * generateNodeName(node1, 0, 1) // Returns: "custom_out"
 *
 * @example
 * // Node with label, single output
 * const node2 = { label: "result", parent: { verilogLabel: "adder" } };
 * generateNodeName(node2, 0, 1) // Returns: "adder_result"
 *
 * @example
 * // Node without label, multiple outputs
 * const node3 = { parent: { verilogLabel: "demux" } };
 * generateNodeName(node3, 2, 4) // Returns: "demux_out_2"
 *
 * @example
 * // Node with escaped parent label
 * const node4 = { label: "q", parent: { verilogLabel: "\\special-gate " } };
 * generateNodeName(node4, 0, 1) // Returns: "\\special-gate_q "
 *
 * @category verilog
 * @see {@link sanitizeLabel} - Used to sanitize node labels
 */
export function generateNodeName(
    node: VerilogNode,
    currentCount: number,
    totalCount: number
): string {
    // If node has an explicit Verilog label, use it directly
    if (node.verilogLabel) {
        return node.verilogLabel;
    }

    const parentVerilogLabel: string = node.parent.verilogLabel;
    let nodeName: string;

    // Determine the node name portion
    if (node.label) {
        // Sanitize the node's label for Verilog compatibility
        nodeName = sanitizeLabel(node.label);
    } else {
        // Generate default output name based on count
        nodeName = totalCount > 1 ? 'out_' + currentCount : 'out';
    }

    // Check if parent label is escaped (starts with backslash)
    const firstChar: string = parentVerilogLabel.substring(0, 1);
    const isParentEscaped: boolean = firstChar.search(ESCAPE_PREFIX_PATTERN) >= 0;

    if (!isParentEscaped) {
        // Non-escaped parent: simple concatenation with underscore
        return parentVerilogLabel + '_' + nodeName;
    } else {
        // Escaped parent: insert node name before the trailing space
        // Parent format is "\\name ", we want "\\name_nodeName "
        const parentWithoutTrailingSpace: string = parentVerilogLabel.substring(
            0,
            parentVerilogLabel.length - 1
        );
        return parentWithoutTrailingSpace + '_' + nodeName + ' ';
    }
}


/*** Type Exports (for use by other modules) ***/

export type { VerilogNode, VerilogParentElement };
