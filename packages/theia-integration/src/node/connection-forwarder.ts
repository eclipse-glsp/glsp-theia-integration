/********************************************************************************
 * Copyright (c) 2022 STMicroelectronics and others.
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
import { Message, MessageReader, MessageWriter } from 'vscode-jsonrpc';

export interface IConnection extends Disposable {
    readonly reader: MessageReader;
    readonly writer: MessageWriter;
    forward(to: IConnection, map?: (message: Message) => Message): void;
    onClose(callback: () => void): Disposable;
}

// Temporary fix/workaround to enable comparability with Theia >=1.27 until https://github.com/eclipse-theia/theia/issues/11405 is resolved

/**
 * Forwards messages from service channel to an (raw) `vscode-json-rpc` connection
 */
export class ConnectionForwarder implements Disposable {
    protected toDispose = new DisposableCollection();

    constructor(protected readonly channel: Channel, protected readonly connection: IConnection) {
        this.connection.reader.listen(message => this.writeMessage(message));
        this.toDispose.pushAll([
            this.channel.onMessage(msgProvider => {
                const message = this.decodeMessage(msgProvider);
                this.connection.writer.write(message);
            }),
            this.channel.onClose(() => this.connection.dispose()),
            this.connection.onClose(() => this.channel.close()),
            Disposable.create(() => {
                this.channel.close();
                this.connection.dispose();
            })
        ]);
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
