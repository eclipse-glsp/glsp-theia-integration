/********************************************************************************
 * Copyright (c) 2021 EclipseSource and others.
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
import { GlspSelectionDataService, SelectionData } from '@eclipse-glsp/client/lib/features/select/selection-data-service';
import { inject, injectable } from 'inversify';
import { Action, SelectAction } from 'sprotty';
import { isSprottySelection, SprottySelection, TheiaSprottySelectionForwarder } from 'sprotty-theia';

export interface GlspSelection extends SprottySelection {
    additionalSelectionData?: SelectionData;
}

export function isGlspSelection(selection?: any): selection is GlspSelection {
    return !!selection && isSprottySelection(selection);
}

@injectable()
export class GlspTheiaSelectionForwarder extends TheiaSprottySelectionForwarder {

    @inject(GlspSelectionDataService) protected readonly selectionDataService: GlspSelectionDataService;

    handle(action: Action): void {
        if (action instanceof SelectAction) {
            this.selectionDataService.getSelectionData(action.selectedElementsIDs).then((additionalSelectionData: any) =>
                this.selectionService.selection = {
                    selectedElementsIDs: action.selectedElementsIDs,
                    additionalSelectionData: additionalSelectionData,
                    widgetId: this.viewerOptions.baseDiv,
                    sourceUri: this.sourceUri
                } as GlspSelection
            );
        } else {
            super.handle(action);
        }
    }
}
