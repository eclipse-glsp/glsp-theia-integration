/********************************************************************************
 * Copyright (c) 2020-2023 EclipseSource and others.
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
import { bindOrRebind, ExternalMarkerManager, IActionDispatcher, Marker, MarkerKind, MarkersReason, TYPES } from '@eclipse-glsp/client/lib';
import URI from '@theia/core/lib/common/uri';
import { Container, inject, injectable, optional, postConstruct } from '@theia/core/shared/inversify';
import { ProblemManager } from '@theia/markers/lib/browser/problem/problem-manager';
import { Diagnostic } from 'vscode-languageserver-types';

import { ApplicationShell, Widget } from '@theia/core/lib/browser';
import { SelectionWithElementIds } from '../theia-opener-options-navigation-service';
import { getDiagramWidget } from './glsp-diagram-widget';

export const TheiaMarkerManagerFactory = Symbol('TheiaMarkerManagerFactory');

export function connectTheiaMarkerManager(
    container: Container,
    markerManagerFactory: () => ExternalMarkerManager,
    languageLabel: string
): void {
    const markerManager = markerManagerFactory();
    if (markerManager instanceof ExternalMarkerManager) {
        bindOrRebind(container, ExternalMarkerManager).toConstantValue(markerManager);
        markerManager.languageLabel = languageLabel;
        markerManager.connect(container.get<IActionDispatcher>(TYPES.IActionDispatcher));
    }
}

type ValidationMarker = Marker & { reason?: string };

class DiagnosticMarkers {
    protected diagnostic2marker = new Map<Diagnostic, ValidationMarker>();
    get size(): number {
        return this.diagnostic2marker.size;
    }
    all(): IterableIterator<ValidationMarker> {
        return this.diagnostic2marker.values();
    }
    marker(diagnostic: Diagnostic): ValidationMarker | undefined {
        return this.diagnostic2marker.get(diagnostic);
    }
    add(diagnostic: Diagnostic, marker: ValidationMarker): Map<Diagnostic, ValidationMarker> {
        return this.diagnostic2marker.set(diagnostic, marker);
    }
    getMarkerByOrigin(origin?: string): ValidationMarker[] {
        return Array.from(this.diagnostic2marker.values()).filter(marker => marker.reason === origin);
    }
    getByOrigin(origin?: string): Diagnostic[] {
        const diagnostics: Diagnostic[] = [];
        this.diagnostic2marker.forEach((marker, diagnostic) => {
            if (marker.reason === origin) {
                diagnostics.push(diagnostic);
            }
        });
        return diagnostics;
    }
    deleteByOrigin(origin?: string): void {
        const toDelete: Diagnostic[] = [];
        this.diagnostic2marker.forEach((marker, diagnostic) => {
            if (marker.reason === origin) {
                toDelete.push(diagnostic);
            }
        });
        toDelete.forEach(diagnostic => this.delete(diagnostic));
    }
    delete(diagnostic: Diagnostic): boolean {
        return this.diagnostic2marker.delete(diagnostic);
    }
    clear(): void {
        return this.diagnostic2marker.clear();
    }
}

@injectable()
export class TheiaMarkerManager extends ExternalMarkerManager {
    protected markerReasonsToKeep = [MarkersReason.LIVE];

    @inject(ProblemManager) @optional() protected readonly problemManager?: ProblemManager;
    @inject(ApplicationShell) @optional() protected readonly shell?: ApplicationShell;

    protected uri2markers = new Map<string, DiagnosticMarkers>();

    protected markers(uri: URI): DiagnosticMarkers {
        const markers = this.uri2markers.get(uri.toString());
        if (markers === undefined) {
            const newMarker = new DiagnosticMarkers();
            this.uri2markers.set(uri.toString(), newMarker);
            return newMarker;
        }
        return markers;
    }

    @postConstruct()
    protected initialize(): void {
        if (this.problemManager) {
            this.problemManager.onDidChangeMarkers(uri => this.refreshMarker(uri));
        }
        if (this.shell) {
            this.shell.onDidRemoveWidget(widget => this.handleWidgetClose(widget));
        }
    }

    protected async refreshMarker(uri: URI): Promise<void> {
        if (this.problemManager === undefined || this.markers(uri).size < 1) {
            return;
        }
        const toDelete = [...this.markers(uri).all()];
        for (const existingMarker of this.problemManager.findMarkers({ uri })) {
            const diagnostic = existingMarker.data;
            const marker = this.markers(uri).marker(diagnostic);
            if (marker) {
                const index = toDelete.indexOf(marker);
                if (index > -1) {
                    toDelete.splice(index, 1);
                } else {
                    this.markers(uri).delete(diagnostic);
                }
            }
        }
        if (toDelete.length > 0) {
            this.removeMarkers(toDelete);
        }
    }

    setMarkers(markers: Marker[], reason?: string, sourceUri?: string): void {
        if (this.problemManager === undefined) {
            return;
        }
        const uri = new URI(sourceUri);

        this.markers(uri).deleteByOrigin(reason);
        const existingOtherMarkers = [...this.markers(uri).all()];
        this.markers(uri).clear();

        const existingOtherDiagnostics = existingOtherMarkers.map(marker => this.createDiagnostic(uri, marker, marker.reason));
        const newDiagnostics = markers.map(marker => this.createDiagnostic(uri, marker, reason));
        this.problemManager.setMarkers(uri, this.languageLabel, [...existingOtherDiagnostics, ...newDiagnostics]);
    }

    protected createDiagnostic(uri: URI, marker: Marker, origin?: string): Diagnostic {
        const range = SelectionWithElementIds.createRange([marker.elementId]);
        const diagnostic = Diagnostic.create(range, marker.label, this.toSeverity(marker.kind));
        this.markers(uri).add(diagnostic, { ...marker, reason: origin });
        return diagnostic;
    }

    protected toSeverity(kind: string): 1 | 2 | 3 | 4 | undefined {
        switch (kind) {
            case MarkerKind.ERROR:
                return 1;
            case MarkerKind.WARNING:
                return 2;
            case MarkerKind.INFO:
                return 3;
            default:
                return undefined;
        }
    }

    protected handleWidgetClose(widget: Widget): void {
        const resourceUri = getDiagramWidget(widget)?.getResourceUri();
        if (resourceUri) {
            this.clearMarkers(resourceUri, this.markerReasonsToKeep);
        }
    }

    protected clearMarkers(uri: URI, exceptThoseWithReasons: string[]): void {
        const diagnostics = [];
        for (const reason of exceptThoseWithReasons) {
            const markersToKeep = this.markers(uri).getMarkerByOrigin(reason);
            this.markers(uri).clear();
            const diagnosticsToKeep = markersToKeep.map(marker => this.createDiagnostic(uri, marker, reason));
            diagnostics.push(...diagnosticsToKeep);
        }
        this.problemManager?.setMarkers(uri, this.languageLabel, diagnostics);
    }
}
