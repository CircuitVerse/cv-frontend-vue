const { execSync } = require("child_process");

const versions = ["v0", "v1"];

for (const version of versions) {
  console.log(`Building for version: ${version}`);
  execSync(`vite build --config vite.config.${version}.ts`, {
    stdio: "inherit",
  });
}
