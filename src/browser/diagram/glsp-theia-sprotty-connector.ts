/********************************************************************************
 * Copyright (c) 2019 EclipseSource and others.
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
import { ActionMessage, ExportSvgAction, isGLSPServerStatusAction, ServerStatusAction } from "@eclipse-glsp/client";
import { MessageService } from "@theia/core";
import { ConfirmDialog, WidgetManager } from "@theia/core/lib/browser";
import { EditorManager } from "@theia/editor/lib/browser";
import { DiagramManager, DiagramWidget, TheiaDiagramServer, TheiaFileSaver, TheiaSprottyConnector } from "sprotty-theia";

import { GLSPClient } from "../language/glsp-client-services";
import { GLSPDiagramClient } from "./glsp-diagram-client";

export interface GLSPTheiaSprottyConnectorServices {
    readonly diagramClient: GLSPDiagramClient,
    readonly fileSaver: TheiaFileSaver,
    readonly editorManager: EditorManager,
    readonly widgetManager: WidgetManager,
    readonly diagramManager: DiagramManager,
    readonly messageService: MessageService
}

const SHOW_DETAILS_LABEL = 'Show details';

export class GLSPTheiaSprottyConnector implements TheiaSprottyConnector, GLSPTheiaSprottyConnectorServices {
    private servers: Map<String, TheiaDiagramServer> = new Map;

    readonly diagramClient: GLSPDiagramClient;
    readonly fileSaver: TheiaFileSaver;
    readonly editorManager: EditorManager;
    readonly widgetManager: WidgetManager;
    readonly diagramManager: DiagramManager;
    readonly messageService: MessageService;

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

    showStatus(widgetId: string, status: ServerStatusAction): void {
        const widget = this.widgetManager.getWidgets(this.diagramManager.id).find(w => w.id === widgetId);
        if (widget instanceof DiagramWidget) {
            widget.setStatus(status);
        }

        if (status.severity !== "NONE") {
            const { details, timeout } = isGLSPServerStatusAction(status) ? status : { details: undefined, timeout: -1 };
            if (details) {
                switch (status.severity) {
                    case 'ERROR':
                        this.messageService.error(status.message, SHOW_DETAILS_LABEL)
                            .then(result => this.showDetailsOrClearStatus(result, status, details, widgetId));
                        break;
                    case 'WARNING':
                        this.messageService.warn(status.message, SHOW_DETAILS_LABEL)
                            .then(result => this.showDetailsOrClearStatus(result, status, details, widgetId));
                        break;
                    case 'INFO':
                        this.messageService.info(status.message, SHOW_DETAILS_LABEL)
                            .then(result => this.showDetailsOrClearStatus(result, status, details, widgetId));
                        break;
                }
            } else {
                switch (status.severity) {
                    case 'ERROR':
                        this.messageService.error(status.message, { timeout });
                        break;
                    case 'WARNING':
                        this.messageService.warn(status.message, { timeout });
                        break;
                    case 'INFO':
                        this.messageService.info(status.message, { timeout });
                        break;
                }
            }

            if (timeout && timeout >= 0) {
                window.setTimeout(() => this.clearStatus(widgetId), timeout);
            }
        }
    }

    protected showDetailsOrClearStatus(result: string | undefined, status: ServerStatusAction, details: string, widgetId: string) {
        if (result === SHOW_DETAILS_LABEL) {
            showDialog(status.message, details).then(() => this.clearStatus(widgetId));
        } else {
            this.clearStatus(widgetId);
        }
    }

    clearStatus(widgetId: string) {
        this.showStatus(widgetId, { kind: ServerStatusAction.KIND, message: '', severity: 'NONE' });
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
    return new ConfirmDialog({ title, msg }).open();
}
