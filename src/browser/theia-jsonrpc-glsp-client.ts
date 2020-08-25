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
import { BaseJsonrpcGLSPClient, ClientState, JsonrpcGLSPClient } from "@eclipse-glsp/client";
import { MessageService } from "@theia/core/";
import { Message } from "vscode-jsonrpc";

export class TheiaJsonrpcGLSPClient extends BaseJsonrpcGLSPClient {

    constructor(options: JsonrpcGLSPClient.Options, protected readonly messageService: MessageService) {
        super(options);
    }

    protected handleConnectionError(error: Error, message: Message, count: number): void {
        super.handleConnectionError(error, message, count);
        this.messageService.error(`Connection the ${this.name} glsp server is erroring. Shutting down server.`);
    }

    protected handleConnectionClosed(): void {
        if (this.state !== ClientState.Stopping && this.state !== ClientState.Stopped) {
            this.messageService.error(`Connection to the ${this.name} glsp server got closed. Server will not be restarted.`);
        }
        super.handleConnectionClosed();
    }

    protected checkConnectionState(): boolean {
        if (this.state === ClientState.ServerError) {
            this.messageService.error(`Could not establish connection to ${this.name} glsp server. Maybe the server has been shutdown due to a previous error.`);
        }
        return super.checkConnectionState();
    }

}
