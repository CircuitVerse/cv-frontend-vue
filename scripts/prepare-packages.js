const fs = require('fs');
const path = require('path');

const rootPkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const versionsData = JSON.parse(fs.readFileSync('version.json', 'utf8'));
let versions = versionsData.map(v => v.version);

if (process.argv.length > 2) {
  versions = process.argv.slice(2);
}

const baseVersion = process.env.PACKAGE_VERSION || rootPkg.version;
const xy = baseVersion.replace(/^v?\d+\./, '');
if (!/^\d+\.\d+$/.test(xy)) {
  console.error(`Invalid base version "${baseVersion}". Expected format x.y.z (e.g. 0.3.2).`);
  process.exit(1);
}

const versionFor = (simVersion) => {
  const major = simVersion.replace(/^v/, '');
  return major === '0' ? `0.${xy}` : `${major}.${xy}-alpha`;
};

for (const version of versions) {
  const srcDir = path.join('dist', 'simulatorvue', version);
  if (!fs.existsSync(srcDir)) {
    console.error(`Build output not found for ${version} at ${srcDir}. Run "npm run build ${version}" first.`);
    process.exit(1);
  }

  const outDir = path.join('packages', `simulator-${version}`);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  fs.cpSync(srcDir, path.join(outDir, 'dist'), { recursive: true });

  const pkg = {
    name: '@circuitverse/simulator',
    version: versionFor(version),
    description: `CircuitVerse simulator frontend (${version}) - built assets`,
    license: 'MIT',
    repository: {
      type: 'git',
      url: 'git+https://github.com/CircuitVerse/cv-frontend-vue.git',
    },
    publishConfig: {
      registry: 'https://npm.pkg.github.com',
    },
    files: ['dist'],
  };

  fs.writeFileSync(
    path.join(outDir, 'package.json'),
    JSON.stringify(pkg, null, 2) + '\n'
  );
  fs.copyFileSync('LICENSE', path.join(outDir, 'LICENSE'));

  console.log(`Prepared package ${pkg.name}@${pkg.version} in ${outDir}`);
}
