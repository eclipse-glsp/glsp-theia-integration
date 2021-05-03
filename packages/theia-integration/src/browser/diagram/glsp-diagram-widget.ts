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
 import {
    Args,
    DiagramServer,
    DisposeClientSessionAction,
    EditorContextService,
    EnableToolPaletteAction,
    FocusStateChangedAction,
    FocusTracker,
    GLSP_TYPES,
    IActionDispatcher,
    ICopyPasteHandler,
    InitializeClientSessionAction,
    ModelSource,
    RequestModelAction,
    RequestTypeHintsAction,
    SaveModelAction,
    SetEditModeAction,
    TYPES
} from '@eclipse-glsp/client';
import { Message } from '@phosphor/messaging/lib';
import { ApplicationShell, Saveable, SaveableSource, Widget } from '@theia/core/lib/browser';
import { Disposable, DisposableCollection, Emitter, Event, MaybePromise } from '@theia/core/lib/common';
import { EditorPreferences } from '@theia/editor/lib/browser';
import { Container } from 'inversify';
import { pickBy } from 'lodash';
import { DiagramWidget, DiagramWidgetOptions, isDiagramWidgetContainer, TheiaSprottyConnector } from 'sprotty-theia';

import { GLSPWidgetOpenerOptions, GLSPWidgetOptions } from './glsp-diagram-manager';
import { DirtyStateNotifier, GLSPTheiaDiagramServer } from './glsp-theia-diagram-server';

export class GLSPDiagramWidget extends DiagramWidget implements SaveableSource {

    protected copyPasteHandler?: ICopyPasteHandler;
    public saveable: SaveableGLSPModelSource;
    protected options: DiagramWidgetOptions & GLSPWidgetOptions;
    protected requestModelOptions: Args;

    constructor(options: DiagramWidgetOptions & GLSPWidgetOpenerOptions, readonly widgetId: string, readonly diContainer: Container,
        readonly editorPreferences: EditorPreferences, readonly connector?: TheiaSprottyConnector) {
        super(options, widgetId, diContainer, connector);
        this.saveable = new SaveableGLSPModelSource(this.actionDispatcher, this.diContainer.get<ModelSource>(TYPES.ModelSource));
        this.updateSaveable();
        this.title.caption = this.uri.path.toString();
        const prefUpdater = editorPreferences.onPreferenceChanged(() => this.updateSaveable());
        this.toDispose.push(prefUpdater);
        this.toDispose.push(this.saveable);
        this.toDispose.push(Disposable.create(() => this.actionDispatcher.dispatch(new DisposeClientSessionAction(this.widgetId))));
    }

    protected updateSaveable(): void {
        this.saveable.autoSave = this.editorPreferences['editor.autoSave'];
        this.saveable.autoSaveDelay = this.editorPreferences['editor.autoSaveDelay'];
    }

    protected initializeSprotty(): void {
        const modelSource = this.diContainer.get<ModelSource>(TYPES.ModelSource);
        if (modelSource instanceof DiagramServer) {
            modelSource.clientId = this.id;
        }
        if (modelSource instanceof GLSPTheiaDiagramServer && this.connector) {
            this.connector.connect(modelSource);
        }

        this.disposed.connect(() => {
            if (modelSource instanceof GLSPTheiaDiagramServer && this.connector) {
                this.connector.disconnect(modelSource);
            }
        });

        this.actionDispatcher.dispatch(new InitializeClientSessionAction(this.widgetId));
        // Filter options to only contain defined primitive values
        const definedOptions: any = pickBy(this.options, v => v !== undefined && typeof v !== 'object');
        this.requestModelOptions = {
            sourceUri: this.uri.path.toString(),
            ...definedOptions
        };
        this.actionDispatcher.dispatch(new RequestModelAction(this.requestModelOptions));
        this.actionDispatcher.dispatch(new RequestTypeHintsAction(this.options.diagramType));
        this.actionDispatcher.dispatch(new EnableToolPaletteAction());
        this.actionDispatcher.dispatch(new SetEditModeAction(this.options.editMode));
    }

    protected onAfterAttach(msg: Message): void {
        super.onAfterAttach(msg);
        this.node.dataset['uri'] = this.uri.toString();
        if (this.diContainer.isBound(GLSP_TYPES.ICopyPasteHandler)) {
            this.copyPasteHandler = this.diContainer.get<ICopyPasteHandler>(GLSP_TYPES.ICopyPasteHandler);
            this.addClipboardListener(this.node, 'copy', e => this.handleCopy(e));
            this.addClipboardListener(this.node, 'paste', e => this.handlePaste(e));
            this.addClipboardListener(this.node, 'cut', e => this.handleCut(e));
        }
    }

    get diagramType(): string {
        return this.options.diagramType;
    }

    get editorContext(): EditorContextService {
        return this.diContainer.get(EditorContextService);
    }

    reloadModel(): Promise<void> {
        return this.actionDispatcher.dispatch(new RequestModelAction(this.requestModelOptions));
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
        this.toDispose.push(shell.onDidChangeActiveWidget(event => {
            const focusedWidget = event.newValue;
            if (this.hasFocus && !this.isThisWidget(focusedWidget)) {
                this.actionDispatcher.dispatch(new FocusStateChangedAction(false));
            } else if (!this.hasFocus && this.isThisWidget(focusedWidget)) {
                this.actionDispatcher.dispatch(new FocusStateChangedAction(true));
            }
        }));
    }

    protected isThisWidget(widget: Widget | null): boolean {
        // eslint-disable-next-line no-null/no-null
        if (widget === null) {
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
}

export function getDiagramWidget(widget: Widget): GLSPDiagramWidget | undefined {
    if (widget instanceof GLSPDiagramWidget) {
        return widget as GLSPDiagramWidget;
    } else if (isDiagramWidgetContainer(widget) && widget.diagramWidget instanceof GLSPDiagramWidget) {
        return widget.diagramWidget as GLSPDiagramWidget;
    }
    return undefined;
}

export class SaveableGLSPModelSource implements Saveable, Disposable {
    isAutoSave: 'on' | 'off' = 'on';
    autoSaveDelay = 500;

    private autoSaveJobs = new DisposableCollection();
    private isDirty = false;
    readonly dirtyChangedEmitter: Emitter<void> = new Emitter<void>();

    constructor(readonly actionDispatcher: IActionDispatcher, readonly modelSource: ModelSource) {
        if (DirtyStateNotifier.is(this.modelSource)) {
            this.modelSource.onDirtyStateChange(dirtyState => this.dirty = dirtyState.isDirty);
        }
    }

    get onDirtyChanged(): Event<void> {
        return this.dirtyChangedEmitter.event;
    }

    save(): MaybePromise<void> {
        return this.actionDispatcher.dispatch(new SaveModelAction());
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

    set autoSave(isAutoSave: 'on' | 'off') {
        this.isAutoSave = isAutoSave;
        if (this.shouldAutoSave) {
            this.scheduleAutoSave();
        } else {
            this.autoSaveJobs.dispose();
        }
    }

    get autoSave(): 'on' | 'off' {
        return this.isAutoSave;
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
        return this.dirty && this.autoSave === 'on';
    }

    dispose(): void {
        this.autoSaveJobs.dispose();
        this.dirtyChangedEmitter.dispose();
    }
}
