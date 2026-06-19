/********************************************************************************
 * Copyright (c) 2024-2026 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/
import * as fs from 'fs';
import * as path from 'path';
import * as semver from 'semver';
const ROOT_PATH = path.resolve(__dirname, '..');
const BROWSER_APP_PATH = path.resolve(ROOT_PATH, 'examples', 'browser-app');
const ELECTRON_APP_PATH = path.resolve(ROOT_PATH, 'examples', 'electron-app');

// Theia versions < 1.71.x are incompatible with newer @vscode/ripgrep releases, which breaks the build.
// Pin @vscode/ripgrep to the last compatible version via a pnpm override for those compatibility builds.
const RIPGREP_RESOLUTION_VERSION = '1.17.1';
const RIPGREP_MIN_THEIA_VERSION = '1.71.0';

// pnpm 11 no longer reads the `pnpm.overrides` field from package.json — overrides must live in
// pnpm-workspace.yaml. Manage the ripgrep pin as a clearly-delimited, removable block.
const WORKSPACE_YAML_PATH = path.resolve(ROOT_PATH, 'pnpm-workspace.yaml');
const RIPGREP_BLOCK_BEGIN = '# BEGIN compat ripgrep override (managed by change-theia-version.ts)';
const RIPGREP_BLOCK_END = '# END compat ripgrep override';

function updateTheiaDependencyVersion(appPath: string, version: string, electronVersion?: string): void {
    const pkgJson = path.join(appPath, 'package.json');
    const pkg: { dependencies: Record<string, string>; devDependencies: Record<string, string> } = JSON.parse(
        fs.readFileSync(pkgJson, 'utf8')
    );

    Object.keys(pkg.dependencies).forEach(name => {
        if (name.startsWith('@theia/')) {
            pkg.dependencies[name] = version;
        }
    });

    Object.keys(pkg.devDependencies).forEach(name => {
        if (name.startsWith('@theia/')) {
            pkg.devDependencies[name] = version;
        }
    });

    if (electronVersion) {
        pkg.devDependencies['electron'] = electronVersion;
    }

    fs.writeFileSync(pkgJson, JSON.stringify(pkg, undefined, 2));
    console.log(`Updated ${appPath} to @theia version ${version}`);
}

function updateRipgrepResolution(version: string): void {
    const minVersion = version === 'latest' ? undefined : (semver.minVersion(version) ?? undefined);
    const needsResolution = minVersion !== undefined && semver.lt(minVersion, RIPGREP_MIN_THEIA_VERSION);

    let content = fs.readFileSync(WORKSPACE_YAML_PATH, 'utf8');
    // Strip any previously injected block first, so the operation is idempotent.
    const blockRegex = new RegExp(`\\n*${RIPGREP_BLOCK_BEGIN}[\\s\\S]*?${RIPGREP_BLOCK_END}\\n*`);
    content = content.replace(blockRegex, '\n').replace(/\s*$/, '\n');

    if (needsResolution) {
        content +=
            `\n${RIPGREP_BLOCK_BEGIN}\n` +
            'overrides:\n' +
            `    '@vscode/ripgrep': '${RIPGREP_RESOLUTION_VERSION}'\n` +
            `${RIPGREP_BLOCK_END}\n`;
        console.log(`Pinned @vscode/ripgrep to ${RIPGREP_RESOLUTION_VERSION} for @theia version ${version}`);
    }

    fs.writeFileSync(WORKSPACE_YAML_PATH, content);
}

const version = process.argv[2];
if (!version) {
    console.error('Please provide a version number/range');
    process.exit(1);
}

if (version !== 'latest' && !semver.validRange(version)) {
    console.error('Invalid version number/range: ${version}');
    process.exit(1);
}

const electronVersion = process.argv[3];
if (electronVersion && !semver.validRange(electronVersion)) {
    console.error(`Invalid electron version number/range ${electronVersion}`);
    process.exit(1);
}

updateRipgrepResolution(version);

if (fs.existsSync(BROWSER_APP_PATH)) {
    updateTheiaDependencyVersion(BROWSER_APP_PATH, version);
}

if (fs.existsSync(ELECTRON_APP_PATH)) {
    updateTheiaDependencyVersion(ELECTRON_APP_PATH, version, electronVersion);
}
