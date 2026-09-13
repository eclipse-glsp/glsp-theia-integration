/********************************************************************************
 * Copyright (c) 2026 EclipseSource and others.
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
import { getPort } from '@eclipse-glsp-examples/workflow-e2e/configs';
import type { PlaywrightTestConfig } from '@playwright/test';
import { createRequire } from 'module';
import * as path from 'path';
import { GLSP_WEBSOCKET_PATH, THEIA_DEFAULT_PORT } from './env';

export type WebServerConfig = Exclude<NonNullable<PlaywrightTestConfig['webServer']>, readonly unknown[]>;

/** Server type whose GLSP server lives in the separate `glsp-server` repository. */
const GLSP_SERVER_TYPE_JAVA = 'java';

/**
 * Directory of the Theia browser application under test.
 *
 * @param configDir Directory of the calling `playwright.config.ts`, i.e. `__dirname`
 */
function getBrowserAppDir(configDir: string): string {
    return path.resolve(configDir, '..', '..', 'examples', 'browser-app');
}

/**
 * Whether the GLSP server is provided by the caller instead of being started by Playwright.
 *
 * Always the case for `GLSP_SERVER_TYPE=java`, whose server is built by Maven in the separate
 * `glsp-server` repository and has to be running before the tests are started. Otherwise opt-in, for
 * attaching a debugger to the server.
 */
function usesExternalServer(): boolean {
    return process.env.GLSP_SERVER_TYPE === GLSP_SERVER_TYPE_JAVA || process.env.GLSP_SERVER_EXTERNAL === 'true';
}

/**
 * The bundled Workflow Node server, resolved out of `node_modules`.
 *
 * Anchored on this package, which declares `workflow-server-bundled`, so the lookup does not depend
 * on the hoisting layout of the installing workspace.
 */
function resolveNodeServerModule(): string {
    return createRequire(__filename).resolve('@eclipse-glsp-examples/workflow-server-bundled/wf-glsp-server-node.js');
}

/**
 * The bundled Workflow Node server.
 *
 * Must come first in the `webServer` array so that Theia is started against a running server. Theia
 * is launched with `--glspDebug`, which makes its server contribution attach to this process instead
 * of spawning a second one.
 */
export function buildGlspServerWebServer(): WebServerConfig {
    const port = getPort('GLSP_SERVER_PORT');

    return {
        command: `node ${resolveNodeServerModule()} --webSocket --port ${port}`,
        port,
        reuseExistingServer: !process.env.CI,
        stdout: 'ignore'
    };
}

/**
 * The GLSP server plus the Theia browser application.
 *
 * @param configDir Directory of the calling `playwright.config.ts`, i.e. `__dirname`
 */
export function buildWebServers(configDir: string): PlaywrightTestConfig['webServer'] {
    const theiaPort = getPort('THEIA_PORT', THEIA_DEFAULT_PORT);
    const glspServerPort = getPort('GLSP_SERVER_PORT');

    const theia: WebServerConfig = {
        // `theia start` is invoked directly rather than through the app's own `start` script, so
        // that the ports stay under the control of this configuration.
        command:
            `pnpm -C "${getBrowserAppDir(configDir)}" exec theia start` +
            ` --port ${theiaPort} --hostname localhost` +
            ` --WF_GLSP=${glspServerPort} --WF_PATH=${GLSP_WEBSOCKET_PATH} --glspDebug`,
        port: theiaPort,
        reuseExistingServer: !process.env.CI,
        stdout: 'ignore',
        stderr: 'ignore',
        env: { ...(process.env as Record<string, string>) }
    };

    return usesExternalServer() ? [theia] : [buildGlspServerWebServer(), theia];
}
