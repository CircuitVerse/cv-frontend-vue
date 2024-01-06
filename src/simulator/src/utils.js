window.globalScope = undefined;
window.lightMode = false; // To be deprecated
window.projectId = undefined;
window.id = undefined;
window.loading = false; // Flag - all assets are loaded

/**
 * Generate unique string ID
 * @return {string}
 */
export function generateId() {
  let id = '';
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < 20; i++) {
    id += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return id;
}

// To strip tags from input
export function stripTags(string = '') {
  return string.replace(/(<([^>]+)>)/gi, '').trim();
}


export function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2) + (y2 - y1) ** 2;
}

/**
 * Helper function to return unique list
 * @param {Array} a - any array
 * @category utils
 */
export function uniq(a) {
  const seen = {};
  const tmp = a.filter((item) =>
    seen.hasOwnProperty(item) ? false : (seen[item] = true),
  );
  return tmp;
}

/**
 * Generates final verilog code for each element
 * Gate = &/|/^
 * Invert is true for xNor, Nor, Nand
 * @param {CircuitElement} gate
 * @param {boolean} invert
 * @return {string} String representing the Verliog
 */
export function gateGenerateVerilog(gate, invert = false) {
  const inputs = [];
  const outputs = [];

  for (let i = 0; i < this.nodeList.length; i++) {
    if (this.nodeList[i].type == NodeType.Input) {
      inputs.push(this.nodeList[i]);
    } else if (this.nodeList[i].connections.length > 0) {
      outputs.push(this.nodeList[i]);
    } else {
      outputs.push(''); // Don't create a wire
    }
  }

  let res = 'assign ';
  if (outputs.length == 1) {
    res += outputs[0].verilogLabel;
  } else {
    res += `{${outputs.map((x) => x.verilogLabel).join(', ')}}`;
  }
  res += ' = ';

  const inputParams = inputs.map((x) => x.verilogLabel).join(` ${gate} `);
  if (invert) {
    res += `~(${inputParams});`;
  } else {
    res += inputParams + ';';
  }
  return res;
}

// Helper function to download text
export function download(filename, text) {
  const pom = document.createElement('a');
  pom.setAttribute(
      'href',
      'data:text/plain;charset=utf-8,' + encodeURIComponent(text),
  );
  pom.setAttribute('download', filename);

  if (document.createEvent) {
    const event = document.createEvent('MouseEvents');
    event.initEvent('click', true, true);
    pom.dispatchEvent(event);
  } else {
    pom.click();
  }
}

// Helper function to open a new tab
export function openInNewTab(url) {
  const win = window.open(url, '_blank');
  win.focus();
}

export function copyToClipboard(text) {
  const textarea = document.createElement('textarea');

  // Move it off-screen.
  textarea.style.cssText = 'position: absolute; left: -99999em';

  // Set to readonly to prevent mobile devices opening a keyboard when
  // text is .select()'ed.
  textarea.setAttribute('readonly', true);

  document.body.appendChild(textarea);
  textarea.value = text;

  // Check if there is any content selected previously.
  const selected =
    document.getSelection().rangeCount > 0 ?
      document.getSelection().getRangeAt(0) :
      false;

  // iOS Safari blocks programmatic execCommand copying normally, without this hack.
  // https://stackoverflow.com/questions/34045777/copy-to-clipboard-using-javascript-in-ios
  if (navigator.userAgent.match(/ipad|ipod|iphone/i)) {
    const editable = textarea.contentEditable;
    textarea.contentEditable = true;
    const range = document.createRange();
    range.selectNodeContents(textarea);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    textarea.setSelectionRange(0, 999999);
    textarea.contentEditable = editable;
  } else {
    textarea.select();
  }

  try {
    const result = document.execCommand('copy');

    // Restore previous selection.
    if (selected) {
      document.getSelection().removeAllRanges();
      document.getSelection().addRange(selected);
    }
    textarea.remove();
    return result;
  } catch (err) {
    console.error(err);
    textarea.remove();
    return false;
  }
}

export function truncateString(str, num) {
  // If the length of str is less than or equal to num
  // just return str--don't truncate it.
  if (str.length <= num) {
    return str;
  }
  // Return str truncated with '...' concatenated to the end of str.
  return str.slice(0, num) + '...';
}

export function getImageDimensions(file) {
  return new Promise(function(resolved, rejected) {
    const i = new Image();
    i.onload = function() {
      resolved({w: i.width, h: i.height});
    };
    i.src = file;
  });
}

// converters
export const converters = {
  dec2bin: (dec, bitWidth = undefined) => {
    // only for positive nos
    const bin = dec.toString(2);
    if (bitWidth == undefined) {
      return bin;
    }
    return '0'.repeat(bitWidth - bin.length) + bin;
  },
  bin2dec: (x) => {
    return parseInt(x, 2);
  },
  dec2hex: (x) => '0x' + x.toString(16),
  dec2octal: (x) => '0' + x.toString(8),
  dec2bcd: (x) => parseInt(x.toString(10), 16).toString(2),
};

export function parseNumber(num) {
  if (num instanceof Number) {
    return num;
  }
  if (num.slice(0, 2).toLocaleLowerCase() == '0b') {
    return parseInt(num.slice(2), 2);
  }
  if (num.slice(0, 2).toLocaleLowerCase() == '0x') {
    return parseInt(num.slice(2), 16);
  }
  if (num.slice(0, 1).toLocaleLowerCase() == '0') {
    return parseInt(num, 8);
  }
  return parseInt(num);
}

export function promptFile(contentType, multiple) {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = multiple;
  input.accept = contentType;
  return new Promise(function(resolve) {
    document.activeElement.onfocus = function() {
      document.activeElement.onfocus = null;
      setTimeout(resolve, 500);
    };
    input.onchange = function() {
      const files = Array.from(input.files);
      if (multiple) {
        return resolve(files);
      }
      resolve(files[0]);
    };
    input.click();
  });
}

/**
 * Escape an arbitrary string to be HTML safe.
 * @param {string} unsafe
 * @return {string} HTML safe string.
 */
export function escapeHtml(unsafe) {
  return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
}
