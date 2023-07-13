/********************************************************************************
 * Copyright (c) 2019-2023 EclipseSource and others.
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
    Args,
    EndProgressAction,
    ExportSvgAction,
    GLSPClient,
    InitializeResult,
    ServerMessageAction,
    ServerStatusAction,
    StartProgressAction,
    UpdateProgressAction,
    remove
} from '@eclipse-glsp/client';
import { Message, MessageService, MessageType, Progress } from '@theia/core';
import { ConfirmDialog, WidgetManager } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { EditorManager } from '@theia/editor/lib/browser';
import { FileDialogService } from '@theia/filesystem/lib/browser/file-dialog/file-dialog-service';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { GLSPClientContribution } from '../glsp-client-contribution';
import { GLSPClientProvider } from '../glsp-client-provider';
import { deriveDiagramManagerId } from './glsp-diagram-manager';
import { GLSPDiagramWidget } from './glsp-diagram-widget';
import { GLSPMessageOptions, GLSPNotificationManager } from './glsp-notification-manager';
import { GLSPTheiaDiagramServer } from './glsp-theia-diagram-server';
import { TheiaGLSPConnector } from './theia-glsp-connector';

const SHOW_DETAILS_LABEL = 'Show details';

@injectable()
export abstract class BaseTheiaGLSPConnector implements TheiaGLSPConnector {
    @inject(FileDialogService)
    protected readonly fileDialogService: FileDialogService;

    @inject(FileService)
    protected readonly fileService: FileService;

    @inject(EditorManager)
    protected readonly editorManager: EditorManager;

    @inject(WidgetManager)
    protected readonly widgetManager: WidgetManager;

    @inject(MessageService)
    protected readonly messageService: MessageService;

    @inject(GLSPNotificationManager)
    protected readonly notificationManager: GLSPNotificationManager;

    @inject(GLSPClientProvider)
    protected readonly glspClientProvider: GLSPClientProvider;

    protected servers: Map<string, GLSPTheiaDiagramServer> = new Map();
    protected widgetMessages: Map<string, string[]> = new Map();
    protected widgetStatusTimeouts: Map<string, number> = new Map();

    protected progressReporters: Map<string, Progress> = new Map();

    abstract readonly diagramType: string;
    abstract readonly contributionId: string;

    protected glspClientContribution: GLSPClientContribution;

    @postConstruct()
    protected initialize(): void {
        const clientContribution = this.glspClientProvider.getGLSPClientContribution(this.contributionId);
        if (!clientContribution) {
            throw new Error(`No GLSPClientContribution is configured for the id '${this.contributionId}'`);
        }
        this.glspClientContribution = clientContribution;
    }

    connect(diagramServer: GLSPTheiaDiagramServer): void {
        this.servers.set(diagramServer.clientId, diagramServer);

        this.glspClient.then(client => {
            client.onActionMessage(message => this.onMessageReceived(message));
            client.initializeClientSession({
                clientSessionId: diagramServer.clientId,
                diagramType: this.diagramType,
                args: this.initializeClientSessionArgs(diagramServer)
            });
        });
        diagramServer.connect(this);
    }

    initializeClientSessionArgs(_diagramServer: GLSPTheiaDiagramServer): Args | undefined {
        return undefined;
    }

    disconnect(diagramServer: GLSPTheiaDiagramServer): void {
        this.servers.delete(diagramServer.clientId);
        this.glspClient.then(client =>
            client.disposeClientSession({
                clientSessionId: diagramServer.clientId,
                args: this.disposeClientSessionArgs(diagramServer)
            })
        );
        diagramServer.disconnect();
    }

    disposeClientSessionArgs(_diagramServer: GLSPTheiaDiagramServer): Args | undefined {
        return undefined;
    }

    async save(uri: string, action: ExportSvgAction): Promise<void> {
        const folder = await this.fileService.resolve(new URI(uri));
        let file = await this.fileDialogService.showSaveDialog({ title: 'Export Diagram', filters: { 'Images (*.svg)': ['svg'] } }, folder);
        if (file) {
            try {
                if (!file.path.ext) {
                    file = new URI(file.path.fsPath() + '.svg');
                }
                await this.fileService.write(file, action.svg);
                this.messageService.info(`Diagram exported to '${file.path.name}'`);
            } catch (error) {
                this.messageService.info(`Error exporting diagram '${error}'`);
            }
        }
    }

    // Status

    showStatus(widgetId: string, action: ServerStatusAction): void {
        if (this.isClear(action.severity)) {
            this.clearWidgetStatus(widgetId);
        } else {
            this.showWidgetStatus(widgetId, action);
        }
    }

    protected clearWidgetStatus(widgetId: string): void {
        // any status but FATAL, ERROR, WARNING or INFO will lead to a clear of the status
        this.showWidgetStatus(widgetId, ServerStatusAction.create('', { severity: 'NONE' }));
    }

    protected showWidgetStatus(widgetId: string, status: ServerStatusAction): void {
        // remove any pending timeout
        const pendingTimeout = this.widgetStatusTimeouts.get(widgetId);
        if (pendingTimeout) {
            window.clearTimeout(pendingTimeout);
            this.widgetStatusTimeouts.delete(widgetId);
        }

        // update status
        const widget = this.widgetManager.getWidgets(this.diagramManagerId).find(w => w.id === widgetId);
        if (widget instanceof GLSPDiagramWidget) {
            widget.setStatus(status);
        }

        // check for any timeouts
        const statusTimeout = status.timeout ?? -1;
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

    protected clearServerMessages(widgetId: string): void {
        const widgetMessages = Array.from(this.widgetMessages.get(widgetId) || []);
        widgetMessages.forEach(messageId => this.clearServerMessage(widgetId, messageId));
    }

    protected clearServerMessage(widgetId: string, messageId: string): void {
        remove(this.widgetMessages.get(widgetId) || [], messageId);
        this.notificationManager.clear(messageId);
    }

    protected showServerMessage(widgetId: string, action: ServerMessageAction): void {
        const widget = this.widgetManager.getWidgets(this.diagramManagerId).find(w => w.id === widgetId);
        const uri = widget instanceof GLSPDiagramWidget ? widget.uri.toString() : '';

        const type = this.toMessageType(action.severity);
        const text = action.message;
        const details = action.details;
        const options = { uri } as GLSPMessageOptions;
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
                this.messageService.error(message.text, message.options, ...(message.actions ? message.actions : [])).then(onClose);
                break;
            case MessageType.Warning:
                this.addServerMessage(widgetId, messageId);
                this.messageService.warn(message.text, message.options, ...(message.actions ? message.actions : [])).then(onClose);
                break;
            case MessageType.Info:
                this.addServerMessage(widgetId, messageId);
                this.messageService.info(message.text, message.options, ...(message.actions ? message.actions : [])).then(onClose);
                break;
        }
    }

    protected addServerMessage(widgetId: string, messageId: string): void {
        const widgetMessages = this.widgetMessages.get(widgetId) || [];
        widgetMessages.push(messageId);
        this.widgetMessages.set(widgetId, widgetMessages);
    }

    protected showDetailsOrClearMessage(
        result: string | undefined,
        text: string,
        details: string,
        onClose: (value?: string) => void
    ): void {
        if (result === SHOW_DETAILS_LABEL) {
            showDialog(text, details).then(() => onClose());
        } else {
            onClose();
        }
    }

    protected toMessageType(severity: string): MessageType.Error | MessageType.Warning | MessageType.Info | MessageType.Log {
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

    protected isClear(severity: string): boolean {
        return severity === 'NONE';
    }

    createMessageId(message: Message): string {
        return this.notificationManager.getMessageId(message);
    }

    // Progress reporting

    startProgress(widgetId: string, action: StartProgressAction): void {
        const { progressId, title, message, percentage } = action;
        const reporterId = this.progressReporterId(widgetId, progressId);
        this.messageService
            .showProgress({ text: title }) //
            .then(progress => {
                this.progressReporters.set(reporterId, progress);
                progress.report({ message, work: percentage ? { done: percentage, total: 100 } : undefined });
            });
    }

    updateProgress(widgetId: string, action: UpdateProgressAction): void {
        const { progressId, message, percentage } = action;
        const reporterId = this.progressReporterId(widgetId, progressId);
        const progress = this.progressReporters.get(reporterId);
        if (!progress) {
            return;
        }
        progress.report({ message, work: percentage ? { done: percentage, total: 100 } : undefined });
    }

    endProgress(widgetId: string, action: EndProgressAction): void {
        const reporterId = this.progressReporterId(widgetId, action.progressId);
        const progress = this.progressReporters.get(reporterId);
        if (!progress) {
            return;
        }
        this.progressReporters.delete(reporterId);
        progress.cancel();
    }

    protected progressReporterId(widgetId: string, progressId: string): string {
        return `${widgetId}_${progressId}`;
    }

    sendMessage(message: ActionMessage): void {
        this.glspClient.then(client => client.sendActionMessage(message));
    }

    get glspClient(): Promise<GLSPClient> {
        return this.glspClientContribution.glspClient;
    }

    get initializeResult(): Promise<InitializeResult> {
        return this.glspClientContribution.initializeResult;
    }

    onMessageReceived(message: ActionMessage): void {
        const diagramServer = this.servers.get(message.clientId);
        if (diagramServer) {
            diagramServer.messageReceived(message);
        }
    }

    get diagramManagerId(): string {
        return deriveDiagramManagerId(this.diagramType);
    }
}

export function showDialog(title: string, msg: string): Promise<boolean | undefined> {
    const wrappedMsg = wrapMessage(msg);
    return new ConfirmDialog({ title, msg: wrappedMsg }).open();
}

/**
 * Wraps the given message in a pre-formatted,
 * scrollable div.
 * @param msg
 */
function wrapMessage(msg: string): HTMLDivElement {
    const scrollDiv = document.createElement('div');
    scrollDiv.className = 'scroll-div';
    const pre = document.createElement('pre');
    pre.textContent = msg;
    scrollDiv.appendChild(pre);
    return scrollDiv;
}
