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
    MaybePromise
} from '@eclipse-glsp/client';
import { Disposable, DisposableCollection, MessageService } from '@theia/core';
import { FrontendApplication, WebSocketConnectionProvider } from '@theia/core/lib/browser';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { inject, injectable } from '@theia/core/shared/inversify';
import 'sprotty-theia/css/theia-sprotty.css';
import 'sprotty/css/sprotty.css';
import '../../css/command-palette.css';
import '../../css/decoration.css';
import '../../css/diagram.css';
import '../../css/theia-dialogs.css';
import '../../css/tool-palette.css';
import { GLSPContribution } from '../common';
import { createChannelConnection } from './channel-connection';
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
    activate(app: FrontendApplication): void;

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

    /**
     * The cached result of the client initialization
     * @returns  A promise that will resolve after  {@link GLSPClient.initializeServer} has been called
     */
    readonly initializeResult: Promise<InitializeResult>;
}

@injectable()
export abstract class BaseGLSPClientContribution implements GLSPClientContribution {
    abstract readonly id: string;

    protected glspClientDeferred: Deferred<GLSPClient> = new Deferred();
    protected readonly toDispose = new DisposableCollection();
    protected _initializeResult: InitializeResult | undefined;

    @inject(MessageService) protected readonly messageService: MessageService;
    @inject(WebSocketConnectionProvider) protected readonly connectionProvider: WebSocketConnectionProvider;

    get glspClient(): Promise<GLSPClient> {
        return this.glspClientDeferred.promise;
    }

    get initializeResult(): Promise<InitializeResult> {
        return this.glspClient.then(_client => {
            if (!this._initializeResult) {
                throw new Error('Server is not yet initialized!');
            }
            return this._initializeResult;
        });
    }

    waitForActivation?(app: FrontendApplication): Promise<void>;

    activate(app: FrontendApplication): void {
        if (this.toDispose.disposed) {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            this.toDispose.push(new DisposableCollection(Disposable.create(() => {}))); // mark as not disposed
            if (this.waitForActivation) {
                this.waitForActivation(app).then(() => this.doActivate());
                return;
            }
            this.doActivate();
        }
    }

    deactivate(_app: FrontendApplication): void {
        this.toDispose.dispose();
    }

    protected async doActivate(): Promise<void> {
        try {
            this.connectionProvider.listen(
                {
                    path: GLSPContribution.getPath(this),
                    onConnection: channel => {
                        if (this.toDispose.disposed) {
                            channel.close();
                            return;
                        }
                        const connection = createChannelConnection(channel);
                        const client = this.createGLSPClient(connection);
                        this.start(client);
                        this.toDispose.pushAll([
                            Disposable.create(() => {
                                channel.close();
                                client.shutdownServer();
                                client.stop();
                            })
                        ]);
                    }
                },
                { reconnecting: true }
            );
        } catch (e) {
            console.error(e);
            this.glspClientDeferred.reject(e);
        }
    }

    protected async start(glspClient: GLSPClient): Promise<void> {
        await glspClient.start();
        this._initializeResult = await this.initialize(glspClient);
        this.glspClientDeferred.resolve(glspClient);
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

    protected createGLSPClient(connectionProvider: ConnectionProvider): GLSPClient {
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
