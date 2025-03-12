// build-desktop.js
const os = require('os');

// Set DESKTOP_MODE environment variable
// Set DESKTOP_MODE environment variable
if (os.platform() === 'win32') {
    try {
        // Windows
        console.log('Building for Windows...');
        const { stdout, stderr } = require('child_process').execSync(
            'set DESKTOP_MODE=true && npm run build && copy dist\\index-cv.html dist\\index.html',
            { encoding: 'utf8' }
        );
        console.log(stdout);
        if (stderr) {
            console.warn(`Warnings: ${stderr}`);
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
} else {
    try {
        // Unix-based systems (Linux, macOS)
        console.log('Building for Unix-based system...');
        const { stdout, stderr } = require('child_process').execSync(
            'DESKTOP_MODE=true npm run build && cp dist/index-cv.html dist/index.html',
            { encoding: 'utf8' }
        );
        console.log(stdout);
        if (stderr) {
            console.warn(`Warnings: ${stderr}`);
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}