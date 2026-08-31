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
const ROOT_PATH = path.resolve(import.meta.dirname, '..');
const BROWSER_APP_PATH = path.resolve(ROOT_PATH, 'examples', 'browser-app');
const ELECTRON_APP_PATH = path.resolve(ROOT_PATH, 'examples', 'electron-app');

// Dependencies whose current resolution breaks older Theia versions. Each entry is pinned via a pnpm
// override when downgrading to a Theia version older than `minTheiaVersion`.
const COMPAT_OVERRIDES = [
    {
        // Theia versions < 1.71.x are incompatible with newer @vscode/ripgrep releases, which breaks the build.
        name: '@vscode/ripgrep',
        version: '1.17.1',
        minTheiaVersion: '1.71.0'
    },
    {
        // webpack 5.108 replaced its bundled `terser-webpack-plugin` dependency with `minimizer-webpack-plugin`.
        // Theia < 1.74 declares `webpack: ^5.76.0` and its generated `gen-webpack[.node].config.js` does
        // `require('terser-webpack-plugin')`, so resolving webpack to >= 5.108 leaves that module uninstalled and
        // the app build dies in webpack-cli. Pin the last webpack release that still ships terser-webpack-plugin.
        // Only affects builds that go through webpack: since 1.72, Theia prefers esbuild when an `esbuild.mjs`
        // exists (it does, for both example apps), so newer versions never load the webpack configs.
        name: 'webpack',
        version: '5.107.2',
        minTheiaVersion: '1.74.0'
    }
];

// pnpm 11 no longer reads the `pnpm.overrides` field from package.json — overrides must live in
// pnpm-workspace.yaml. Manage the compat pins as a single clearly-delimited, removable block.
const WORKSPACE_YAML_PATH = path.resolve(ROOT_PATH, 'pnpm-workspace.yaml');
const COMPAT_BLOCK_BEGIN = '# BEGIN compat overrides (managed by change-theia-version.ts)';
const COMPAT_BLOCK_END = '# END compat overrides';

function updateTheiaDependencyVersion(appPath: string, version: string, electronVersion?: string, reactVersion?: string): void {
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

    if (reactVersion) {
        pkg.dependencies['react'] = reactVersion;
        pkg.dependencies['react-dom'] = reactVersion;
        pkg.devDependencies['@types/react'] = reactVersion;
        pkg.devDependencies['@types/react-dom'] = reactVersion;
    }

    fs.writeFileSync(pkgJson, JSON.stringify(pkg, undefined, 2));
    console.log(`Updated ${appPath} to @theia version ${version}`);
}

function updateCompatOverrides(version: string): void {
    const minVersion = version === 'latest' ? undefined : (semver.minVersion(version) ?? undefined);
    const applicable = minVersion === undefined ? [] : COMPAT_OVERRIDES.filter(o => semver.lt(minVersion, o.minTheiaVersion));

    let content = fs.readFileSync(WORKSPACE_YAML_PATH, 'utf8');
    // Strip any previously injected block (with its indentation) first, so the operation is idempotent.
    const blockRegex = /\n*[ \t]*# BEGIN compat[\s\S]*?# END compat[^\n]*/g;
    content = content.replace(blockRegex, '').replace(/\s*$/, '\n');

    if (applicable.length > 0) {
        const entries = applicable.map(o => `    '${o.name}': '${o.version}'`).join('\n');
        // Merge into the existing top-level `overrides:` mapping if present; emitting a second
        // `overrides:` key would be a duplicate YAML mapping key and break the install.
        const overridesHeader = content.match(/^overrides:[ \t]*$/m);
        if (overridesHeader) {
            const insertAt = overridesHeader.index! + overridesHeader[0].length;
            const block = `\n    ${COMPAT_BLOCK_BEGIN}\n${entries}\n    ${COMPAT_BLOCK_END}`;
            content = content.slice(0, insertAt) + block + content.slice(insertAt);
        } else {
            content = `${content.replace(/\s*$/, '\n')}\n${COMPAT_BLOCK_BEGIN}\noverrides:\n${entries}\n${COMPAT_BLOCK_END}\n`;
        }
        applicable.forEach(o => console.log(`Pinned ${o.name} to ${o.version} for @theia version ${version}`));
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

const reactVersion = process.argv[4];
if (reactVersion && !semver.validRange(reactVersion)) {
    console.error(`Invalid React version number/range ${reactVersion}`);
    process.exit(1);
}

updateCompatOverrides(version);

if (fs.existsSync(BROWSER_APP_PATH)) {
    updateTheiaDependencyVersion(BROWSER_APP_PATH, version, undefined, reactVersion);
}

if (fs.existsSync(ELECTRON_APP_PATH)) {
    updateTheiaDependencyVersion(ELECTRON_APP_PATH, version, electronVersion, reactVersion);
}
