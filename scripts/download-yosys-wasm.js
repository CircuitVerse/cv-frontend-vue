const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'node_modules', '@yowasp', 'yosys', 'gen');
const destDir = path.join(__dirname, '..', 'public');
fs.mkdirSync(destDir, { recursive: true });

const files = [
  { src: 'bundle.js',           dest: 'yosys-bundle.js' },
  { src: 'yosys-resources.tar', dest: 'yosys-resources.tar' },
  { src: 'yosys.core.wasm',     dest: 'yosys.core.wasm' },
  { src: 'yosys.core2.wasm',    dest: 'yosys.core2.wasm' },
  { src: 'yosys.core3.wasm',    dest: 'yosys.core3.wasm' },
  { src: 'yosys.core4.wasm',    dest: 'yosys.core4.wasm' },
];

if (!fs.existsSync(srcDir)) {
  console.error('ERROR: @yowasp/yosys not found. Run: npm install first.');
  process.exit(1);
}

files.forEach(function(file) {
  var src  = path.join(srcDir, file.src);
  var dest = path.join(destDir, file.dest);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    var size = (fs.statSync(dest).size / 1024 / 1024).toFixed(1);
    console.log('Copied ' + file.dest + ' (' + size + ' MB)');
  } else {
    console.warn('WARNING: ' + file.src + ' not found at ' + src);
  }
});

console.log('Done! Yosys WASM files ready in public/');