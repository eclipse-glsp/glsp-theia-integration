/********************************************************************************
 * Copyright (c) 2017-2023 TypeFox and others.
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
// based on: https://github.com/eclipse-sprotty/sprotty-theia/blob/v0.12.0/src/theia/diagram-widget.ts
import {
    AnyObject,
    Args,
    Bounds,
    DiagramServerProxy,
    EditorContextService,
    EnableToolPaletteAction,
    FocusStateChangedAction,
    FocusTracker,
    GLSPActionDispatcher,
    hasStringProp,
    ICopyPasteHandler,
    InitializeCanvasBoundsAction,
    isViewport,
    ModelSource,
    RequestModelAction,
    RequestTypeHintsAction,
    SelectAction,
    ServerStatusAction,
    SetEditModeAction,
    SetViewportAction,
    TYPES,
    ViewerOptions,
    Viewport
} from '@eclipse-glsp/client';
import { Message } from '@phosphor/messaging/lib';
import {
    ApplicationShell,
    BaseWidget,
    codiconArray,
    Navigatable,
    NavigatableWidgetOptions,
    SaveableSource,
    StatefulWidget,
    StorageService,
    Widget
} from '@theia/core/lib/browser';
import { SelectionService } from '@theia/core/lib/common/selection-service';
import URI from '@theia/core/lib/common/uri';
import { Container } from '@theia/core/shared/inversify';
import { EditorPreferences } from '@theia/editor/lib/browser';
import { pickBy } from 'lodash';
import { GLSPTheiaDiagramServer } from './glsp-theia-diagram-server';
import { SaveableGLSPModelSource } from './saveable-glsp-model-source';
import { TheiaGLSPConnector } from './theia-glsp-connector';

export interface GLSPDiagramWidgetOptions extends NavigatableWidgetOptions {
    uri: string;
    diagramType: string;
    label: string;
    iconClass: string;
    editMode: string;
}

export namespace GLSPDiagramWidgetOptions {
    export function is(object: unknown): object is GLSPDiagramWidgetOptions {
        return (
            NavigatableWidgetOptions.is(object) &&
            hasStringProp(object, 'uri') &&
            hasStringProp(object, 'diagramType') &&
            hasStringProp(object, 'label') &&
            hasStringProp(object, 'iconClass') &&
            hasStringProp(object, 'editMode')
        );
    }
}

export interface GLSPDiagramWidgetContainer {
    diagramWidget: GLSPDiagramWidget;
}

export function isDiagramWidgetContainer(widget?: Widget): widget is Widget & GLSPDiagramWidgetContainer {
    return !!widget && 'diagramWidget' in widget && widget.diagramWidget instanceof GLSPDiagramWidget;
}

export class GLSPDiagramWidget extends BaseWidget implements SaveableSource, StatefulWidget, Navigatable {
    protected diagramContainer?: HTMLDivElement;
    protected statusIconDiv?: HTMLDivElement;
    protected statusMessageDiv?: HTMLDivElement;

    protected copyPasteHandler?: ICopyPasteHandler;
    public saveable: SaveableGLSPModelSource;
    protected requestModelOptions: Args;
    protected storeViewportStateOnClose = true;

    constructor(
        protected options: GLSPDiagramWidgetOptions,
        readonly widgetId: string,
        readonly diContainer: Container,
        readonly editorPreferences: EditorPreferences,
        readonly storage: StorageService,
        readonly theiaSelectionService: SelectionService,
        readonly connector: TheiaGLSPConnector
    ) {
        super();
        this.title.closable = true;
        this.title.label = options.label;
        this.title.iconClass = options.iconClass;
        this.id = widgetId;
        this.saveable = new SaveableGLSPModelSource(this.actionDispatcher, this.diContainer.get<ModelSource>(TYPES.ModelSource));
        this.updateSaveable();
        this.title.caption = this.uri.path.fsPath();
        this.toDispose.push(editorPreferences.onPreferenceChanged(() => this.updateSaveable()));
        this.toDispose.push(this.saveable);
    }

    protected override onAfterAttach(msg: Message): void {
        if (!this.diagramContainer) {
            // Create the container and initialize its content upon first attachment
            this.createContainer();
            this.initializeDiagram();
        }
        super.onAfterAttach(msg);

        this.node.dataset['uri'] = this.uri.toString();
        if (this.diContainer.isBound(TYPES.ICopyPasteHandler)) {
            this.copyPasteHandler = this.diContainer.get<ICopyPasteHandler>(TYPES.ICopyPasteHandler);
            this.addClipboardListener(this.node, 'copy', e => this.handleCopy(e));
            this.addClipboardListener(this.node, 'paste', e => this.handlePaste(e));
            this.addClipboardListener(this.node, 'cut', e => this.handleCut(e));
        }
        this.node.addEventListener('mouseenter', e => this.handleMouseEnter(e));
        this.node.addEventListener('mouseleave', e => this.handleMouseLeave(e));
    }

    protected createContainer(): void {
        this.diagramContainer = document.createElement('div');
        this.diagramContainer.id = this.viewerOptions.baseDiv;
        this.node.appendChild(this.diagramContainer);

        const hiddenContainer = document.createElement('div');
        hiddenContainer.id = this.viewerOptions.hiddenDiv;
        document.body.appendChild(hiddenContainer);

        const statusDiv = document.createElement('div');
        statusDiv.setAttribute('class', 'sprotty-status');
        this.node.appendChild(statusDiv);

        this.statusIconDiv = document.createElement('div');
        statusDiv.appendChild(this.statusIconDiv);

        this.statusMessageDiv = document.createElement('div');
        this.statusMessageDiv.setAttribute('class', 'sprotty-status-message');
        statusDiv.appendChild(this.statusMessageDiv);
    }

    protected updateSaveable(): void {
        this.saveable.autoSave = this.editorPreferences['files.autoSave'];
        this.saveable.autoSaveDelay = this.editorPreferences['files.autoSaveDelay'];
    }

    protected initializeDiagram(): void {
        const modelSource = this.diContainer.get<ModelSource>(TYPES.ModelSource);
        if (modelSource instanceof DiagramServerProxy) {
            modelSource.clientId = this.id;
        }
        if (modelSource instanceof GLSPTheiaDiagramServer) {
            this.connector.connect(modelSource);
        }

        this.disposed.connect(() => {
            if (modelSource instanceof GLSPTheiaDiagramServer) {
                this.connector.disconnect(modelSource);
            }
        });

        // Filter options to only contain defined primitive values
        const definedOptions: any = pickBy(this.options, v => v !== undefined && typeof v !== 'object');
        this.requestModelOptions = {
            sourceUri: this.uri.path.fsPath(),
            ...definedOptions
        };

        this.dispatchInitialActions();
    }

    protected getBoundsInPage(element: Element): Bounds {
        const bounds = element.getBoundingClientRect();
        return {
            x: bounds.left,
            y: bounds.top,
            width: bounds.width,
            height: bounds.height
        };
    }

    protected override onResize(msg: Widget.ResizeMessage): void {
        super.onResize(msg);
        const newBounds = this.getBoundsInPage(this.node as Element);
        this.actionDispatcher.dispatch(InitializeCanvasBoundsAction.create(newBounds));
    }

    protected override onActivateRequest(msg: Message): void {
        this.makeFocusable(this.node.querySelector(`#${this.viewerOptions.baseDiv} svg`));
        super.onActivateRequest(msg);
        this.focusDiagram();
        this.updateGlobalSelection();
    }

    protected makeFocusable(element: Element | null): void {
        // eslint-disable-next-line no-null/no-null
        if (element !== null) {
            const tabindex = element.getAttribute('tabindex');
            // eslint-disable-next-line no-null/no-null
            if (tabindex === null) {
                // use -1 to make focusable but not reachable via keyboard navigation
                element.setAttribute('tabindex', '-1');
            }
        }
    }

    protected focusDiagram(): void {
        const svgElement = this.node.querySelector(`#${this.viewerOptions.baseDiv} svg`) as HTMLElement;
        if (svgElement) {
            svgElement.focus();
        } else {
            const tabindex = this.node.getAttribute('tabindex');
            if (tabindex) {
                this.node.setAttribute('tabindex', '-1');
            }
            this.node.focus();
        }
    }

    protected async updateGlobalSelection(): Promise<void> {
        this.getSelectedElementIds().then((selectedElementsIDs: string[]) =>
            this.actionDispatcher.dispatch(SelectAction.create({ selectedElementsIDs }))
        );
    }

    /**
     * We cannot activate the widget before the SVG element is there, as it takes the focus.
     * This should happen within two animation frames, as the action dispatcher issues
     * a SetModelCommand in the constructor. OTOH, shell.activateWidget() is synchronous. So
     * after creating the widget and before activating it, we use this method to wait for the
     * SVG to be appended to the DOM.
     */
    async getSvgElement(): Promise<HTMLElement | undefined> {
        return new Promise<HTMLElement | undefined>(resolve => {
            let frames = 0;
            const waitForSvg = (): void => {
                requestAnimationFrame(() => {
                    const svgElement = this.node.querySelector(`#${this.viewerOptions.baseDiv} svg`) as HTMLElement | null;
                    if (svgElement) {
                        resolve(svgElement);
                    } else if (++frames < 5) {
                        waitForSvg();
                    } else {
                        resolve(undefined);
                    }
                });
            };
            waitForSvg();
        });
    }

    setStatus(status: ServerStatusAction): void {
        if (this.statusMessageDiv) {
            this.statusMessageDiv.textContent = status.message;
            this.removeClasses(this.statusMessageDiv, 1);
            this.statusMessageDiv.classList.add(status.severity.toLowerCase());
        }
        if (this.statusIconDiv) {
            this.removeClasses(this.statusIconDiv, 0);
            const classes = this.statusIconDiv.classList;
            classes.add(status.severity.toLowerCase());
            switch (status.severity) {
                case 'FATAL':
                    classes.add(...codiconArray('error'));
                    break;
                case 'ERROR':
                    classes.add(...codiconArray('warning'));
                    break;
                case 'WARNING':
                    classes.add(...codiconArray('warning'));
                    break;
                case 'INFO':
                    classes.add(...codiconArray('info'));
                    break;
            }
        }
    }

    protected removeClasses(element: Element, keep: number): void {
        const classes = element.classList;
        while (classes.length > keep) {
            const item = classes.item(classes.length - 1);
            if (item) {
                classes.remove(item);
            }
        }
    }

    protected async dispatchInitialActions(): Promise<void> {
        this.setStatus(ServerStatusAction.create('Initializing...', { severity: 'INFO' }));
        await this.connector.initializeResult;
        this.setStatus(ServerStatusAction.create('', { severity: 'NONE' }));

        this.actionDispatcher.dispatch(RequestModelAction.create({ options: this.requestModelOptions }));
        this.actionDispatcher.dispatch(RequestTypeHintsAction.create());
        this.actionDispatcher.dispatch(SetEditModeAction.create(this.options.editMode));
        this.actionDispatcher.onceModelInitialized().then(() => {
            this.actionDispatcher.dispatch(EnableToolPaletteAction.create());
        });
    }

    protected override onBeforeDetach(msg: Message): void {
        this.storeViewportDataInStorageService();
        this.node.removeEventListener('mouseenter', this.handleMouseEnter);
        this.node.removeEventListener('mouseleave', this.handleMouseLeave);
        super.onBeforeDetach(msg);
    }

    protected override onCloseRequest(msg: Message): void {
        super.onCloseRequest(msg);
        this.clearGlobalSelection();
    }

    reloadModel(): Promise<void> {
        return this.actionDispatcher.dispatch(RequestModelAction.create({ options: this.requestModelOptions }));
    }

    handleMouseEnter(e: MouseEvent): void {
        this.node.classList.add('mouse-enter');
        this.node.classList.remove('mouse-leave');
    }

    handleMouseLeave(e: MouseEvent): void {
        this.node.classList.add('mouse-leave');
        this.node.classList.remove('mouse-enter');
    }

    handleCopy(e: ClipboardEvent): void {
        if (this.copyPasteHandler) {
            this.copyPasteHandler.handleCopy(e);
        }
    }

    handleCut(e: ClipboardEvent): void {
        if (this.copyPasteHandler) {
            this.copyPasteHandler.handleCut(e);
        }
    }

    handlePaste(e: ClipboardEvent): void {
        if (this.copyPasteHandler) {
            this.copyPasteHandler.handlePaste(e);
        }
    }

    listenToFocusState(shell: ApplicationShell): void {
        this.toDispose.push(
            shell.onDidChangeActiveWidget(event => {
                const focusedWidget = event.newValue;
                if (this.hasFocus && focusedWidget && !this.isThisWidget(focusedWidget)) {
                    this.actionDispatcher.dispatch(FocusStateChangedAction.create(false));
                } else if (!this.hasFocus && this.isThisWidget(focusedWidget)) {
                    this.actionDispatcher.dispatch(FocusStateChangedAction.create(true));
                }
            })
        );
    }

    protected isThisWidget(widget?: Widget | null): boolean {
        // eslint-disable-next-line no-null/no-null
        if (!widget || widget === null) {
            return false;
        }
        const diagramWidget = getDiagramWidget(widget);
        return diagramWidget !== undefined && diagramWidget.id === this.id;
    }

    get hasFocus(): boolean | undefined {
        let focusTracker: FocusTracker | undefined;
        if (this.diContainer.isBound(FocusTracker)) {
            focusTracker = this.diContainer.get(FocusTracker);
        }
        if (focusTracker) {
            return focusTracker.hasFocus;
        }
        return undefined;
    }

    protected async getSelectedElementIds(): Promise<string[]> {
        const editorContextService = this.diContainer.get(EditorContextService);
        return editorContextService.selectedElements.map(element => element.id);
    }

    protected async clearGlobalSelection(): Promise<void> {
        this.theiaSelectionService.selection = undefined;
    }

    storeState(): AnyObject {
        // the viewport is stored in the application layout
        // so there is no need to keep it in the storage
        this.removeViewportDataFromStorageService();
        return { ...this.options, ...this.getViewportData() };
    }

    restoreState(oldState: AnyObject): void {
        if (GLSPDiagramWidgetOptions.is(oldState)) {
            this.options = oldState;
        }
        if (isViewportDataContainer(oldState)) {
            this.setViewportData(oldState);
        }
    }

    getResourceUri(): URI | undefined {
        return this.uri;
    }

    createMoveToUri(resourceUri: URI): URI | undefined {
        return this.uri.withPath(resourceUri.path);
    }

    protected storeViewportDataInStorageService(): void {
        if (!this.storeViewportStateOnClose) {
            return;
        }
        const viewportData = this.getViewportData();
        if (viewportData) {
            this.storage.setData<ViewportDataContainer>(this.viewportStorageId, viewportData);
        }
    }

    async restoreViewportDataFromStorageService(): Promise<void> {
        if (!this.storeViewportStateOnClose) {
            return;
        }
        const viewportData = await this.storage.getData<ViewportDataContainer>(this.viewportStorageId);
        if (viewportData) {
            this.setViewportData(viewportData);
        }
    }

    protected async removeViewportDataFromStorageService(): Promise<void> {
        return this.storage.setData<ViewportDataContainer | undefined>(this.viewportStorageId, undefined);
    }

    protected getViewportData(): ViewportDataContainer | undefined {
        let viewportData = undefined;
        if (isViewport(this.editorContext.modelRoot)) {
            viewportData = <ViewportDataContainer>{
                elementId: this.editorContext.modelRoot.id,
                viewportData: {
                    scroll: this.editorContext.modelRoot.scroll,
                    zoom: this.editorContext.modelRoot.zoom
                }
            };
        }
        return viewportData;
    }

    protected async setViewportData(viewportData: ViewportDataContainer): Promise<void> {
        if (this.actionDispatcher instanceof GLSPActionDispatcher) {
            const restoreViewportAction = SetViewportAction.create(viewportData.elementId, viewportData.viewportData, { animate: true });
            return this.actionDispatcher.onceModelInitialized().then(() => this.actionDispatcher.dispatch(restoreViewportAction));
        }
    }

    protected get viewportStorageId(): string {
        return this.options.diagramType + ':' + this.options.uri;
    }

    get actionDispatcher(): GLSPActionDispatcher {
        return this.diContainer.get(TYPES.IActionDispatcher);
    }

    get editorContext(): EditorContextService {
        return this.diContainer.get(EditorContextService);
    }

    get viewerOptions(): ViewerOptions {
        return this.diContainer.get(TYPES.ViewerOptions);
    }

    get modelSource(): ModelSource {
        return this.diContainer.get(ModelSource);
    }

    get clientId(): string {
        if (this.modelSource instanceof DiagramServerProxy) {
            return this.modelSource.clientId;
        } else {
            return this.widgetId;
        }
    }

    get uri(): URI {
        return new URI(this.options.uri);
    }

    get diagramType(): string {
        return this.options.diagramType;
    }
}

interface ViewportDataContainer {
    readonly elementId: string;
    readonly viewportData: Viewport;
}

function isViewportDataContainer(obj: any | undefined): obj is ViewportDataContainer {
    return obj !== undefined && obj['elementId'] !== undefined && obj['viewportData'] !== undefined;
}

export function getDiagramWidget(shell?: ApplicationShell): GLSPDiagramWidget | undefined;
export function getDiagramWidget(widget?: Widget): GLSPDiagramWidget | undefined;
export function getDiagramWidget(widgetOrShell?: Widget | ApplicationShell): GLSPDiagramWidget | undefined {
    const widget = widgetOrShell instanceof ApplicationShell ? widgetOrShell.activeWidget ?? widgetOrShell.currentWidget : widgetOrShell;

    if (widget instanceof GLSPDiagramWidget) {
        return widget;
    } else if (isDiagramWidgetContainer(widget)) {
        return widget.diagramWidget;
    }
    return undefined;
}
