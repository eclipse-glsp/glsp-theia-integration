/********************************************************************************
 * Copyright (c) 2019-2022 EclipseSource and others.
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
    Args,
    DiagramServerProxy,
    EditorContextService,
    EnableToolPaletteAction,
    FocusStateChangedAction,
    FocusTracker,
    GLSPActionDispatcher,
    IActionDispatcher,
    ICopyPasteHandler,
    isViewport,
    ModelSource,
    RequestModelAction,
    RequestTypeHintsAction,
    SaveModelAction,
    SelectAction,
    SetEditModeAction,
    SetViewportAction,
    TYPES,
    Viewport
} from '@eclipse-glsp/client';
import { Message } from '@phosphor/messaging/lib';
import { ApplicationShell, Saveable, SaveableSource, StorageService, Widget } from '@theia/core/lib/browser';
import { Disposable, DisposableCollection, Emitter, Event, MaybePromise } from '@theia/core/lib/common';
import { SelectionService } from '@theia/core/lib/common/selection-service';
import { Container } from '@theia/core/shared/inversify';
import { EditorPreferences } from '@theia/editor/lib/browser';
import { pickBy } from 'lodash';
import { DiagramWidget, DiagramWidgetOptions, isDiagramWidgetContainer } from 'sprotty-theia';
import { GLSPWidgetOpenerOptions, GLSPWidgetOptions } from './glsp-diagram-manager';
import { DirtyStateNotifier, GLSPTheiaDiagramServer } from './glsp-theia-diagram-server';
import { TheiaGLSPConnector } from './theia-glsp-connector';

export class GLSPDiagramWidget extends DiagramWidget implements SaveableSource {
    protected copyPasteHandler?: ICopyPasteHandler;
    public saveable: SaveableGLSPModelSource;
    protected override options: DiagramWidgetOptions & GLSPWidgetOptions;
    protected requestModelOptions: Args;
    protected storeViewportStateOnClose = true;

    constructor(
        options: DiagramWidgetOptions & GLSPWidgetOpenerOptions,
        override readonly widgetId: string,
        override readonly diContainer: Container,
        readonly editorPreferences: EditorPreferences,
        readonly storage: StorageService,
        readonly theiaSelectionService: SelectionService,
        override readonly connector: TheiaGLSPConnector
    ) {
        super(options, widgetId, diContainer, connector);
        this.saveable = new SaveableGLSPModelSource(this.actionDispatcher, this.diContainer.get<ModelSource>(TYPES.ModelSource));
        this.updateSaveable();
        this.title.caption = this.uri.path.fsPath();
        const prefUpdater = editorPreferences.onPreferenceChanged(() => this.updateSaveable());
        this.toDispose.push(prefUpdater);
        this.toDispose.push(this.saveable);
    }

    protected updateSaveable(): void {
        this.saveable.autoSave = this.editorPreferences['files.autoSave'];
        this.saveable.autoSaveDelay = this.editorPreferences['files.autoSaveDelay'];
    }

    protected override initializeSprotty(): void {
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

    protected dispatchInitialActions(): void {
        this.actionDispatcher.dispatch(RequestModelAction.create({ options: this.requestModelOptions }));
        this.actionDispatcher.dispatch(RequestTypeHintsAction.create());
        this.actionDispatcher.dispatch(EnableToolPaletteAction.create());
        this.actionDispatcher.dispatch(SetEditModeAction.create(this.options.editMode));
    }

    protected override onAfterAttach(msg: Message): void {
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

    protected override onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        this.updateGlobalSelection();
    }

    get diagramType(): string {
        return this.options.diagramType;
    }

    get editorContext(): EditorContextService {
        return this.diContainer.get(EditorContextService);
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

    protected async updateGlobalSelection(): Promise<void> {
        this.getSelectedElementIds().then((selectedElementsIDs: string[]) =>
            this.actionDispatcher.dispatch(SelectAction.create({ selectedElementsIDs }))
        );
    }

    protected async clearGlobalSelection(): Promise<void> {
        this.theiaSelectionService.selection = undefined;
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    override storeState(): object {
        // the viewport is stored in the application layout
        // so there is no need to keep it in the storage
        this.removeViewportDataFromStorageService();
        return { ...super.storeState(), ...this.getViewportData() };
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    override restoreState(oldState: object): void {
        super.restoreState(oldState);
        if (isViewportDataContainer(oldState)) {
            this.setViewportData(oldState);
        }
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

    protected get viewportStorageId(): string {
        return this.options.diagramType + ':' + this.options.uri;
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
}

interface ViewportDataContainer {
    readonly elementId: string;
    readonly viewportData: Viewport;
}

function isViewportDataContainer(obj: any | undefined): obj is ViewportDataContainer {
    return obj !== undefined && obj['elementId'] !== undefined && obj['viewportData'] !== undefined;
}

export function getDiagramWidget(widget: Widget): GLSPDiagramWidget | undefined {
    if (widget instanceof GLSPDiagramWidget) {
        return widget as GLSPDiagramWidget;
    } else if (isDiagramWidgetContainer(widget) && widget.diagramWidget instanceof GLSPDiagramWidget) {
        return widget.diagramWidget as GLSPDiagramWidget;
    }
    return undefined;
}

type AutoSaveType = 'off' | 'afterDelay' | 'onFocusChange' | 'onWindowChange';

export class SaveableGLSPModelSource implements Saveable, Disposable {
    protected _autoSave: AutoSaveType = 'off';
    autoSaveDelay = 500;

    private autoSaveJobs = new DisposableCollection();
    private isDirty = false;
    readonly dirtyChangedEmitter: Emitter<void> = new Emitter<void>();

    constructor(readonly actionDispatcher: IActionDispatcher, readonly modelSource: ModelSource) {
        if (DirtyStateNotifier.is(this.modelSource)) {
            this.modelSource.onDirtyStateChange(dirtyState => (this.dirty = dirtyState.isDirty));
        }
    }

    get onDirtyChanged(): Event<void> {
        return this.dirtyChangedEmitter.event;
    }

    save(): MaybePromise<void> {
        return this.actionDispatcher.dispatch(SaveModelAction.create());
    }

    get dirty(): boolean {
        return this.isDirty;
    }

    set dirty(newDirty: boolean) {
        const oldValue = this.isDirty;
        if (oldValue !== newDirty) {
            this.isDirty = newDirty;
            this.dirtyChangedEmitter.fire(undefined);
        }
        this.scheduleAutoSave();
    }

    set autoSave(autoSave: AutoSaveType) {
        this._autoSave = autoSave;
        if (this.shouldAutoSave) {
            this.scheduleAutoSave();
        } else {
            this.autoSaveJobs.dispose();
        }
    }

    get autoSave(): AutoSaveType {
        return this._autoSave;
    }

    protected scheduleAutoSave(): void {
        if (this.shouldAutoSave) {
            this.autoSaveJobs.dispose();
            const autoSaveJob = window.setTimeout(() => this.doAutoSave(), this.autoSaveDelay);
            const disposableAutoSaveJob = Disposable.create(() => window.clearTimeout(autoSaveJob));
            this.autoSaveJobs.push(disposableAutoSaveJob);
        }
    }

    protected doAutoSave(): void {
        if (this.shouldAutoSave) {
            this.save();
        }
    }

    protected get shouldAutoSave(): boolean {
        return this.dirty && this.autoSave !== 'off';
    }

    // Needs to be implemented to pass the type check of `WorkspaceFrontendContribution.canBeSaved`.
    async revert(options?: Saveable.RevertOptions): Promise<void> {
        console.warn('GLSP only supports server-side saving. The `revert` implementation is no-op and has no effect.');
    }

    // Needs to be implemented to pass the type check of `WorkspaceFrontendContribution.canBeSaved`.
    createSnapshot(): Saveable.Snapshot {
        throw new Error('GLSP only supports server-side saving. `createSnapshot` should never be invoked');
    }

    dispose(): void {
        this.autoSaveJobs.dispose();
        this.dirtyChangedEmitter.dispose();
    }
}
