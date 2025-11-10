const os = require('os');
const { execSync } = require('child_process');


function runCommand(command) {
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    if (output) {
      console.log(output);
    }
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    if (error.stdout) {
      console.error(`Stdout: ${error.stdout}`);
    }
    if (error.stderr) {
      console.error(`Stderr: ${error.stderr}`);
    }
    process.exit(1);
  }
}


process.env.DESKTOP_MODE = "true";

const platform = os.platform();
console.log(`Building for ${platform === 'win32' ? 'Windows' : 'Unix-based system'}...`);


runCommand('npm run build');

if (platform === 'win32') {
  runCommand('copy dist\\index-cv.html dist\\index.html');
} else {
  runCommand('cp dist/index-cv.html dist/index.html');
}