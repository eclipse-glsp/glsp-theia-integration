const fs = require('fs');
const path = require('path');

// Path to the dependency's package.json
const dependencyPath = path.join(__dirname, '..', 'node_modules', '@vscode', 'ripgrep', 'package.json');

// Read the dependency's package.json
const packageJson = JSON.parse(fs.readFileSync(dependencyPath, 'utf8'));

// Remove the postinstall script
if (packageJson.scripts && packageJson.scripts.postinstall) {
    delete packageJson.scripts.postinstall;
}

// Write the modified package.json back to the file system
fs.writeFileSync(dependencyPath, JSON.stringify(packageJson, null, 2), 'utf8');
