const { spawn } = require('child_process');

// Parse version from CLI args (e.g. npm run dev -- v1)
const args = process.argv.slice(2);
const version = args.find(arg => !arg.startsWith('--'));

// Only set VITE_SIM_VERSION if explicitly provided
if (version) {
    process.env.VITE_SIM_VERSION = version;
}

// Enable desktop mode if requested
if (process.argv.includes('--desktop')) {
    process.env.DESKTOP_MODE = 'true';
}

if (process.env.VITE_SIM_VERSION) {
    console.log(`Starting dev server for version: ${process.env.VITE_SIM_VERSION}`);
} else {
    console.log('Starting dev server for default simulator (root src/)');
}

// Spawn Vite dev server
const child = spawn('npx', ['vite'], {
    stdio: 'inherit',
    shell: true,
    env: process.env
});

child.on('exit', (code) => {
    process.exit(code || 0);
});
