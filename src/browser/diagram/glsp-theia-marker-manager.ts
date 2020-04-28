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
import { ExternalMarkerManager, IActionDispatcher, Marker, MarkerKind, TYPES } from "@eclipse-glsp/client/lib";
import { OpenerOptions } from "@theia/core/lib/browser";
import URI from "@theia/core/lib/common/uri";
import { Diagnostic } from "@theia/languages/lib/browser";
import { ProblemManager } from "@theia/markers/lib/browser/problem/problem-manager";
import { Container, inject, injectable, optional, postConstruct } from "inversify";

export const TheiaMarkerManagerFactory = Symbol('TheiaMarkerManagerFactory');

export function connectTheiaMarkerManager(container: Container, markerManagerFactory: () => ExternalMarkerManager, languageLabel: string) {
    const markerManager = markerManagerFactory();
    if (markerManager instanceof ExternalMarkerManager) {
        if (container.isBound(ExternalMarkerManager)) {
            container.rebind(ExternalMarkerManager).toConstantValue(markerManager);
        } else {
            container.bind(ExternalMarkerManager).toConstantValue(markerManager);
        }
        markerManager.languageLabel = languageLabel;
        markerManager.connect(container.get<IActionDispatcher>(TYPES.IActionDispatcher));
    }
}

export interface RangeAwareOptions {
    readonly selection: Range;
}

export namespace RangeAwareOptions {
    export function is(options: OpenerOptions | undefined): options is RangeAwareOptions {
        return options !== undefined && 'selection' in options;
    }
    export function elementId(options: OpenerOptions | undefined): string[] | undefined {
        if (!RangeAwareOptions.is(options)) {
            return undefined;
        }
        if (!RangeOfElements.is(options.selection)) {
            return undefined;
        }
        return options.selection.elementIds;
    }
}

export interface RangeOfElements extends Range {
    readonly elementIds: string[];
}

export namespace RangeOfElements {
    export function is(range: Range | undefined): range is RangeOfElements {
        return range !== undefined && 'elementIds' in range;
    }
    export function create(elementIds: string[]) {
        return { start: { line: -1, character: -1 }, end: { line: -1, character: -1 }, elementIds };
    }
}

@injectable()
export class TheiaMarkerManager extends ExternalMarkerManager {

    @inject(ProblemManager) @optional() protected readonly problemManager?: ProblemManager;

    protected currentMarkers = new Map<Diagnostic, Marker>();

    @postConstruct()
    initialize() {
        if (this.problemManager) {
            this.problemManager.onDidChangeMarkers(uri => this.refreshMarker(uri));
        }
    }

    protected async refreshMarker(uri: URI): Promise<void> {
        if (this.problemManager === undefined || this.currentMarkers.size < 1) {
            return;
        }
        const toDelete = [...this.currentMarkers.values()];
        for (const existingMarker of this.problemManager.findMarkers({ uri })) {
            const diagnostic = existingMarker.data;
            const marker = this.currentMarkers.get(diagnostic);
            if (marker) {
                const index = toDelete.indexOf(marker);
                if (index > -1) {
                    toDelete.splice(index, 1);
                } else {
                    this.currentMarkers.delete(diagnostic);
                }
            }
        }
        if (toDelete.length > 0) {
            this.removeMarkers(toDelete);
        }
    }

    setMarkers(markers: Marker[], sourceUri?: string) {
        if (this.problemManager) {
            const uri = new URI(sourceUri);
            this.currentMarkers.clear();
            this.problemManager.setMarkers(uri, this.languageLabel, markers.map(marker => this.createDiagnostic(marker)));
        }
    }

    protected createDiagnostic(marker: Marker): Diagnostic {
        const diagnostic = Diagnostic.create(RangeOfElements.create([marker.elementId]), marker.label, this.toSeverity(marker.kind));
        this.currentMarkers.set(diagnostic, marker);
        return diagnostic;
    }

    protected toSeverity(kind: string): 1 | 2 | 3 | 4 | undefined {
        switch (kind) {
            case MarkerKind.ERROR: return 1;
            case MarkerKind.WARNING: return 2;
            case MarkerKind.INFO: return 3;
            default: return undefined;
        }
    }

}
