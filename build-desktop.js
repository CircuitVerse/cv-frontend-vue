
const os = require('os');
const { execSync } = require('child_process');


function runCommand(command) {
    try {
        execSync(command, { stdio: 'inherit' })
    } catch (error) {
        console.error(`Error executing command: ${command}`)
        process.exit(1)
    }
}

process.env.DESKTOP_MODE = 'true'

const platform = os.platform()
console.log(
    `Building for ${platform === 'win32' ? 'Windows' : 'Unix-based system'}...`
)

runCommand('npm run build')

const fs = require('fs')

if (!fs.existsSync('dist/index-cv.html')) {
    console.error('Error: dist/index-cv.html not found after build')
    process.exit(1)
}

if (platform === 'win32') {
    runCommand('copy dist\\index-cv.html dist\\index.html')
} else {
    runCommand('cp dist/index-cv.html dist/index.html')
}
