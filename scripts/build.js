const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

process.env.DESKTOP_MODE = "true";

// Run Vite build with v0 config (which processes index-cv.html correctly)
execSync("npx vite build --config vite.config.v0.ts", { stdio: "inherit" });

const distDir = path.join(__dirname, "..", "dist");
const src = path.join(distDir, "index-cv.html");
const dest = path.join(distDir, "index.html");

if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest);
  console.log("Copied index-cv.html → index.html");
} else {
  console.log("index-cv.html not found, using existing index.html");
}

console.log("Desktop build complete");
