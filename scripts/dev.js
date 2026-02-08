const { spawn } = require('child_process');

// Default version to v0 if not set
process.env.VITE_SIM_VERSION = process.env.VITE_SIM_VERSION || 'v0';

// Set DESKTOP_MODE if we detect we are likely in a Tauri context
// (Tauri usually sets TAURI_ENV_PLATFORM or similar during dev)
if (process.argv.includes('--desktop')) {
    process.env.DESKTOP_MODE = 'true';
}

console.log(`Starting dev server for version: ${process.env.VITE_SIM_VERSION}`);

// Spawn vite dev server
// Using shell: true to support Windows correctly
const child = spawn('npx', ['vite'], {
    stdio: 'inherit',
    shell: true,
    env: process.env
});

child.on('exit', (code) => {
    process.exit(code || 0);
});
