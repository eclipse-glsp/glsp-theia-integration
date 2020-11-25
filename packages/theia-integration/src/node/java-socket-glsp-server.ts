/********************************************************************************
 * Copyright (c) 2020 EclipseSource and others.
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
import * as fs from "fs";
import { injectable, postConstruct } from "inversify";
import * as net from "net";
import { createSocketConnection, IConnection } from "vscode-ws-jsonrpc/lib/server";

import { BaseGLSPServerContribution, GLSPServerLaunchOptions } from "./glsp-server-contribution";

export const START_UP_COMPLETE_MSG = "[GLSP-Server]:Startup completed";
export interface JavaSocketServerLaunchOptions extends GLSPServerLaunchOptions {
    /** Path to the location of the jar file that should be launched as process */
    jarPath: string,
    /** Port on which the server should listen for new client connections */
    serverPort: number,
    /** Additional arguments that should be passed when starting the server process. */
    additionalArgs?: string[]
}

export namespace JavaSocketServerLaunchOptions {
    /** Default values for {@link JavaGLSPServerLaunchOptions }**/
    export function createDefaultOptions(): JavaSocketServerLaunchOptions {
        return <JavaSocketServerLaunchOptions>{
            ...GLSPServerLaunchOptions.createDefaultOptions(),
            jarPath: "",
            serverPort: NaN
        };
    }

    /**
    * Utility function to partially set the launch options. Default values (from 'defaultOptions') are used for
    * options that are not specified.
    * @param options (partial) launch options that should be extended with default values (if necessary)
    */
    export function configure(options?: Partial<JavaSocketServerLaunchOptions>): JavaSocketServerLaunchOptions {
        return options ?
            <JavaSocketServerLaunchOptions>{
                ...createDefaultOptions(),
                ...options
            } : createDefaultOptions();
    }
}

/**
 *  A reusable base implementation for {@link GLSPServerContribution}s that are using a socket connection to communicate
 *  with a java-based GLSP server.
 **/
@injectable()
export abstract class JavaSocketServerContribution extends BaseGLSPServerContribution {

    protected resolveReady: (value?: void | PromiseLike<void> | undefined) => void;
    onReady: Promise<void> = new Promise(resolve => this.resolveReady = resolve);
    launchOptions: JavaSocketServerLaunchOptions;

    @postConstruct()
    protected initialize() {
        if (this.createLaunchOptions) {
            this.launchOptions = JavaSocketServerLaunchOptions.configure(this.createLaunchOptions());
        }
    }

    abstract createLaunchOptions(): Partial<JavaSocketServerLaunchOptions>;

    connect(clientConnection: IConnection): void {
        this.connectToSocketServer(clientConnection);
    }
    async launch(): Promise<void> {
        if (!fs.existsSync(this.launchOptions.jarPath)) {
            throw Error(`Could not launch GLSP server. The given jar path is not valid: ${this.launchOptions.jarPath}`);
        }
        if (isNaN(this.launchOptions.serverPort)) {
            throw new Error(`Could not launch GLSP Server. The given server port is not a number: ${this.launchOptions.serverPort}`);
        }
        let args = ["-jar", this.launchOptions.jarPath, "--port", `${this.launchOptions.serverPort}`];
        if (this.launchOptions.additionalArgs) {
            args = [...args, ...this.launchOptions.additionalArgs];
        }

        await this.spawnProcessAsync("java", args, undefined);
        return this.onReady;
    }


    protected processLogInfo(data: string | Buffer): void {
        if (data) {
            const message = data.toString();
            if (message.startsWith(START_UP_COMPLETE_MSG)) {
                this.resolveReady();
            }
        }
    }

    protected processLogError(data: string | Buffer): void {
        // Override console logging of errors. To avoid a polluted client console.
    }

    protected connectToSocketServer(clientConnection: IConnection) {
        if (isNaN(this.launchOptions.serverPort)) {
            throw new Error(`Could not connect to to GLSP Server. The given server port is not a number: ${this.launchOptions.serverPort}`);
        }
        const socket = new net.Socket();
        const serverConnection = createSocketConnection(socket, socket, () => {
            socket.destroy();
        });
        this.forward(clientConnection, serverConnection);
        socket.connect(this.launchOptions.serverPort);
    }
}

