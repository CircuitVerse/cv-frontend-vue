// build.js (Windows + cross-platform equivalent of build.sh)

const { execSync } = require("child_process");
const fs = require("fs");

console.log("Reading version.json...");

const versions = JSON.parse(fs.readFileSync("version.json", "utf8"))
  .map((v) => v.version);

for (const version of versions) {
  console.log(`\nBuilding for version: ${version}`);

  try {
    execSync(`npx vite build --config vite.config.${version}.ts`, {
      stdio: "inherit",
    });
  } catch (err) {
    console.error(`❌ Build failed for version: ${version}`);
    process.exit(1);
  }
}

console.log("\n✅ All builds completed successfully!");
