// build-desktop.js
const { exec } = require('child_process');
const os = require('os');

// Set DESKTOP_MODE environment variable
if (os.platform() === 'win32') {
  // Windows
  exec('set DESKTOP_MODE=true && npm run build && copy dist\\index-cv.html dist\\index.html', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
    // Log stderr output as warnings instead of treating them as errors
    if (stderr) {
      console.warn(`Warnings: ${stderr}`);
    }
    console.log(stdout);
  });
} else {
  // Unix-based systems (Linux, macOS)
  exec('DESKTOP_MODE=true npm run build && cp dist/index-cv.html dist/index.html', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
    // Log stderr output as warnings instead of treating them as errors
    if (stderr) {
      console.warn(`Warnings: ${stderr}`);
    }
    console.log(stdout);
  });
}