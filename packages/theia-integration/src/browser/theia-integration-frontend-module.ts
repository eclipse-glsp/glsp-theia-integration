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
import { bindAsService } from '@eclipse-glsp/client';
import { CommandContribution, MenuContribution, bindContributionProvider } from '@theia/core';
import {
    FrontendApplicationContribution,
    KeybindingContext,
    KeybindingContribution,
    WebSocketConnectionProvider
} from '@theia/core/lib/browser';
import { ContainerModule } from '@theia/core/shared/inversify';
import { GLSPContribution } from '../common';
import { DiagramServiceProvider } from './diagram-service-provider';
import { DiagramWidgetFactory } from './diagram/diagram-widget-factory';
import { GLSPDiagramCommandContribution, GLSPDiagramMenuContribution } from './diagram/glsp-diagram-commands';
import { DiagramConfiguration, DiagramContainerFactory } from './diagram/glsp-diagram-configuration';
import { GLSPDiagramContextKeyService } from './diagram/glsp-diagram-context-key-service';
import { GLSPDiagramKeybindingContext, GLSPDiagramKeybindingContribution } from './diagram/glsp-diagram-keybinding';
import { TheiaContextMenuServiceFactory } from './diagram/theia-context-menu-service';
import { TheiaMarkerManager, TheiaMarkerManagerFactory } from './diagram/theia-marker-manager';
import { GLSPClientContribution } from './glsp-client-contribution';
import { GLSPFrontendContribution } from './glsp-frontend-contribution';
import { TheiaContextMenuService } from './theia-glsp-context-menu-service';
import { TheiaOpenerOptionsNavigationService } from './theia-opener-options-navigation-service';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };
    // GLSP Contribution API
    bindContributionProvider(bind, GLSPClientContribution);
    bindAsService(context, FrontendApplicationContribution, GLSPFrontendContribution);
    bind(DiagramServiceProvider).toSelf().inSingletonScope();
    bind(GLSPContribution.Service)
        .toDynamicValue(({ container }) => WebSocketConnectionProvider.createProxy(container, GLSPContribution.servicePath))
        .inSingletonScope();

    // Diagram Command API
    bindAsService(context, CommandContribution, GLSPDiagramCommandContribution);
    bindAsService(context, MenuContribution, GLSPDiagramMenuContribution);
    bindAsService(context, KeybindingContext, GLSPDiagramKeybindingContext);
    bindAsService(context, KeybindingContribution, GLSPDiagramKeybindingContribution);

    // Misc
    bindContributionProvider(bind, DiagramWidgetFactory);
    bindContributionProvider(bind, DiagramConfiguration);
    bind(DiagramContainerFactory).toFactory(ctx => () => ctx.container.createChild());

    bind(GLSPDiagramContextKeyService).toSelf().inSingletonScope();

    bind(TheiaOpenerOptionsNavigationService).toSelf().inSingletonScope();
    bind(TheiaContextMenuServiceFactory).toFactory(ctx => () => {
        const container = ctx.container.createChild();
        container.bind(TheiaContextMenuService).toSelf().inSingletonScope();
        return container.get(TheiaContextMenuService);
    });

    bind(TheiaMarkerManagerFactory).toFactory(ctx => () => {
        const container = ctx.container.createChild();
        container.bind(TheiaMarkerManager).toSelf().inSingletonScope();
        return container.get(TheiaMarkerManager);
    });
});
