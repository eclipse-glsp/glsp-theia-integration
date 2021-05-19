/********************************************************************************
 * Copyright (C) 2017-2020 TypeFox and others.
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
import '../../css/decoration.css';
import '../../css/diagram.css';
import '../../css/theia-dialogs.css';
import '../../css/tool-palette.css';

import {
    ApplicationIdProvider,
    ClientState,
    ConnectionProvider,
    GLSPClient,
    InitializeParameters
} from '@eclipse-glsp/protocol';
import { Disposable, DisposableCollection, MaybePromise, MessageService } from '@theia/core';
import { FrontendApplication, WebSocketConnectionProvider } from '@theia/core/lib/browser';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { inject, injectable, multiInject } from '@theia/core/shared/inversify';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { DiagramManagerProvider } from 'sprotty-theia';
import { MessageConnection } from 'vscode-jsonrpc';

import { GLSPContribution } from '../common';
import { TheiaJsonrpcGLSPClient } from './theia-jsonrpc-glsp-client';

export const GLSPClientContribution = Symbol.for('GLSPClientContribution');

export interface GLSPClientContribution extends GLSPContribution {
    readonly running: boolean;
    readonly glspClient: Promise<GLSPClient>;
    waitForActivation(app: FrontendApplication): Promise<void>;
    activate(app: FrontendApplication): Disposable;
    deactivate(app: FrontendApplication): void;
}

@injectable()
export abstract class BaseGLSPClientContribution implements GLSPClientContribution {

    abstract readonly id: string;
    abstract readonly name: string;
    abstract readonly fileExtensions: string[];

    protected _glspClient: GLSPClient | undefined;

    protected resolveReady: (glspClient: GLSPClient) => void;
    protected ready: Promise<GLSPClient>;
    protected deferredConnection = new Deferred<MessageConnection>();
    protected readonly toDeactivate = new DisposableCollection();

    @inject(WorkspaceService) protected readonly workspaceService: WorkspaceService;
    @inject(MessageService) protected readonly messageService: MessageService;
    @inject(WebSocketConnectionProvider) protected readonly connectionProvider: WebSocketConnectionProvider;
    @multiInject(DiagramManagerProvider) protected diagramManagerProviders: DiagramManagerProvider[];

    constructor() {
        this.waitForReady();
    }

    get glspClient(): Promise<GLSPClient> {
        return this._glspClient ? Promise.resolve(this._glspClient) : this.ready;
    }

    waitForActivation(app: FrontendApplication): Promise<any> {
        const activationPromises: Promise<any>[] = [];
        const workspaceContains = this.workspaceContains;
        if (workspaceContains.length !== 0) {
            activationPromises.push(this.waitForItemInWorkspace());
        }
        activationPromises.push(this.waitForOpenDiagrams());
        if (activationPromises.length !== 0) {
            return Promise.all([
                this.ready,
                // eslint-disable-next-line no-async-promise-executor
                Promise.race(activationPromises.map(p => new Promise<void>(async resolve => {
                    try {
                        await p;
                        resolve();
                    } catch (e) {
                        console.error(e);
                    }
                })))
            ]);
        }
        return this.ready;
    }

    protected waitForOpenDiagrams(): Promise<any> {
        return Promise.race(this.diagramManagerProviders.map(diagramManagerProvider => diagramManagerProvider().then(diagramManager => new Promise<void>(resolve => {
            const disposable = diagramManager.onCreated(widget => {
                disposable.dispose();
                resolve();
            });
        }))));
    }

    activate(): Disposable {
        if (this.toDeactivate.disposed) {
            if (!this._glspClient) {
                this._glspClient = this.createGLSPCLient(() => this.deferredConnection.promise);
            }
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            const toStop = new DisposableCollection(Disposable.create(() => { })); // mark as not disposed
            this.toDeactivate.push(toStop);
            this.doActivate(this.toDeactivate)
                .then(() => this.initialize());
        }
        return this.toDeactivate;
    }

    deactivate(_app: FrontendApplication): void {
        this.toDeactivate.dispose();
    }

    protected async createInitializeParameters(): Promise<InitializeParameters> {
        const options = await this.createInitializeOptions();
        return {
            applicationId: ApplicationIdProvider.get(),
            options
        };
    }

    protected createInitializeOptions(): MaybePromise<any> {
        return undefined;
    }

    async initialize(): Promise<void> {
        const parameters = await this.createInitializeParameters();
        this.ready.then(client => client.initializeServer(parameters)
            .then(success => {
                if (!success) {
                    this.messageService.error(`Failed to initialize ${this.name} glsp server with ${JSON.stringify(parameters)}`, 'Retry')
                        .then(retry => {
                            if (retry) {
                                this.initialize();
                            }
                        });
                }
            })
        );
    }

    protected async doActivate(toStop: DisposableCollection): Promise<void> {
        try {
            this.connectionProvider.listen({
                path: GLSPContribution.getPath(this),
                onConnection: messageConnection => {
                    this.deferredConnection.resolve(messageConnection);
                    messageConnection.onDispose(() => this.deferredConnection = new Deferred<MessageConnection>());

                    if (toStop.disposed) {
                        messageConnection.dispose();
                        return;
                    }
                    const languageClient = this.createGLSPCLient(messageConnection);
                    this.onWillStart(languageClient);
                    toStop.pushAll([
                        messageConnection,
                        Disposable.create(() => {
                            languageClient.shutdownServer();
                            languageClient.stop();
                        }
                        )
                    ]);
                }
            }, { reconnecting: false });
        } catch (e) {
            console.error(e);
        }
    }

    get running(): boolean {
        return !this.toDeactivate.disposed && this._glspClient !== undefined
            && this._glspClient.currentState() === ClientState.Running;
    }

    protected async onWillStart(languageClient: GLSPClient): Promise<void> {
        await languageClient.start();
        this.onReady(languageClient);
    }

    protected onReady(languageClient: GLSPClient): void {
        this._glspClient = languageClient;
        this.resolveReady(this._glspClient);
        this.waitForReady();
    }

    protected waitForReady(): void {
        this.ready = new Promise<GLSPClient>(resolve =>
            this.resolveReady = resolve
        );
    }

    protected createGLSPCLient(connectionProvider: ConnectionProvider): GLSPClient {
        return new TheiaJsonrpcGLSPClient({
            name: this.name,
            id: this.id,
            connectionProvider
        }, this.messageService);
    }

    protected get workspaceContains(): string[] {
        return [];
    }

    protected async waitForItemInWorkspace(): Promise<any> {
        const doesContain = await this.workspaceService.containsSome(this.workspaceContains);
        if (!doesContain) {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            return new Promise(resolve => { });
        }
        return doesContain;
    }
}
