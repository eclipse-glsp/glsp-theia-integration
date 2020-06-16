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
import { GLSPActionDispatcher } from "@eclipse-glsp/client";
import {
    FrontendApplicationContribution,
    NavigatableWidgetOptions,
    OpenHandler,
    WidgetFactory,
    WidgetOpenerOptions
} from "@theia/core/lib/browser";
import URI from "@theia/core/lib/common/uri";
import { EditorPreferences } from "@theia/editor/lib/browser";
import { inject, injectable, interfaces } from "inversify";
import { DiagramManager, DiagramManagerProvider, DiagramWidget, DiagramWidgetOptions } from "sprotty-theia";

import { TheiaOpenerOptionsNavigationService } from "../theia-opener-options-navigation-service";
import { GLSPDiagramWidget } from "./glsp-diagram-widget";
import { GLSPTheiaSprottyConnector } from "./glsp-theia-sprotty-connector";

export function registerDiagramManager(bind: interfaces.Bind, diagramManagerServiceId: interfaces.ServiceIdentifier<DiagramManager>) {
    bind(diagramManagerServiceId).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(diagramManagerServiceId);
    bind(OpenHandler).toService(diagramManagerServiceId);
    bind(WidgetFactory).toService(diagramManagerServiceId);
    bind(DiagramManagerProvider).toProvider<DiagramManager>((context) => {
        return () => new Promise<DiagramManager>((resolve) => {
            resolve(context.container.get(diagramManagerServiceId));
        });
    });
}

@injectable()
export abstract class GLSPDiagramManager extends DiagramManager {

    @inject(EditorPreferences)
    protected readonly editorPreferences: EditorPreferences;

    @inject(TheiaOpenerOptionsNavigationService)
    protected readonly diagramNavigationService: TheiaOpenerOptionsNavigationService;

    abstract get fileExtensions(): string[];

    async doOpen(widget: DiagramWidget, options?: WidgetOpenerOptions) {
        await super.doOpen(widget);
        const navigations = this.diagramNavigationService.determineNavigations(widget.uri.toString(true), options);
        if (navigations.length > 0) {
            if (widget.actionDispatcher instanceof GLSPActionDispatcher) {
                widget.actionDispatcher.onceModelInitialized().then(() => widget.actionDispatcher.dispatchAll(navigations));
            } else {
                widget.actionDispatcher.dispatchAll(navigations);
            }
        }
    }

    async createWidget(options?: any): Promise<DiagramWidget> {
        if (DiagramWidgetOptions.is(options)) {
            const clientId = this.createClientId();
            const widgetId = this.id + ':' + options.uri;
            const config = this.diagramConfigurationRegistry.get(options.diagramType);
            const diContainer = config.createContainer(clientId);
            return new GLSPDiagramWidget(options, widgetId, diContainer, this.editorPreferences, this.diagramConnector);
        }
        throw Error('DiagramWidgetFactory needs DiagramWidgetOptions but got ' + JSON.stringify(options));
    }

    protected createWidgetOptions(uri: URI, options?: WidgetOpenerOptions): DiagramWidgetOptions & NavigatableWidgetOptions {
        return {
            diagramType: this.diagramType,
            kind: 'navigatable',
            uri: uri.toString(true),
            iconClass: this.iconClass,
            label: uri.path.base
        };
    }

    canHandle(uri: URI, options?: WidgetOpenerOptions | undefined): number {
        for (const extension of this.fileExtensions) {
            if (uri.path.toString().endsWith(extension)) {
                return 1001;
            }
        }
        return 0;
    }

    get diagramConnector(): GLSPTheiaSprottyConnector | undefined {
        return undefined;
    }
}
