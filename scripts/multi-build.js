const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get versions from version.json
const versionsData = JSON.parse(fs.readFileSync('version.json', 'utf8'));
let versions = versionsData.map(v => v.version);

// Overwrite versions if arguments are provided
if (process.argv.length > 2) {
  versions = process.argv.slice(2);
}

for (const version of versions) {
  console.log(`Building for version: ${version}`);

  try {
    // Run vite build with VITE_SIM_VERSION set
    execSync(`npx vite build`, {
      env: { ...process.env, VITE_SIM_VERSION: version },
      stdio: 'inherit'
    });

    // Flatten output: move nested index.html to parent if it exists
    // Structure path: dist/simulatorvue/<version>/<version>/index.html
    const nestedHtmlPath = path.join('dist', 'simulatorvue', version, version, 'index.html');
    const parentHtmlPath = path.join('dist', 'simulatorvue', version, 'index.html');
    const nestedDir = path.join('dist', 'simulatorvue', version, version);

    if (fs.existsSync(nestedHtmlPath)) {
      console.log(`Flattening output for ${version}...`);
      fs.copyFileSync(nestedHtmlPath, parentHtmlPath);
      fs.unlinkSync(nestedHtmlPath);
      // Optionally remove the nested directory if it's empty
      if (fs.readdirSync(nestedDir).length === 0) {
        fs.rmdirSync(nestedDir);
      }
    }

    console.log(`Build completed for version: ${version}`);
  } catch (error) {
    console.error(`Build failed for version: ${version}`);
    process.exit(1);
  }
}

console.log('All builds completed successfully');