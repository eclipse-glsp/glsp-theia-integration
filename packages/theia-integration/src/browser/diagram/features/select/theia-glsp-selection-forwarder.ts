/********************************************************************************
 * Copyright (c) 2018-2024 EclipseSource and others.
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
// based on: https://github.com/eclipse-sprotty/sprotty-theia/blob/v0.12.0/src/sprotty/theia-sprotty-selection-forwarder.ts
import {
    AnyObject,
    DisposableCollection,
    EditorContextService,
    GLSPModelSource,
    GModelRoot,
    ISelectionListener,
    ModelSource,
    TYPES,
    ViewerOptions,
    hasArrayProp,
    hasObjectProp,
    hasStringProp,
    pluck
} from '@eclipse-glsp/client';
import { SelectionService as TheiaSelectionService } from '@theia/core';
import { inject, injectable, optional, postConstruct, preDestroy } from '@theia/core/shared/inversify';

export interface GlspSelection {
    additionalSelectionData?: GlspSelectionData;
    selectedElementsIDs: string[];
    widgetId: string;
    sourceUri?: string;
}

export namespace GlspSelection {
    export function is(object: unknown): object is GlspSelection {
        return (
            AnyObject.is(object) &&
            hasArrayProp(object, 'selectedElementsIDs') &&
            hasStringProp(object, 'widgetId') &&
            hasStringProp(object, 'sourceUri', true) &&
            hasObjectProp(object, 'additionalSelectionData', true)
        );
    }
}

/**
 * Additional domain specific selection data that can be attached to a {@link GlspSelection}
 */
export interface GlspSelectionData {
    selectionDataMap: Map<string, unknown>;
}

/**
 * Optional service that can be implemented to provide additional {@link GlspSelectionData} for
 *  the {@link TheiaGLSPSelectionForwarder}
 */
@injectable()
export abstract class GlspSelectionDataService {
    abstract getSelectionData(root: Readonly<GModelRoot>, selectedElementIds: string[]): Promise<GlspSelectionData>;
}

/**
 * Reacts to diagram selection changes and forwards the corresponding {@link GlspSelection}
 * to Theia`s {@link SelectionService}
 *
 * (bound in Diagram child DI container)
 */
@injectable()
export class TheiaGLSPSelectionForwarder implements ISelectionListener {
    @inject(GlspSelectionDataService)
    @optional()
    protected readonly selectionDataService?: GlspSelectionDataService;

    @inject(TYPES.ViewerOptions)
    protected viewerOptions: ViewerOptions;

    @inject(TheiaSelectionService)
    protected theiaSelectionService: TheiaSelectionService;

    @inject(TYPES.ModelSourceProvider)
    protected modelSourceProvider: () => Promise<ModelSource>;

    @inject(EditorContextService)
    protected editorContext: EditorContextService;

    protected sourceUri?: string;

    protected toDispose = new DisposableCollection();

    @postConstruct()
    protected init(): void {
        this.toDispose.push(
            this.editorContext.onFocusChanged(event => {
                if (event.hasFocus) {
                    // restore selection from the global scope to the diagram
                    this.selectionChanged(this.editorContext.modelRoot, pluck(this.editorContext.selectedElements, 'id'));
                }
            })
        );
    }

    @preDestroy()
    protected dispose(): void {
        this.toDispose.dispose();
    }

    protected async getSourceUri(): Promise<string | undefined> {
        if (!this.sourceUri) {
            const modelSource = await this.modelSourceProvider();
            if (modelSource instanceof GLSPModelSource) {
                this.sourceUri = modelSource.sourceUri;
            }
        }
        return this.sourceUri;
    }

    selectionChanged(root: Readonly<GModelRoot>, selectedElements: string[]): void {
        this.handleSelectionChanged(root, selectedElements);
    }

    async handleSelectionChanged(root: Readonly<GModelRoot>, selectedElementsIDs: string[]): Promise<void> {
        const sourceUri = await this.getSourceUri();
        const additionalSelectionData = (await this.selectionDataService?.getSelectionData(root, selectedElementsIDs)) ?? undefined;
        const glspSelection: GlspSelection = {
            selectedElementsIDs,
            additionalSelectionData,
            widgetId: this.viewerOptions.baseDiv,
            sourceUri: sourceUri
        };
        this.theiaSelectionService.selection = glspSelection;
    }
}
