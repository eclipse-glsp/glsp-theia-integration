/********************************************************************************
 * Copyright (c) 2019-2023 EclipseSource and others.
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
import { Args, MaybePromise } from '@eclipse-glsp/client';
import { BaseGLSPClientContribution, WebSocketConnectionOptions } from '@eclipse-glsp/theia-integration/lib/browser';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { inject, injectable } from '@theia/core/shared/inversify';
import { WorkflowLanguage } from '../common/workflow-language';

export interface WorkflowInitializeOptions {
    timestamp: Date;
    message: string;
}

@injectable()
export class WorkflowGLSPClientContribution extends BaseGLSPClientContribution {
    @inject(EnvVariablesServer)
    protected readonly envVariablesServer: EnvVariablesServer;

    readonly id = WorkflowLanguage.contributionId;
    readonly fileExtensions = WorkflowLanguage.fileExtensions;

    protected override createInitializeOptions(): MaybePromise<Args | undefined> {
        return {
            ['timestamp']: new Date().toString(),
            ['message']: 'Custom Options Available'
        };
    }

    protected override async getWebSocketConnectionOptions(): Promise<WebSocketConnectionOptions | undefined> {
        const webSocketPort = await this.getWebSocketPortFromEnv();
        if (webSocketPort) {
            return {
                path: this.id,
                port: webSocketPort
            };
        }
        return undefined;
    }

    protected async getWebSocketPortFromEnv(): Promise<number | undefined> {
        const envVar = await this.envVariablesServer.getValue('WEBSOCKET_PORT');
        if (envVar && envVar.value) {
            const webSocketPort = Number.parseInt(envVar.value, 10);
            if (isNaN(webSocketPort) || webSocketPort < 0 || webSocketPort > 65535) {
                throw new Error('Value of environment variable WEBSOCKET_PORT is not a valid port');
            }
            return webSocketPort;
        }
        return undefined;
    }
}
