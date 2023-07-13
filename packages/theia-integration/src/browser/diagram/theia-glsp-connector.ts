/********************************************************************************
 * Copyright (c) 2017-2020 TypeFox and others.
 * Modifications: (c) 2019-2023 EclipseSource and others.
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
// based on: https://github.com/eclipse-sprotty/sprotty-theia/blob/v0.12.0/src/sprotty/theia-sprotty-connector.ts
import {
    ActionMessage,
    EndProgressAction,
    ExportSvgAction,
    InitializeResult,
    InstanceRegistry,
    ServerMessageAction,
    ServerStatusAction,
    StartProgressAction,
    UpdateProgressAction
} from '@eclipse-glsp/client';
import { injectable, multiInject, optional } from '@theia/core/shared/inversify';
import { GLSPTheiaDiagramServer } from './glsp-theia-diagram-server';

export const TheiaGLSPConnector = Symbol('TheiaGLSPConnector');

export interface TheiaGLSPConnector {
    readonly diagramType: string;
    readonly diagramManagerId: string;
    readonly initializeResult: Promise<InitializeResult>;
    showMessage(widgetId: string, action: ServerMessageAction): void;
    connect(diagramServer: GLSPTheiaDiagramServer): void;
    disconnect(diagramServer: GLSPTheiaDiagramServer): void;
    save(uri: string, action: ExportSvgAction): void;
    showStatus(clientId: string, status: ServerStatusAction): void;
    sendMessage(message: ActionMessage): void;
    startProgress(clientId: any, action: StartProgressAction): void;
    updateProgress(clientId: any, action: UpdateProgressAction): void;
    endProgress(clientId: any, action: EndProgressAction): void;
    onMessageReceived(message: ActionMessage): void;
}

@injectable()
export class TheiaGLSPConnectorRegistry extends InstanceRegistry<TheiaGLSPConnector> {
    constructor(@multiInject(TheiaGLSPConnector) @optional() connectors: TheiaGLSPConnector[]) {
        super();
        connectors.forEach(connector => this.register(connector.diagramType, connector));
    }
}
