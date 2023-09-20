/********************************************************************************
 * Copyright (c) 2023 EclipseSource and others.
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
import { WebSocketWrapper, createWebSocketConnection } from '@eclipse-glsp/protocol';
import { Channel, Disposable, DisposableCollection } from '@theia/core';
import { MessageConnection } from '@theia/core/shared/vscode-languageserver-protocol';
import { WebSocket } from 'ws';

/**
 * Creates a new vscode-jsonrpc {@link MessageConnection} on top of a given WebSocket.
 * It handles messages between then service client channel and the given WebSocket.
 */
export class WebSocketConnectionForwarder implements Disposable {
    protected toDispose = new DisposableCollection();

    protected initialChannelListener: Disposable;
    protected initialBufferStore: Uint8Array[] = [];

    constructor(protected readonly clientChannel: Channel, protected readonly webSocket: WebSocket) {
        /**
         * The webSocket connection is successfully established `onOpen`
         * The service client channel however, might send message (i.e. the InitializeRequest) once the backend contribution is resolved.
         * In this case, the listener could not yet be successfully registered, hence we buffer such messages and process them,
         * once the webSocket connection was successfully established.
         */
        this.initialChannelListener = this.clientChannel.onMessage(msgProvider => {
            const buffer = msgProvider().readBytes();
            this.initialBufferStore.push(buffer);
        });

        webSocket.onopen = () => {
            this.initialize(webSocket);
        };
    }

    protected initialize(webSocket: WebSocket): void {
        const wrappedWebSocket = wrapWebSocket(webSocket);
        const connection: MessageConnection = createWebSocketConnection(wrappedWebSocket);
        connection.listen();

        this.toDispose.pushAll([
            connection.onClose(() => webSocket.close()),
            this.clientChannel.onMessage(msgProvider => {
                const buffer = msgProvider().readBytes();
                wrappedWebSocket.send(this.decodeMessage(buffer));
            }),
            connection.onClose(() => this.clientChannel.close()),
            Disposable.create(() => {
                this.clientChannel.close();
                connection.dispose();
            })
        ]);
        webSocket.on('message', msg => {
            this.clientChannel
                .getWriteBuffer()
                .writeBytes(msg as Buffer)
                .commit();
        });

        // process initially received buffer messages
        this.initialChannelListener.dispose();
        this.initialBufferStore.forEach(msg => {
            wrappedWebSocket.send(this.decodeMessage(msg));
        });
        this.initialBufferStore = [];
    }

    protected decodeMessage(buffer: Uint8Array): string {
        return new TextDecoder().decode(buffer);
    }

    dispose(): void {
        this.toDispose.dispose();
    }
}

export function wrapWebSocket(socket: WebSocket): WebSocketWrapper {
    return {
        send: content => socket.send(content),
        onMessage: cb => socket.on('message', cb),
        onClose: cb => socket.on('close', cb),
        onError: cb => socket.on('error', cb),
        dispose: () => socket.close()
    };
}
