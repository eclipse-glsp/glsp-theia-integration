/********************************************************************************
 * Copyright (c) 2019-2026 EclipseSource and others.
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
import {
    getPort,
    getWebSocketPath,
    GLSPSocketServerContribution,
    GLSPSocketServerContributionOptions
} from '@eclipse-glsp/theia-integration/lib/node';
import { injectable } from '@theia/core/shared/inversify';
import { createRequire } from 'node:module';
import { dirname, join } from 'path';
import { WorkflowLanguage } from '../common/workflow-language';

export const DEFAULT_PORT = 0;
export const PORT_ARG_KEY = 'WF_GLSP';
export const WEBSOCKET_PATH_ARG_KEY = 'WF_PATH';

export const LOG_DIR = join(__dirname, '..', '..', '..', '..', 'logs');

// Anchor resolution on workflow-theia's own package, which declares workflow-server-bundled.
// Works both when installed+hoisted (published) and when cross-repo linked (the bundle lives in
// glsp-server-node, symlinked under workflow-theia/node_modules — not at the app's repo root).
// Resolve via createRequire instead of a literal require.resolve so esbuild keeps it a runtime
// lookup against the real node_modules layout rather than rewriting it into the backend bundle.
const wfTheiaDir = dirname(createRequire(__filename).resolve('@eclipse-glsp-examples/workflow-theia/package.json'));
export const SERVER_MODULE = createRequire(wfTheiaDir + '/').resolve(
    '@eclipse-glsp-examples/workflow-server-bundled/wf-glsp-server-node.js'
);

@injectable()
export class WorkflowGLSPSocketServerContribution extends GLSPSocketServerContribution {
    readonly id = WorkflowLanguage.contributionId;

    createContributionOptions(): Partial<GLSPSocketServerContributionOptions> {
        return {
            executable: SERVER_MODULE,
            additionalArgs: ['--no-consoleLog', '--fileLog', '--logDir', LOG_DIR],
            socketConnectionOptions: {
                port: getPort(PORT_ARG_KEY, DEFAULT_PORT),
                path: getWebSocketPath(WEBSOCKET_PATH_ARG_KEY)
            }
        };
    }
}
