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
import { MaybePromise } from "@eclipse-glsp/client";
import { WebSocketChannelConnection } from "@theia/core/lib/node/messaging";
import { ProcessErrorEvent } from "@theia/process/lib/node/process";
import { ProcessManager } from "@theia/process/lib/node/process-manager";
import { RawProcess, RawProcessFactory } from "@theia/process/lib/node/raw-process";
import * as cp from "child_process";
import { inject, injectable } from "inversify";
import * as net from "net";
import { createProcessSocketConnection, createStreamConnection, forward, IConnection } from "vscode-ws-jsonrpc/lib/server";

import { GLSPContribution } from "../common";

export const GLSPServerContribution = Symbol.for('GLSPServerContribution');
export interface GLSPServerStartOptions {
    sessionId: string
    parameters?: any
}

export interface GLSPServerContribution extends GLSPContribution {
    start(clientConnection: IConnection, options: GLSPServerStartOptions): MaybePromise<void>;
}

@injectable()
export abstract class BaseGLSPServerContribution implements GLSPServerContribution {

    @inject(RawProcessFactory) protected readonly processFactory: RawProcessFactory;
    @inject(ProcessManager) protected readonly processManager: ProcessManager;
    abstract readonly id: string;
    abstract readonly name: string;
    abstract start(clientConnection: IConnection, options?: GLSPServerStartOptions): void;

    protected forward(clientConnection: IConnection, serverConnection: IConnection): void {
        forward(clientConnection, serverConnection);
        if (WebSocketChannelConnection.is(clientConnection)) {
            serverConnection.onClose(() => clientConnection.channel.tryClose());
        }
    }

    protected async createProcessSocketConnection(outSocket: MaybePromise<net.Socket>, inSocket: MaybePromise<net.Socket>,
        command: string, args?: string[], options?: cp.SpawnOptions): Promise<IConnection> {
        const process = await this.spawnProcessAsync(command, args, options);
        const [outSock, inSock] = await Promise.all<net.Socket>([outSocket, inSocket]);
        return createProcessSocketConnection(process.process!, outSock, inSock);
    }

    protected async createProcessStreamConnectionAsync(command: string, args?: string[], options?: cp.SpawnOptions): Promise<IConnection> {
        const process = await this.spawnProcessAsync(command, args, options);
        return createStreamConnection(process.outputStream, process.inputStream, () => process.kill());
    }

    protected spawnProcessAsync(command: string, args?: string[], options?: cp.SpawnOptions): Promise<RawProcess> {
        const rawProcess = this.processFactory({ command, args, options });
        rawProcess.errorStream.on('data', this.logError.bind(this));
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

    protected logError(data: string | Buffer): void {
        if (data) {
            console.error(`${this.name}: ${data}`);
        }
    }

    protected logInfo(data: string | Buffer): void {
        if (data) {
            console.info(`${this.name}: ${data}`);
        }
    }
}

export function getPort(argsKey: string): number {
    argsKey = `--${argsKey.replace("--", "").replace("=", "")}=`;
    const args = process.argv.filter(a => a.startsWith(argsKey));
    if (args.length > 0) {
        return Number.parseInt(args[0].substring(argsKey.length), 10);
    }
    return NaN;
}

