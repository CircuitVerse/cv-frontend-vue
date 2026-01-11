const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Read versions from version.json
const versionsData = JSON.parse(fs.readFileSync('version.json', 'utf8'));
let versions = versionsData.map(v => v.version);

// If CLI args are passed, build ONLY those
if (process.argv.length > 2) {
  versions = process.argv.slice(2);
} else {
  // Default behavior:
  // skip legacy v0 (no entry file anymore)
  versions = versions.filter(v => v !== 'v0');
}

// Always build root app (src/)
console.log('Building root simulator (src/)');
execSync('vite build', {
  stdio: 'inherit',
  env: { ...process.env }
});

// Build versioned simulators (e.g. v1)
for (const version of versions) {
  console.log(`Building for version: ${version}`);

  try {
    execSync('vite build', {
      env: { ...process.env, VITE_SIM_VERSION: version },
      stdio: 'inherit'
    });

    // Flatten nested output if needed
    const nestedHtmlPath = path.join(
      'dist',
      'simulatorvue',
      version,
      version,
      'index.html'
    );
    const parentHtmlPath = path.join(
      'dist',
      'simulatorvue',
      version,
      'index.html'
    );
    const nestedDir = path.join(
      'dist',
      'simulatorvue',
      version,
      version
    );

    if (fs.existsSync(nestedHtmlPath)) {
      console.log(`Flattening output for ${version}...`);
      fs.copyFileSync(nestedHtmlPath, parentHtmlPath);
      fs.unlinkSync(nestedHtmlPath);
      if (fs.existsSync(nestedDir) && fs.readdirSync(nestedDir).length === 0) {
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
