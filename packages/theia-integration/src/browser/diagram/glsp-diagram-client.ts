/********************************************************************************
 * Copyright (c) 2019-2020 EclipseSource and others.
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
import { GLSPClient } from '@eclipse-glsp/protocol';
import { CommandRegistry } from '@theia/core';
import { ApplicationShell } from '@theia/core/lib/browser';
import { EditorManager } from '@theia/editor/lib/browser';
import { inject, injectable } from 'inversify';
import { ActionMessage } from 'sprotty';

import { GLSPClientContribution } from '../glsp-client-contribution';

export interface ActionMessageReceiver {
    onMessageReceived(message: ActionMessage): void;
}

@injectable()
export class GLSPDiagramClient {

    protected actionMessageReceivers: ActionMessageReceiver[] = [];

    @inject(ApplicationShell) protected readonly shell: ApplicationShell;
    @inject(CommandRegistry) protected readonly commandsRegistry: CommandRegistry;

    constructor(readonly glspClientContribution: GLSPClientContribution,
        readonly editorManager: EditorManager) {
        this.glspClientContribution.glspClient
            .then(gc => gc.onActionMessage(this.onMessageReceived.bind(this)))
            .catch(err => console.error(err));
    }

    sendThroughLsp(message: ActionMessage): void {
        this.glspClientContribution.glspClient
            .then(client => client.sendActionMessage(message));
    }

    protected onMessageReceived(message: ActionMessage): void {
        this.actionMessageReceivers.forEach(client => client.onMessageReceived(message));
    }

    get glspClient(): Promise<GLSPClient> {
        return this.glspClientContribution.glspClient;
    }

    didClose(_clientId: string): void {
        // this.glspClient.then(gc => gc.stop())
    }

    connect(client: ActionMessageReceiver): void {
        this.actionMessageReceivers.push(client);
    }

    disconnect(client: ActionMessageReceiver): void {
        const index = this.actionMessageReceivers.indexOf(client);
        if (index >= 0) {
            this.actionMessageReceivers.splice(index);
        }
    }
}
