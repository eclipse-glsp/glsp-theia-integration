/********************************************************************************
 * Copyright (C) 2019-2023 EclipseSource and others.
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
    ApplicationIdProvider,
    Args,
    ConnectionProvider,
    GLSPClient,
    InitializeParameters,
    InitializeResult,
    MaybePromise,
    listen
} from '@eclipse-glsp/client';
import { Disposable, DisposableCollection, MessageService } from '@theia/core';
import { FrontendApplication, WebSocketConnectionProvider } from '@theia/core/lib/browser';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { inject, injectable } from '@theia/core/shared/inversify';
import { MessageConnection } from 'vscode-jsonrpc';

import '../../css/command-palette.css';
import '../../css/decoration.css';
import '../../css/diagram.css';
import '../../css/theia-dialogs.css';
import '../../css/tool-palette.css';
import {
    GLSPContribution,
    WebSocketConnectionInfo,
    createChannelConnection,
    getWebSocketAddress,
    isValidWebSocketAddress
} from '../common';
import { TheiaJsonrpcGLSPClient } from './theia-jsonrpc-glsp-client';
export const GLSPClientContribution = Symbol.for('GLSPClientContribution');

/**
 * The frontend service component of a {@link GLSPContribution}. Responsible for providing & initializing the
 * {@link GLSPClient}.
 */
export interface GLSPClientContribution extends GLSPContribution {
    /**
     * Triggers the setup for the {@link GLSPClient}.
     * The activation phase consists of the following steps:
     *  - Establish a service connection to the corresponding backend contribution (`GLSPServerContribution`)
     *  - Create a new {@link GLSPClient} on top of the service connection
     *  - Start the client
     *  - Initialize the server
     *
     * The {@link GLSPClientContribution.waitForActivation} function can be used to further delay the activation
     * @param app Theia`s frontend application
     */
    activate(app: FrontendApplication): MaybePromise<void>;

    /**
     * Optional function to delay the activation of this client contribution until certain conditions are met
     * @param app Theia`s frontend application
     * @returns A promise that resolves once all activation conditions are met.
     */
    waitForActivation?(app: FrontendApplication): Promise<void>;

    /**
     * Deactivates the contribution and disposes all underlying resources e.g. the service connection
     * and the glsp client.
     *
     * @param app Theia`s frontend application
     */
    deactivate(app: FrontendApplication): void;

    /**
     * Retrieve the activated {@link GLSPClient}.
     * @returns A promise of the client that resolves after the client has been started & initialized
     */
    readonly glspClient: Promise<GLSPClient>;
}

export type WebSocketConnectionOptions =
    // The address of the GLSP server websocket endpoint
    | string
    // or a info object
    | WebSocketConnectionInfo;

/**
 * Base implementation for {@link GLSPClientContribution}s. The default implementation setups a {@link GLSPClient} that
 * uses a Theia service connection to communicate with the corresponding `GLSPBackendContribution`.
 * Subclasses can override the {@link BaseGLSPClientContribution.getWebSocketConnectionOptions} method. If this method
 * provides websocket options the  `GLSPClient` is not routed via service connection to the Theia backend, and instead directly
 * communicates with a `GLSPServer` via WebSocket.
 */
@injectable()
export abstract class BaseGLSPClientContribution implements GLSPClientContribution {
    abstract readonly id: string;

    protected glspClientDeferred: Deferred<GLSPClient> = new Deferred();
    protected readonly toDispose = new DisposableCollection();
    protected glspClientStartupTimeout = 15000;

    protected getWebSocketConnectionOptions(): MaybePromise<WebSocketConnectionOptions | undefined> {
        return undefined;
    }

    @inject(MessageService) protected readonly messageService: MessageService;
    @inject(WebSocketConnectionProvider) protected readonly connectionProvider: WebSocketConnectionProvider;

    get glspClient(): Promise<GLSPClient> {
        return this.glspClientDeferred.promise;
    }

    waitForActivation?(app: FrontendApplication): Promise<void>;

    activate(app: FrontendApplication): MaybePromise<void> {
        if (this.toDispose.disposed) {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            this.toDispose.push(new DisposableCollection(Disposable.create(() => {}))); // mark as not disposed
            if (this.waitForActivation) {
                return this.waitForActivation(app).then(() => this.doActivate());
            }
            return this.doActivate();
        }
    }

    deactivate(_app: FrontendApplication): void {
        this.dispose();
    }

    protected doActivate(): void {
        /* Let `doActivate` complete synchronous even though 'activateClient' is asynchronous.
         This way we don't block the startup of other contributions. We are using a deferred GLSPClient anyways
         that only resolves after client activation is completed */
        this.activateClient();
    }

    protected async activateClient(): Promise<void> {
        const connection = await this.createConnection();
        const client = await this.createGLSPClient(connection);
        connection.onDispose(() => {
            client.stop();
        });
        return this.start(client);
    }

    protected async createConnection(): Promise<MessageConnection> {
        const opts = await this.getWebSocketConnectionOptions();
        if (opts) {
            return this.createWebSocketConnection(opts);
        }
        return this.createChannelConnection();
    }

    protected createWebSocketConnection(opts: WebSocketConnectionOptions): Promise<MessageConnection> {
        const address = this.getWebsocketAddress(opts);
        const socket = new WebSocket(address);
        return listen(socket);
    }

    protected getWebsocketAddress(opts: WebSocketConnectionOptions): string {
        const address = typeof opts === 'string' ? opts : getWebSocketAddress(opts);
        if (!address) {
            throw new Error(`Could not derive server websocket address from options: ${JSON.stringify(opts, undefined, 2)}`);
        }
        if (!isValidWebSocketAddress(address)) {
            throw new Error(`The given websocket server address is not valid: ${address}`);
        }

        return address;
    }

    protected createChannelConnection(): Promise<MessageConnection> {
        return new Promise((resolve, reject) => {
            this.connectionProvider.listen(
                {
                    path: GLSPContribution.getPath(this),
                    onConnection: channel => {
                        if (this.toDispose.disposed) {
                            channel.close();
                            reject(new Error('GLSPClientContribution is already disposed'));
                        }
                        const connection = createChannelConnection(channel);
                        this.toDispose.push(connection);
                        if (Disposable.is(channel)) {
                            this.toDispose.push(channel);
                        }
                        resolve(connection);
                    }
                },
                { reconnecting: false }
            );
        });
    }

    protected async start(glspClient: GLSPClient): Promise<void> {
        try {
            await glspClient.start();
            await this.initialize(glspClient);
            this.glspClientDeferred.resolve(glspClient);
        } catch (error) {
            this.glspClientDeferred.reject(error);
        }
    }

    protected async initialize(languageClient: GLSPClient): Promise<InitializeResult> {
        try {
            const parameters = await this.createInitializeParameters();
            return await languageClient.initializeServer(parameters);
        } catch (error) {
            const errorMsg = `Failed to initialize ${this.id} glsp server with: ${error}`;
            this.messageService.error(errorMsg);
            return Promise.reject(errorMsg);
        }
    }

    protected async createInitializeParameters(): Promise<InitializeParameters> {
        const args = await this.createInitializeOptions();
        return {
            applicationId: ApplicationIdProvider.get(),
            protocolVersion: GLSPClient.protocolVersion,
            args
        };
    }

    protected createInitializeOptions(): MaybePromise<Args | undefined> {
        return undefined;
    }

    protected async createGLSPClient(connectionProvider: ConnectionProvider): Promise<GLSPClient> {
        return new TheiaJsonrpcGLSPClient({
            id: this.id,
            connectionProvider,
            messageService: this.messageService
        });
    }

    dispose(): void {
        this.toDispose.dispose();
    }
}
