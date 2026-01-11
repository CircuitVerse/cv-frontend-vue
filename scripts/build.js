const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Set DESKTOP_MODE if we are running from Tauri
if (process.env.TAURI_ENV_PLATFORM) {
  process.env.DESKTOP_MODE = 'true';
}

// Get versions from version.json
const versionsData = JSON.parse(fs.readFileSync('version.json', 'utf8'));
let versions = versionsData.map(v => v.version);

// Overwrite versions if arguments are provided (e.g. npm run build -- v0)
const args = process.argv.slice(2);
if (args.length > 0) {
  versions = args;
}

for (const version of versions) {
  console.log(`\n--- Building version: ${version} ---`);

  try {
    // Set VITE_SIM_VERSION for this build iteration
    process.env.VITE_SIM_VERSION = version;

    // Run vite build using the unified config
    execSync('npx vite build', { stdio: 'inherit', env: process.env });

    // Flatten output: move nested index.html to parent if it exists
    // (Vite might output to dist/simulatorvue/v0/v0/index.html depending on config)
    const versionDistDir = path.join('dist', 'simulatorvue', version);
    const nestedHtmlPath = path.join(versionDistDir, version, 'index.html');
    const parentHtmlPath = path.join(versionDistDir, 'index.html');
    const nestedDir = path.join(versionDistDir, version);

    if (fs.existsSync(nestedHtmlPath)) {
      fs.copyFileSync(nestedHtmlPath, parentHtmlPath);
      fs.unlinkSync(nestedHtmlPath);
      if (fs.readdirSync(nestedDir).length === 0) {
        fs.rmdirSync(nestedDir);
      }
      console.log(`Flattened output for ${version}`);
    }

    console.log(`Success: Built ${version}`);
  } catch (error) {
    console.error(`Error: Build failed for ${version}`);
    process.exit(1);
  }
}

console.log('\nAll builds completed successfully');