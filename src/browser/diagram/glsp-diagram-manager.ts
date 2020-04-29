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
import { CenterAction, GLSPActionDispatcher, SelectAction, SelectAllAction } from "@eclipse-glsp/client";
import { WidgetOpenerOptions } from "@theia/core/lib/browser";
import URI from "@theia/core/lib/common/uri";
import { EditorPreferences } from "@theia/editor/lib/browser";
import { inject, injectable } from "inversify";
import { DiagramManager, DiagramWidget, DiagramWidgetOptions } from "sprotty-theia";

import { GLSPDiagramWidget } from "./glsp-diagram-widget";
import { RangeAwareOptions, RangeOfElements } from "./glsp-theia-marker-manager";
import { GLSPTheiaSprottyConnector } from "./glsp-theia-sprotty-connector";

@injectable()
export abstract class GLSPDiagramManager extends DiagramManager {
    @inject(EditorPreferences)
    protected readonly editorPreferences: EditorPreferences;
    abstract get fileExtensions(): string[];

    async doOpen(widget: DiagramWidget, options?: WidgetOpenerOptions) {
        await super.doOpen(widget);
        if (RangeAwareOptions.is(options) && RangeOfElements.is(options.selection)) {
            const elementIds = options.selection.elementIds;
            if (widget.actionDispatcher instanceof GLSPActionDispatcher) {
                widget.actionDispatcher.onceModelInitialized().then(() => this.selectAndCenter(widget, elementIds));
            } else {
                this.selectAndCenter(widget, elementIds);
            }
        }
    }

    protected selectAndCenter(widget: DiagramWidget, elementIds: string[]) {
        widget.actionDispatcher.dispatchAll([new SelectAllAction(false), new SelectAction(elementIds), new CenterAction(elementIds)]);
    }

    async createWidget(options?: any): Promise<DiagramWidget> {
        if (DiagramWidgetOptions.is(options)) {
            const clientId = this.createClientId();
            const config = this.diagramConfigurationRegistry.get(options.diagramType);
            const diContainer = config.createContainer(clientId);
            return new GLSPDiagramWidget(options, clientId + '_widget', diContainer, this.editorPreferences, this.diagramConnector);
        }
        throw Error('DiagramWidgetFactory needs DiagramWidgetOptions but got ' + JSON.stringify(options));
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
