/********************************************************************************
 * Copyright (C) 2017-2022 TypeFox and others.
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
/* eslint-disable indent */

import { MaybePromise } from '@eclipse-glsp/protocol';
import { WebSocketChannelConnection } from '@theia/core/lib/node/messaging';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { ProcessErrorEvent } from '@theia/process/lib/node/process';
import { ProcessManager } from '@theia/process/lib/node/process-manager';
import { RawProcess, RawProcessFactory } from '@theia/process/lib/node/raw-process';
import * as cp from 'child_process';
import { forward, IConnection } from 'vscode-ws-jsonrpc/lib/server';
import { GLSPContribution } from '../common';

export const GLSPServerContribution = Symbol.for('GLSPServerContribution');

/**
 * The backend service component of a {@link GLSPContribution}. Responsible for launching new
 * GLSP server processes or connecting to a running server instance.
 */
export interface GLSPServerContribution extends GLSPContribution {
    /**
     * Establish a connection between the given client (connection) and the GLSP server.
     * @param clientConnection  The client (connection) which should be connected to the server
     */
    connect(clientConnection: IConnection): MaybePromise<void>;

    /**
     * Optional function that can be used by the contribution to launch an embedded GLSP server.
     * @returns A 'Promise' that resolves after the server has been successfully launched and is ready to establish a client connection.
     */
    launch?(): Promise<void>;

    /**
     * The {@link GLSPServerContributionOptions} for this contribution.
     */
    options: GLSPServerContributionOptions;
}

/**
 * Configuration options for a {@link GLSPServerContribution}.
 */
export interface GLSPServerContributionOptions {
    /** Declares wether the  server should be launched on application start or on demand (e.g. on widget open). */
    launchOnDemand: boolean;
    /**
     * Declares that the server contribution does not have to launch a server but expects it to be already started.
     * Mostly used for debugging purposes during development.
     */
    launchedExternally: boolean;
}

export namespace GLSPServerContributionOptions {
    /** Default values for {@link GLSPServerContributionOptions } **/
    export function createDefaultOptions(): GLSPServerContributionOptions {
        return {
            launchOnDemand: false,
            launchedExternally: inDebugMode()
        } as GLSPServerContributionOptions;
    }

    /**
     * Utility function to partially set the launch options. Default values (from 'defaultOptions') are used for
     * options that are not specified.
     * @param options (partial) launch options that should be extended with default values (if necessary).
     */
    export function configure(options?: Partial<GLSPServerContributionOptions>): GLSPServerContributionOptions {
        return options
            ? ({
                  ...createDefaultOptions(),
                  ...options
              } as GLSPServerContributionOptions)
            : createDefaultOptions();
    }

    export const debugArgument = '--debug';

    /**
     * Utility function which specifies if the Theia application has been started in debug mode.
     * i.e. if the '--debug' flag has been passed.
     * @returns `true` if the '--debug' flag has been set.
     */
    export function inDebugMode(): boolean {
        const args = process.argv.filter(a => a.toLowerCase().startsWith(debugArgument.toLowerCase()));
        return args.length > 0;
    }

    /**
     * Utility function that processes the contribution launch options to determine wether the server should be launched on
     * application start.
     * @param contribution The glsp server contribution.
     * @returns `true` if the server should be launched on application start.
     */
    export function shouldLaunchOnApplicationStart(contribution: GLSPServerContribution): boolean {
        return contribution.launch !== undefined && !contribution.options.launchOnDemand && !contribution.options.launchedExternally;
    }
}

/**
 * A base implementation of {@link GLSPServerContribution} that provides utility methods for forwarding
 *  (frontend) client connections to a GLSP server and for spawning new server processes.
 */
@injectable()
export abstract class BaseGLSPServerContribution implements GLSPServerContribution {
    @inject(RawProcessFactory)
    protected readonly processFactory: RawProcessFactory;

    @inject(ProcessManager)
    protected readonly processManager: ProcessManager;

    abstract readonly id: string;
    options: GLSPServerContributionOptions;

    @postConstruct()
    protected initialize(): void {
        this.options = this.createContributionOptions
            ? GLSPServerContributionOptions.configure(this.createContributionOptions())
            : GLSPServerContributionOptions.createDefaultOptions();
    }

    abstract connect(clientConnection: IConnection): void;

    abstract createContributionOptions?(): Partial<GLSPServerContributionOptions>;

    protected forward(clientConnection: IConnection, serverConnection: IConnection): void {
        forward(clientConnection, serverConnection);
        if (WebSocketChannelConnection.is(clientConnection)) {
            serverConnection.onClose(() => clientConnection.channel.tryClose());
        }
    }

    protected spawnProcessAsync(command: string, args?: string[], options?: cp.SpawnOptions): Promise<RawProcess> {
        const rawProcess = this.processFactory({ command, args, options });
        rawProcess.errorStream.on('data', this.processLogError.bind(this));
        rawProcess.outputStream.on('data', this.processLogInfo.bind(this));
        return new Promise<RawProcess>((resolve, reject) => {
            rawProcess.onError((error: ProcessErrorEvent) => {
                this.onDidFailSpawnProcess(error);
                if (error.code === 'ENOENT') {
                    const guess = command.split(/\s+/).shift();
                    if (guess) {
                        reject(new Error(`Failed to spawn ${guess}\nPerhaps it is not on the PATH.`));
                        return;
                    }
                }
                reject(error);
            });
            process.nextTick(() => resolve(rawProcess));
        });
    }

    protected onDidFailSpawnProcess(error: Error | ProcessErrorEvent): void {
        console.error(error);
    }

    protected processLogError(data: string | Buffer): void {
        if (data) {
            console.error(`${this.id}: ${data}`);
        }
    }

    protected processLogInfo(data: string | Buffer): void {
        if (data) {
            console.info(`${this.id}: ${data}`);
        }
    }
}
