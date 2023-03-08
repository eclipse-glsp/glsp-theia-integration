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
import { bindContributionProvider, CommandContribution, MenuContribution } from '@theia/core';
import {
    FrontendApplicationContribution,
    KeybindingContext,
    KeybindingContribution,
    WebSocketConnectionProvider
} from '@theia/core/lib/browser';
import { ContainerModule, interfaces } from '@theia/core/shared/inversify';
import { NotificationManager } from '@theia/messages/lib/browser/notifications-manager';
import { GLSPContribution } from '../common';
import { DiagramConfigurationRegistry } from './diagram/diagram-configuration';
import { GLSPDiagramCommandContribution, GLSPDiagramMenuContribution } from './diagram/glsp-diagram-commands';
import { GLSPDiagramContextKeyService } from './diagram/glsp-diagram-context-key-service';
import { GLSPDiagramKeybindingContext, GLSPDiagramKeybindingContribution } from './diagram/glsp-diagram-keybinding';
import { TheiaGLSPConnectorProvider } from './diagram/glsp-diagram-manager';
import { GLSPNotificationManager } from './diagram/glsp-notification-manager';
import { TheiaContextMenuServiceFactory } from './diagram/theia-context-menu-service';
import { TheiaGLSPConnector, TheiaGLSPConnectorRegistry } from './diagram/theia-glsp-connector';
import { TheiaMarkerManager, TheiaMarkerManagerFactory } from './diagram/theia-marker-manager';
import { GLSPClientContribution } from './glsp-client-contribution';
import { GLSPClientProvider } from './glsp-client-provider';
import { GLSPFrontendContribution } from './glsp-frontend-contribution';
import { TheiaFileSaver } from './theia-file-saver';
import { TheiaContextMenuService } from './theia-glsp-context-menu-service';
import { TheiaOpenerOptionsNavigationService } from './theia-opener-options-navigation-service';
import { TheiaSourceModelChangedHandler } from './theia-source-model-changed-handler';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(DiagramConfigurationRegistry).toSelf().inSingletonScope();
    bind(TheiaFileSaver).toSelf().inSingletonScope();
    bind(CommandContribution).to(GLSPDiagramCommandContribution).inSingletonScope();
    bind(MenuContribution).to(GLSPDiagramMenuContribution).inSingletonScope();
    bind(GLSPDiagramKeybindingContext).toSelf().inSingletonScope();
    bind(KeybindingContext).toService(GLSPDiagramKeybindingContext);
    bind(GLSPDiagramKeybindingContribution).toSelf().inSingletonScope();
    bind(KeybindingContribution).toService(GLSPDiagramKeybindingContribution);

    bindContributionProvider(bind, GLSPClientContribution);
    bind(GLSPFrontendContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(GLSPFrontendContribution);

    bind(GLSPClientProvider).toSelf().inSingletonScope();

    bind(GLSPContribution.Service)
        .toDynamicValue(({ container }) => WebSocketConnectionProvider.createProxy(container, GLSPContribution.servicePath))
        .inSingletonScope();

    bind(GLSPNotificationManager).toSelf().inSingletonScope();
    if (isBound(NotificationManager)) {
        rebind(NotificationManager).toService(GLSPNotificationManager);
    } else {
        bind(NotificationManager).toService(GLSPNotificationManager);
    }

    bind(GLSPDiagramContextKeyService).toSelf().inSingletonScope();
    bind(TheiaOpenerOptionsNavigationService).toSelf().inSingletonScope();
    bind(TheiaSourceModelChangedHandler).toSelf().inSingletonScope();

    bind(TheiaContextMenuServiceFactory).toFactory(context => () => {
        const container = context.container.createChild();
        container.bind(TheiaContextMenuService).toSelf().inSingletonScope();
        return container.get(TheiaContextMenuService);
    });

    bind(TheiaMarkerManagerFactory).toFactory(context => () => {
        const container = context.container.createChild();
        container.bind(TheiaMarkerManager).toSelf().inSingletonScope();
        return container.get(TheiaMarkerManager);
    });

    bind(TheiaGLSPConnectorProvider).toProvider(theiaGLSPConnectorProviderCreator);
    bind(TheiaGLSPConnectorRegistry).toSelf().inSingletonScope();
});

const theiaGLSPConnectorProviderCreator: interfaces.ProviderCreator<TheiaGLSPConnector> =
    (context: interfaces.Context) => (diagramType: string) =>
        new Promise<TheiaGLSPConnector>(resolve => {
            const registry = context.container.get(TheiaGLSPConnectorRegistry);
            const connector = registry.get(diagramType);
            resolve(connector);
        });
