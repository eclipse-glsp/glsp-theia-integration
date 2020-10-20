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
import { bindContributionProvider } from "@theia/core";
import { FrontendApplicationContribution, WebSocketConnectionProvider } from "@theia/core/lib/browser";
import { NotificationManager } from "@theia/messages/lib/browser/notifications-manager";
import { ContainerModule } from "inversify";
import { TheiaContextMenuService } from "@glsp/sprotty-theia/lib/sprotty/theia-sprotty-context-menu-service";

import { GLSPClientContribution, GLSPClientProvider, GLSPClientProviderImpl } from ".";
import { GLSPContribution } from "../common";
import { GLSPDiagramContextKeyService } from "./diagram/glsp-diagram-context-key-service";
import { GLSPNotificationManager } from "./diagram/glsp-notification-manager";
import { TheiaContextMenuServiceFactory } from "./diagram/glsp-theia-context-menu-service";
import { TheiaMarkerManager, TheiaMarkerManagerFactory } from "./diagram/glsp-theia-marker-manager";
import { GLSPTheiaSprottyConnector } from "./diagram/glsp-theia-sprotty-connector";
import { GLSPFrontendContribution } from "./glsp-frontend-contribution";
import { TheiaNavigateToTargetHandler } from "./theia-navigate-to-target-handler";
import { TheiaOpenerOptionsNavigationService } from "./theia-opener-options-navigation-service";

export default new ContainerModule((bind, unbind, isBound, rebind) => {

    bind(GLSPContribution.Service).toDynamicValue(({ container }) =>
        WebSocketConnectionProvider.createProxy(container, GLSPContribution.servicePath)
    ).inSingletonScope();

    bindContributionProvider(bind, GLSPClientContribution);
    bind(GLSPFrontendContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(GLSPFrontendContribution);

    bind(GLSPClientProviderImpl).toSelf().inSingletonScope();
    bind(GLSPClientProvider).toService(GLSPClientProviderImpl);

    bind(GLSPTheiaSprottyConnector).toSelf().inSingletonScope();

    bind(TheiaContextMenuServiceFactory).toFactory(context => () => {
        const container = context.container.createChild();
        container.bind(TheiaContextMenuService).toSelf().inSingletonScope();
        return container.get(TheiaContextMenuService);
    });

    bind(GLSPNotificationManager).toSelf().inSingletonScope();
    if (isBound(NotificationManager)) {
        rebind(NotificationManager).toService(GLSPNotificationManager);
    } else {
        bind(NotificationManager).toService(GLSPNotificationManager);
    }

    bind(TheiaMarkerManagerFactory).toFactory(context => () => {
        const container = context.container.createChild();
        container.bind(TheiaMarkerManager).toSelf().inSingletonScope();
        return container.get(TheiaMarkerManager);
    });

    bind(GLSPDiagramContextKeyService).toSelf().inSingletonScope();
    bind(TheiaNavigateToTargetHandler).toSelf().inSingletonScope();
    bind(TheiaOpenerOptionsNavigationService).toSelf().inSingletonScope();
});
