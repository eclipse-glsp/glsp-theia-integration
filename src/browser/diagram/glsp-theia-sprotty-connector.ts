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
import {
    ActionMessage,
    ExportSvgAction,
    GLSPClient,
    isGLSPServerStatusAction,
    remove,
    ServerMessageAction,
    ServerStatusAction
} from "@eclipse-glsp/client";
import { MessageService } from "@theia/core";
import { ConfirmDialog, WidgetManager } from "@theia/core/lib/browser";
import { Message, MessageType } from "@theia/core/lib/common";
import { EditorManager } from "@theia/editor/lib/browser";
import { DiagramManager, DiagramWidget, TheiaDiagramServer, TheiaFileSaver, TheiaSprottyConnector } from "sprotty-theia";

import { GLSPDiagramClient } from "./glsp-diagram-client";
import { GLSPMessageOptions, GLSPNotificationManager } from "./glsp-notification-manager";

export interface GLSPTheiaSprottyConnectorServices {
    readonly diagramClient: GLSPDiagramClient,
    readonly fileSaver: TheiaFileSaver,
    readonly editorManager: EditorManager,
    readonly widgetManager: WidgetManager,
    readonly diagramManager: DiagramManager,
    readonly messageService: MessageService,
    readonly notificationManager: GLSPNotificationManager
}

const SHOW_DETAILS_LABEL = 'Show details';

export class GLSPTheiaSprottyConnector implements TheiaSprottyConnector, GLSPTheiaSprottyConnectorServices {
    private servers: Map<String, TheiaDiagramServer> = new Map;
    private widgetMessages: Map<string, string[]> = new Map;
    private widgetStatusTimeouts: Map<string, number> = new Map;

    readonly diagramClient: GLSPDiagramClient;
    readonly fileSaver: TheiaFileSaver;
    readonly editorManager: EditorManager;
    readonly widgetManager: WidgetManager;
    readonly diagramManager: DiagramManager;
    readonly messageService: MessageService;
    readonly notificationManager: GLSPNotificationManager;

    constructor(services: GLSPTheiaSprottyConnectorServices) {
        Object.assign(this, services);
        this.diagramClient.connect(this);
    }

    connect(diagramServer: TheiaDiagramServer) {
        this.servers.set(diagramServer.clientId, diagramServer);
        diagramServer.connect(this);
    }

    disconnect(diagramServer: TheiaDiagramServer) {
        this.servers.delete(diagramServer.clientId);
        diagramServer.disconnect();
        this.diagramClient.didClose(diagramServer.clientId);
    }

    save(uri: string, action: ExportSvgAction): void {
        this.fileSaver.save(uri, action);
    }

    // Status

    showStatus(widgetId: string, action: ServerStatusAction): void {
        if (this.isClear(action.severity)) {
            this.clearWidgetStatus(widgetId);
        } else {
            this.showWidgetStatus(widgetId, action);
        }
    }

    clearWidgetStatus(widgetId: string) {
        // any status but FATAL, ERROR, WARNING or INFO will lead to a clear of the status
        this.showWidgetStatus(widgetId, { kind: ServerStatusAction.KIND, message: '', severity: 'CLEAR' });
    }

    showWidgetStatus(widgetId: string, status: ServerStatusAction): void {
        // remove any pending timeout
        const pendingTimeout = this.widgetStatusTimeouts.get(widgetId);
        if (pendingTimeout) {
            window.clearTimeout(pendingTimeout);
            this.widgetStatusTimeouts.delete(widgetId);
        }

        // update status
        const widget = this.widgetManager.getWidgets(this.diagramManager.id).find(w => w.id === widgetId);
        if (widget instanceof DiagramWidget) {
            widget.setStatus(status);
        }

        // check for any timeouts
        const statusTimeout = isGLSPServerStatusAction(status) ? status.timeout : -1;
        if (statusTimeout > 0) {
            const newTimeout = window.setTimeout(() => this.clearWidgetStatus(widgetId), statusTimeout);
            this.widgetStatusTimeouts.set(widgetId, newTimeout);
        }
    }

    // Message

    showMessage(widgetId: string, action: ServerMessageAction): void {
        if (this.isClear(action.severity)) {
            this.clearServerMessages(widgetId);
        } else {
            this.showServerMessage(widgetId, action);
        }
    }

    clearServerMessages(widgetId: string) {
        const widgetMessages = Array.from(this.widgetMessages.get(widgetId) || []);
        widgetMessages.forEach(messageId => this.clearServerMessage(widgetId, messageId));
    }

    clearServerMessage(widgetId: string, messageId: string) {
        remove(this.widgetMessages.get(widgetId) || [], messageId);
        this.notificationManager.clear(messageId);
    }

    showServerMessage(widgetId: string, action: ServerMessageAction) {
        const widget = this.widgetManager.getWidgets(this.diagramManager.id).find(w => w.id === widgetId);
        const uri = widget instanceof DiagramWidget ? widget.uri.toString() : '';

        const type = this.toMessageType(action.severity);
        const text = action.message;
        const details = action.details;
        const timeout = action.timeout;
        const options = { timeout, uri } as GLSPMessageOptions;
        const actions = details ? [SHOW_DETAILS_LABEL] : [];
        const message: Message = { type, text, actions, options };
        const messageId = this.createMessageId(message);

        const clearMessageOnClose: (value?: string) => void = result => this.clearServerMessage(widgetId, messageId);

        const onClose: (value?: string) => void = details
            ? result => this.showDetailsOrClearMessage(result, text, details, clearMessageOnClose)
            : clearMessageOnClose;
        switch (message.type) {
            case MessageType.Error:
                this.addServerMessage(widgetId, messageId);
                this.messageService.error(message.text, message.options, ...message.actions).then(onClose);
                break;
            case MessageType.Warning:
                this.addServerMessage(widgetId, messageId);
                this.messageService.warn(message.text, message.options, ...message.actions).then(onClose);
                break;
            case MessageType.Info:
                this.addServerMessage(widgetId, messageId);
                this.messageService.info(message.text, message.options, ...message.actions).then(onClose);
                break;
        }
    }

    addServerMessage(widgetId: string, messageId: string) {
        const widgetMessages = this.widgetMessages.get(widgetId) || [];
        widgetMessages.push(messageId);
        this.widgetMessages.set(widgetId, widgetMessages);
    }

    protected showDetailsOrClearMessage(result: string | undefined, text: string, details: string, onClose: (value?: string) => void) {
        if (result === SHOW_DETAILS_LABEL) {
            showDialog(text, details).then(() => onClose());
        } else {
            onClose();
        }
    }

    toMessageType(severity: string) {
        switch (severity) {
            case 'ERROR':
                return MessageType.Error;
            case 'WARNING':
                return MessageType.Warning;
            case 'INFO':
                return MessageType.Info;
        }
        return MessageType.Log;
    }

    isClear(severity: string) {
        return severity === 'NONE';
    }

    createMessageId(message: Message) {
        return this.notificationManager.getMessageId(message);
    }

    sendMessage(message: ActionMessage) {
        this.diagramClient.sendThroughLsp(message);
    }

    getGLSPClient(): Promise<GLSPClient> {
        return this.diagramClient.glspClient;
    }

    onMessageReceived(message: ActionMessage): void {
        const diagramServer = this.servers.get(message.clientId);
        if (diagramServer) {
            diagramServer.messageReceived(message);
        }
    }
}

export function showDialog(title: string, msg: string) {
    const wrappedMsg = wrapMessage(msg);
    return new ConfirmDialog({ title, msg: wrappedMsg }).open();
}

/**
 * Wraps the given message in a pre-formatted,
 * scrollable div.
 * @param msg
 */
function wrapMessage(msg: string) {
    const scrollDiv = document.createElement('div');
    scrollDiv.className = 'scroll-div';
    const pre = document.createElement('pre');
    pre.textContent = msg;
    scrollDiv.appendChild(pre);
    return scrollDiv;
}
