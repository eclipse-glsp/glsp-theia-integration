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
import { GLSP_TYPES, isDeletable, isMoveable, SModelRoot } from "@eclipse-glsp/client";
import { SelectionService } from "@eclipse-glsp/client/lib/features/select/selection-service";
import { ApplicationShell } from "@theia/core/lib/browser";
import { ContextKey, ContextKeyService } from "@theia/core/lib/browser/context-key-service";
import { inject, injectable, postConstruct } from "inversify";
import { isDiagramWidgetContainer } from "sprotty-theia";

import { GLSPDiagramWidget } from "./glsp-diagram-widget";

@injectable()
export class GLSPDiagramContextKeyService {

    @inject(ApplicationShell)
    protected readonly shell: ApplicationShell;

    @inject(ContextKeyService)
    protected readonly contextKeyService: ContextKeyService;

    protected currentSelectionService: SelectionService | undefined;

    protected readonly selectionChangeListener = {
        selectionChanged: (root: Readonly<SModelRoot>, selectedElements: string[]) => this.updateSelectionContextKeys(root, selectedElements)
    };

    protected _glspEditorFocus: ContextKey<boolean>;
    get glspEditorFocus(): ContextKey<boolean> {
        return this._glspEditorFocus;
    }

    protected _glspEditorDiagramType: ContextKey<string>;
    get glspEditorDiagramType(): ContextKey<string> {
        return this._glspEditorDiagramType;
    }

    protected _glspEditorHasSelection: ContextKey<boolean>;
    get glspEditorHasSelection(): ContextKey<boolean> {
        return this._glspEditorHasSelection;
    }

    protected _glspEditorHasSelectionOfType: ContextKey<string>;
    get glspEditorHasSelectionOfType(): ContextKey<string> {
        return this._glspEditorHasSelectionOfType;
    }

    protected _glspEditorHasMultipleSelection: ContextKey<boolean>;
    get glspEditorHasMultipleSelection(): ContextKey<boolean> {
        return this._glspEditorHasMultipleSelection;
    }

    protected _glspEditorHasDeletableSelection: ContextKey<boolean>;
    get glspEditorHasDeletableSelection(): ContextKey<boolean> {
        return this._glspEditorHasDeletableSelection;
    }

    protected _glspEditorHasMoveableSelection: ContextKey<boolean>;
    get glspEditorHasMoveableSelection(): ContextKey<boolean> {
        return this._glspEditorHasMoveableSelection;
    }

    @postConstruct()
    protected init(): void {
        this.registerContextKeys();
        this.updateContextKeys();
        this.shell.activeChanged.connect(() => this.updateContextKeys());
    }

    protected registerContextKeys() {
        this._glspEditorFocus = this.contextKeyService.createKey<boolean>('glspEditorFocus', false);
        this._glspEditorDiagramType = this.contextKeyService.createKey<string>('glspEditorDiagramType', undefined);
        this._glspEditorHasSelection = this.contextKeyService.createKey<boolean>('glspEditorHasSelection', false);
        this._glspEditorHasSelectionOfType = this.contextKeyService.createKey<string>('glspEditorHasSelectionOfType', undefined);
        this._glspEditorHasMultipleSelection = this.contextKeyService.createKey<boolean>('glspEditorHasMultipleSelection', false);
        this._glspEditorHasDeletableSelection = this.contextKeyService.createKey<boolean>('glspEditorHasDeletableSelection', false);
        this._glspEditorHasMoveableSelection = this.contextKeyService.createKey<boolean>('glspEditorHasMoveableSelection', false);
    }

    protected updateContextKeys() {
        if (this.currentSelectionService) {
            this.currentSelectionService.deregister(this.selectionChangeListener);
        }
        const glspDiagramWidget = this.getDiagramWidget();
        if (glspDiagramWidget) {
            this.glspEditorFocus.set(true);
            this.glspEditorDiagramType.set(glspDiagramWidget.diagramType);
            this.currentSelectionService = this.getSelectionService(glspDiagramWidget);
            this.currentSelectionService.register(this.selectionChangeListener);
            this.updateSelectionContextKeys(this.currentSelectionService.getModelRoot(), Array.from(this.currentSelectionService.getSelectedElementIDs()));
        } else {
            this.resetContextKeys();
        }
    }

    protected updateSelectionContextKeys(root: Readonly<SModelRoot>, selectedElementIds: string[]) {
        if (selectedElementIds.length < 1) {
            this.resetSelectionContextKeys();
            return;
        }
        const selectedElements = selectedElementIds.map(id => root.index.getById(id));
        this.glspEditorHasSelection.set(true);
        this.glspEditorHasMultipleSelection.set(selectedElements.length > 1);
        this.glspEditorHasDeletableSelection.set(selectedElements.filter(isDeletable).length > 0);
        this.glspEditorHasMoveableSelection.set(selectedElements.filter(isMoveable).length > 0);
        if (selectedElements.length === 1 && selectedElements[0]) {
            this.glspEditorHasSelectionOfType.set(selectedElements[0].type);
        }
    }

    protected getSelectionService(glspDiagramWidget: GLSPDiagramWidget): SelectionService {
        return glspDiagramWidget.diContainer.get(GLSP_TYPES.SelectionService);
    }

    protected getDiagramWidget() {
        const widget = (this.shell.activeWidget || this.shell.currentWidget);
        if (widget instanceof GLSPDiagramWidget) {
            return widget as GLSPDiagramWidget;
        } else if (isDiagramWidgetContainer(widget) && widget.diagramWidget instanceof GLSPDiagramWidget) {
            return widget.diagramWidget as GLSPDiagramWidget;
        }
        return undefined;
    }

    protected resetContextKeys() {
        this.glspEditorFocus.reset();
        this.glspEditorDiagramType.reset();
        this.resetSelectionContextKeys();
    }

    protected resetSelectionContextKeys() {
        this.glspEditorHasDeletableSelection.reset();
        this.glspEditorHasMoveableSelection.reset();
        this.glspEditorHasMultipleSelection.reset();
        this.glspEditorHasSelection.reset();
        this.glspEditorHasSelectionOfType.reset();
    }
}
