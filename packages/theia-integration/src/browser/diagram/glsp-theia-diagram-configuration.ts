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
import {
    CommandPalette,
    configureActionHandler,
    ExternalModelSourceChangedHandler,
    NavigateToExternalTargetAction,
    TYPES
} from "@eclipse-glsp/client";
import { CommandService, SelectionService } from "@theia/core";
import { OpenerService } from "@theia/core/lib/browser";
import { Container, inject, injectable } from "inversify";
import {
    DiagramConfiguration,
    TheiaContextMenuService,
    TheiaDiagramServer,
    TheiaSprottySelectionForwarder
} from "sprotty-theia";

import { TheiaCommandPalette } from "../theia-command-palette";
import { TheiaModelSourceChangedHandler } from "../theia-model-source-changed-handler";
import { TheiaNavigateToExternalTargetHandler } from "../theia-navigate-to-external-target-handler";
import { connectTheiaContextMenuService, TheiaContextMenuServiceFactory } from "./glsp-theia-context-menu-service";
import { connectTheiaMarkerManager, TheiaMarkerManager, TheiaMarkerManagerFactory } from "./glsp-theia-marker-manager";

@injectable()
export abstract class GLSPTheiaDiagramConfiguration implements DiagramConfiguration {
    @inject(SelectionService) protected selectionService: SelectionService;
    @inject(OpenerService) protected openerService: OpenerService;
    @inject(CommandService) protected readonly commandService: CommandService;
    @inject(TheiaModelSourceChangedHandler) protected modelSourceChangedHandler: TheiaModelSourceChangedHandler;
    @inject(TheiaContextMenuServiceFactory) protected readonly contextMenuServiceFactory: () => TheiaContextMenuService;
    @inject(TheiaMarkerManagerFactory) protected readonly theiaMarkerManager: () => TheiaMarkerManager;

    abstract readonly diagramType: string;

    createContainer(widgetId: string): Container {
        const container = this.doCreateContainer(widgetId);
        this.initializeContainer(container);
        return container;
    }

    abstract doCreateContainer(widgetId: string): Container;

    protected initializeContainer(container: Container): void {
        container.bind(TYPES.IActionHandlerInitializer).to(TheiaSprottySelectionForwarder);
        container.bind(SelectionService).toConstantValue(this.selectionService);
        container.bind(OpenerService).toConstantValue(this.openerService);
        container.bind(CommandService).toConstantValue(this.commandService);
        container.bind(ExternalModelSourceChangedHandler).toConstantValue(this.modelSourceChangedHandler);
        if (container.isBound(CommandPalette)) {
            container.rebind(CommandPalette).to(TheiaCommandPalette);
        }

        connectTheiaContextMenuService(container, this.contextMenuServiceFactory);
        connectTheiaMarkerManager(container, this.theiaMarkerManager, this.diagramType);
        configureActionHandler(container, NavigateToExternalTargetAction.KIND, TheiaNavigateToExternalTargetHandler);
    }

    protected configureDiagramServer<T>(container: Container, server: { new(...args: any[]): T }): void {
        container.bind(TYPES.ModelSource).to(server).inSingletonScope();
        container.bind(TheiaDiagramServer).toService(server);
    }
}
