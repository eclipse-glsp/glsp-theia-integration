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
import { Channel, Disposable, DisposableCollection, Emitter, MessageProvider } from '@theia/core';
import {
    AbstractMessageReader, AbstractMessageWriter, createMessageConnection, DataCallback, Logger, Message,
    MessageConnection, MessageReader, MessageWriter
} from 'vscode-jsonrpc';

// Temporary fix/workaround to enable comparability with Theia >=1.27 until https://github.com/eclipse-theia/theia/issues/11405 is resolved

/**
 * A `vscode-jsonrpc` {@link MessageReader} that reads messages from an underlying {@link Channel}.
 */
export class ChannelMessageReader extends AbstractMessageReader implements MessageReader {
    protected onMessageEmitter = new Emitter<Message>();
    protected toDispose = new DisposableCollection();

    constructor(protected readonly channel: Channel) {
        super();
        this.toDispose.push(this.onMessageEmitter);
        this.toDispose.push(channel.onMessage(data => this.handleMessage(data)));
        this.toDispose.push(channel.onClose(() => this.fireClose()));
    }

    protected handleMessage(msgProvider: MessageProvider): void {
        const buffer = msgProvider().readBytes();
        const message = JSON.parse(new TextDecoder().decode(buffer));
        this.onMessageEmitter.fire(message);
    }

    override dispose(): void {
        super.dispose();
        this.toDispose.dispose();
    }

    listen(callback: DataCallback): Disposable {
        return this.onMessageEmitter.event(callback);
    }
}

/**
 * A `vscode-jsonrpc` {@link MessageWriter} that writes messages to an underlying {@link Channel}.
 */
export class ChannelMessageWriter extends AbstractMessageWriter implements MessageWriter {
    protected toDispose: Disposable;

    constructor(protected readonly channel: Channel) {
        super();
        this.toDispose = channel.onClose(() => this.fireClose());
    }

    async write(msg: Message): Promise<void> {
        const writeBuffer = this.channel.getWriteBuffer();
        writeBuffer.writeBytes(Buffer.from(JSON.stringify(msg, undefined, 0)));
        writeBuffer.commit();
    }

    end(): void {
        this.dispose();
    }

    override dispose(): void {
        super.dispose();
        this.toDispose.dispose();
    }
}

/**
 * Create a `vscode-jsonrpc` {@link MessageConnection} on top of a given {@link Channel}.
 */
export function createChannelConnection(channel: Channel, logger?: Logger): MessageConnection {
    const reader = new ChannelMessageReader(channel);
    const writer = new ChannelMessageWriter(channel);
    return createMessageConnection(reader, writer, logger);
}
