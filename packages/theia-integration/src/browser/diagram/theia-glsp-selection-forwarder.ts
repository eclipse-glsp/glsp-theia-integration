/********************************************************************************
 * Copyright (c) 2018-2023 EclipseSource and others.
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
    ActionHandlerRegistry,
    AnyObject,
    hasArrayProp,
    hasObjectProp,
    hasStringProp,
    IActionHandler,
    IActionHandlerInitializer,
    RequestModelAction,
    SelectAction,
    TYPES,
    ViewerOptions
} from '@eclipse-glsp/client';
import { SelectionService } from '@theia/core';
import { inject, injectable, optional } from '@theia/core/shared/inversify';
import { GlspSelectionData, GlspSelectionDataService } from './glsp-selection-data-service';

export interface GlspSelection {
    additionalSelectionData?: GlspSelectionData;
    selectedElementsIDs: string[];
    widgetId: string;
    sourceUri?: string;
}

export function isGlspSelection(selection?: unknown): selection is GlspSelection {
    return (
        AnyObject.is(selection) &&
        hasArrayProp(selection, 'selectedElementsIDs') &&
        hasStringProp(selection, 'widgetId') &&
        hasStringProp(selection, 'sourceUri', true) &&
        hasObjectProp(selection, 'additionalSelectionData', true)
    );
}

@injectable()
export class TheiaGLSPSelectionForwarder implements IActionHandlerInitializer, IActionHandler {
    @inject(GlspSelectionDataService)
    @optional()
    protected readonly selectionDataService?: GlspSelectionDataService;

    @inject(TYPES.ViewerOptions)
    protected viewerOptions: ViewerOptions;
    @inject(SelectionService)
    protected selectionService: SelectionService;

    protected sourceUri?: string;

    initialize(registry: ActionHandlerRegistry): any {
        registry.register(RequestModelAction.KIND, this);
        registry.register(SelectAction.KIND, this);
    }

    handle(action: RequestModelAction | SelectAction): void {
        if (SelectAction.is(action) && this.selectionDataService) {
            this.selectionDataService.getSelectionData(action.selectedElementsIDs).then(
                (additionalSelectionData: any) =>
                    (this.selectionService.selection = {
                        selectedElementsIDs: action.selectedElementsIDs,
                        additionalSelectionData: additionalSelectionData,
                        widgetId: this.viewerOptions.baseDiv,
                        sourceUri: this.sourceUri
                    } as GlspSelection)
            );
        } else if (RequestModelAction.is(action) && action.options) {
            this.sourceUri = (action as RequestModelAction).options!.sourceUri as string;
        }
    }
}
