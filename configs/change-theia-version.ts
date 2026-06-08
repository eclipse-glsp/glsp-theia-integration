/********************************************************************************
 * Copyright (c) 2024 EclipseSource and others.
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
// Pin @vscode/ripgrep to the last compatible version via a yarn resolution for those compatibility builds.
const RIPGREP_RESOLUTION_VERSION = '1.17.1';
const RIPGREP_MIN_THEIA_VERSION = '1.71.0';

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
    const pkgJson = path.join(ROOT_PATH, 'package.json');
    const pkg: { resolutions?: Record<string, string> } = JSON.parse(fs.readFileSync(pkgJson, 'utf8'));

    const minVersion = version === 'latest' ? undefined : (semver.minVersion(version) ?? undefined);
    const needsResolution = minVersion !== undefined && semver.lt(minVersion, RIPGREP_MIN_THEIA_VERSION);

    const resolutions = pkg.resolutions ?? {};
    if (needsResolution) {
        resolutions['@vscode/ripgrep'] = RIPGREP_RESOLUTION_VERSION;
        console.log(`Pinned @vscode/ripgrep to ${RIPGREP_RESOLUTION_VERSION} for @theia version ${version}`);
    } else {
        delete resolutions['@vscode/ripgrep'];
    }

    if (Object.keys(resolutions).length > 0) {
        pkg.resolutions = resolutions;
    } else {
        delete pkg.resolutions;
    }

    fs.writeFileSync(pkgJson, JSON.stringify(pkg, undefined, 2) + '\n');
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
