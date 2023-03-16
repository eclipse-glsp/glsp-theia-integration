/********************************************************************************
 * Copyright (c) 2018-2023 TypeFox and others.
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
// based on: https://github.com/eclipse-sprotty/sprotty-theia/blob/v0.12.0/src/theia/diagram-manager.ts

import { codiconCSSString, configureServerActions, EditMode } from '@eclipse-glsp/client';
import {
    ApplicationShell,
    FrontendApplicationContribution,
    OpenHandler,
    StorageService,
    WidgetFactory,
    WidgetOpenerOptions,
    WidgetOpenHandler
} from '@theia/core/lib/browser';
import { SelectionService } from '@theia/core/lib/common/selection-service';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, interfaces, postConstruct } from '@theia/core/shared/inversify';
import { EditorManager, EditorPreferences } from '@theia/editor/lib/browser';
import { TheiaOpenerOptionsNavigationService } from '../theia-opener-options-navigation-service';
import { DiagramConfiguration, DiagramConfigurationRegistry } from './glsp-diagram-configuration';
import { GLSPDiagramContextKeyService } from './glsp-diagram-context-key-service';
import { GLSPDiagramWidget, GLSPDiagramWidgetOptions } from './glsp-diagram-widget';
import { TheiaGLSPConnector } from './theia-glsp-connector';

export function registerDiagramManager(
    bind: interfaces.Bind,
    diagramManagerServiceId: interfaces.ServiceIdentifier<GLSPDiagramManager>,
    bindToSelf = true
): void {
    if (bindToSelf) {
        bind(diagramManagerServiceId).toSelf().inSingletonScope();
    }
    bind(FrontendApplicationContribution).toService(diagramManagerServiceId);
    bind(OpenHandler).toService(diagramManagerServiceId);
    bind(WidgetFactory).toService(diagramManagerServiceId);
}

export const TheiaGLSPConnectorProvider = Symbol('TheiaGLSPConnectorProvider');

export type TheiaGLSPConnectorProvider = (diagramType: string) => Promise<TheiaGLSPConnector>;

@injectable()
export abstract class GLSPDiagramManager extends WidgetOpenHandler<GLSPDiagramWidget> implements WidgetFactory {
    @inject(EditorPreferences)
    protected readonly editorPreferences: EditorPreferences;

    @inject(StorageService)
    protected readonly storage: StorageService;

    @inject(TheiaOpenerOptionsNavigationService)
    protected readonly diagramNavigationService: TheiaOpenerOptionsNavigationService;

    @inject(GLSPDiagramContextKeyService)
    protected readonly contextKeyService: GLSPDiagramContextKeyService;

    @inject(ApplicationShell)
    protected override readonly shell: ApplicationShell;

    @inject(SelectionService)
    theiaSelectionService: SelectionService;

    @inject(TheiaGLSPConnectorProvider)
    protected readonly connectorProvider: TheiaGLSPConnectorProvider;

    @inject(EditorManager)
    protected readonly editorManager: EditorManager;

    @inject(DiagramConfigurationRegistry)
    diagramConfigurationRegistry: DiagramConfigurationRegistry;

    abstract get fileExtensions(): string[];

    abstract get diagramType(): string;

    protected _diagramConnector: TheiaGLSPConnector;

    protected widgetCount = 0;

    @postConstruct()
    protected async initialize(): Promise<void> {
        this._diagramConnector = await this.connectorProvider(this.diagramType);
        if (!this._diagramConnector) {
            throw new Error(`No diagram connector is registered for diagramType: ${this.diagramType}!`);
        }
    }

    override async doOpen(widget: GLSPDiagramWidget, maybeOptions?: WidgetOpenerOptions): Promise<void> {
        const widgetWasAttached = widget.isAttached;
        const options: WidgetOpenerOptions = {
            mode: 'activate',
            ...maybeOptions
        };
        if (!widget.isAttached) {
            this.attachWidget(widget, options);
        }
        if (options.mode === 'activate') {
            await widget.getSvgElement();
            await this.shell.activateWidget(widget.widgetId);
        } else if (options.mode === 'reveal') {
            await this.shell.revealWidget(widget.widgetId);
        }
        if (this.handleNavigations(widget, options)) {
            return;
        }
        if (!widgetWasAttached && widget instanceof GLSPDiagramWidget) {
            widget.restoreViewportDataFromStorageService();
        }
    }

    protected attachWidget(widget: GLSPDiagramWidget, options?: WidgetOpenerOptions): void {
        const currentEditor = this.editorManager.currentEditor;
        const widgetOptions: ApplicationShell.WidgetOptions = {
            area: 'main',
            ...(options && options.widgetOptions ? options.widgetOptions : {})
        };
        if (!!currentEditor && currentEditor.editor.uri.toString(true) === widget.uri.toString(true)) {
            widgetOptions.ref = currentEditor;
            widgetOptions.mode =
                options && options.widgetOptions && options.widgetOptions.mode ? options.widgetOptions.mode : 'open-to-right';
        }
        this.shell.addWidget(widget, widgetOptions);
    }

    protected handleNavigations(widget: GLSPDiagramWidget, options?: WidgetOpenerOptions): boolean {
        const navigations = this.diagramNavigationService.determineNavigations(widget.uri.toString(true), options);
        if (navigations.length > 0) {
            widget.actionDispatcher.onceModelInitialized().then(() => widget.actionDispatcher.dispatchAll(navigations));
            return true;
        }
        return false;
    }

    async createWidget(options?: any): Promise<GLSPDiagramWidget> {
        if (GLSPDiagramWidgetOptions.is(options)) {
            const clientId = this.createClientId();
            const widgetId = this.createWidgetId(options);
            const config = this.getDiagramConfiguration(options);
            const diContainer = config.createContainer(clientId);

            // do not await the result here as it blocks the Theia layout restoration for open widgets
            // instead simply check in the widget if we are already initialized
            this.diagramConnector.initializeResult.then(initializeResult =>
                configureServerActions(initializeResult, this.diagramType, diContainer)
            );

            const widget = new GLSPDiagramWidget(
                options,
                widgetId,
                diContainer,
                this.editorPreferences,
                this.storage,
                this.theiaSelectionService,
                this.diagramConnector
            );
            widget.listenToFocusState(this.shell);
            return widget;
        }
        throw Error('DiagramWidgetFactory needs DiagramWidgetOptions but got ' + JSON.stringify(options));
    }

    protected createClientId(): string {
        return this.diagramType + '_' + this.widgetCount++;
    }

    protected override createWidgetOptions(uri: URI, options?: GLSPWidgetOpenerOptions): GLSPDiagramWidgetOptions {
        return {
            diagramType: this.diagramType,
            kind: 'navigatable',
            uri: uri.toString(true),
            iconClass: this.iconClass,
            label: uri.path.base,
            editMode: options && options.editMode ? options.editMode : EditMode.EDITABLE
        };
    }

    protected createWidgetId(options: GLSPDiagramWidgetOptions): string {
        return `${this.diagramType}:${options.uri}`;
    }

    protected getDiagramConfiguration(options: GLSPDiagramWidgetOptions): DiagramConfiguration {
        return this.diagramConfigurationRegistry.get(options.diagramType);
    }

    canHandle(uri: URI, _options?: WidgetOpenerOptions | undefined): number {
        for (const extension of this.fileExtensions) {
            if (uri.path.toString().endsWith(extension)) {
                return 1001;
            }
        }
        return 0;
    }

    get diagramConnector(): TheiaGLSPConnector {
        return this._diagramConnector;
    }

    override get id(): string {
        return deriveDiagramManagerId(this.diagramType);
    }

    get iconClass(): string {
        return codiconCSSString('type-hierarchy-sub');
    }
}

export interface GLSPWidgetOpenerOptions extends WidgetOpenerOptions {
    editMode?: string;
}

export function deriveDiagramManagerId(diagramType: string): string {
    return diagramType + '-diagram-manager';
}
