/********************************************************************************
 * Copyright (c) 2022-2023 STMicroelectronics and others.
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
import { Channel, Disposable, DisposableCollection, MessageProvider } from '@theia/core';
import { Socket } from 'net';
import {
    createMessageConnection,
    Message,
    MessageConnection,
    MessageReader,
    MessageWriter,
    SocketMessageReader,
    SocketMessageWriter
} from 'vscode-jsonrpc/node';
/**
 * Creates a new {@link MessageConnection} on top of a given socket and forwards messages from service channel to this connection
 */
export class SocketConnectionForwarder implements Disposable {
    protected toDispose = new DisposableCollection();

    constructor(protected readonly channel: Channel, protected readonly socket: Socket) {
        const reader = new SocketMessageReader(socket);
        const writer = new SocketMessageWriter(socket);
        const connection = this.createMessageConnection(reader, writer);
        this.toDispose.pushAll([
            connection.onClose(() => socket.destroy()),
            reader.listen(message => this.writeMessage(message)),
            this.channel.onMessage(msgProvider => {
                const message = this.decodeMessage(msgProvider);
                writer.write(message);
            }),
            this.channel.onClose(() => connection.dispose()),
            connection.onClose(() => this.channel.close()),
            Disposable.create(() => {
                this.channel.close();
                connection.dispose();
            })
        ]);
    }

    protected createMessageConnection(reader: MessageReader, writer: MessageWriter): MessageConnection {
        return createMessageConnection(reader, writer);
    }

    protected decodeMessage(msgProvider: MessageProvider): Message {
        const buffer = msgProvider().readBytes();
        return JSON.parse(new TextDecoder().decode(buffer));
    }

    protected writeMessage(message: Message): void {
        const writeBuffer = this.channel.getWriteBuffer();
        writeBuffer.writeBytes(Buffer.from(JSON.stringify(message, undefined, 0)));
        writeBuffer.commit();
    }

    dispose(): void {
        this.toDispose.dispose();
    }
}
