import {Node} from './node';
/**
 *
 * @param {string} name - label name to sanitize.
 * @return {string} sanitized label name.
 */
export function sanitizeLabel(name: string) {
  let temp = name;
  // if there is a space anywhere but the last place
  // replace spaces by "_"
  // last space is required for escaped id
  if (temp.search(/ /g) < temp.length - 1 && temp.search(/ /g) >= 0) {
    temp = temp.replace(/ Inverse/g, '_inv');
    temp = temp.replace(/ /g, '_');
  }
  // if first character is not \ already
  if (temp.substring(0, 1).search(/\\/g) < 0) {
    // if there are non-alphanumeric character, or first character is num, add \
    if (
      temp.search(/[\W]/g) > -1 ||
      temp.substring(0, 1).search(/[0-9]/g) > -1
    ) {
      temp = '\\' + temp + ' ';
    }
  }
  return temp;
}

/**
 * Generate a unique node name.
 * @param {Node} node - Node for which a name is being generated.
 * @param {number} currentCount - Index of the Node being generated.
 * @param {number} totalCount - Count of Nodes being generated.
 * @return {string} Unique verilog name.
 */
export function generateNodeName(node: Node,
    currentCount: number, totalCount: number) {
  if (node.verilogLabel) {
    return node.verilogLabel;
  }
  const parentVerilogLabel = node.parent.verilogLabel;
  let nodeName;
  if (node.label) {
    nodeName = sanitizeLabel(node.label);
  } else {
    nodeName = totalCount > 1 ? 'out_' + currentCount : 'out';
  }
  if (parentVerilogLabel.substring(0, 1).search(/\\/g) < 0) {
    return parentVerilogLabel + '_' + nodeName;
  } else {
    return (
      parentVerilogLabel.substring(0, parentVerilogLabel.length - 1) +
      '_' +
      nodeName +
      ' '
    );
  }
}
