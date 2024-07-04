/********************************************************************************
 * Copyright (c) 2019-2024 EclipseSource and others.
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
import { DirtyStateChange, EditorContextService, GLSPActionDispatcher, SaveModelAction } from '@eclipse-glsp/client';
import { Disposable, DisposableCollection, Emitter, Event, MaybePromise } from '@theia/core';
import { Saveable } from '@theia/core/lib/browser';
import { satisfiesTheiaVersion } from '../../common';

type AutoSaveType = 'off' | 'afterDelay' | 'onFocusChange' | 'onWindowChange';

/**
 * The default {@link Saveable} implementation of the `GLSPDiagramWidget`.
 * Since Theia 1.50.0, handling the autosave functionality is done by a central `SaveableService` and is no longer the responsibility of the
 * {@link Saveable} itself. This implementation includes a compatibility layer for both the old saveable implementation prior
 * to Theia 1.50.0 and the new saveable implementation.
 * When using a Theia version >= 1.50.0, the autosave functionality is limited to the `afterDelay` strategy.
 * Other autosave types (`onWindowChange` | `onFocusChange`) are not supported. If the `autoSaveType` is set to an unsupported value, the
 * `afterDelay` save strategy will be used.
 */
export class GLSPSaveable implements Saveable, Disposable {
    protected toDispose = new DisposableCollection();
    readonly onDirtyChangedEmitter: Emitter<void> = new Emitter<void>();
    get onDirtyChanged(): Event<void> {
        return this.onDirtyChangedEmitter.event;
    }

    readonly onContentChangedEmitter: Emitter<void> = new Emitter<void>();
    get onContentChanged(): Event<void> {
        return this.onContentChangedEmitter.event;
    }

    constructor(
        protected actionDispatcher: GLSPActionDispatcher,
        protected editorContextService: EditorContextService
    ) {
        this.toDispose.pushAll([
            this.editorContextService.onDirtyStateChanged(change => this.handleDirtyStateChange(change)),
            this.onDirtyChangedEmitter,
            this.autoSaveJobs
        ]);
    }

    protected handleDirtyStateChange(change: DirtyStateChange): void {
        this.onDirtyChangedEmitter.fire(undefined);

        if (change.isDirty) {
            this.onContentChangedEmitter.fire(undefined);
            this.scheduleAutoSave();
        }
    }

    save(): MaybePromise<void> {
        if (this.editorContextService.isDirty) {
            return this.actionDispatcher.dispatch(SaveModelAction.create());
        }
    }

    get dirty(): boolean {
        return this.editorContextService.isDirty;
    }

    // Needs to be implemented to pass the type check of `WorkspaceFrontendContribution.canBeSaved`.
    // GLSP handles saving and model changes on the server side. The `revert` implementation is no-op and has no effect.
    async revert(options?: Saveable.RevertOptions): Promise<void> {}

    // Needs to be implemented to pass the type check of `WorkspaceFrontendContribution.canBeSaved`.
    // GLSP only supports server-side saving. The `createSnapshot` implementation is no-op and has no effect.
    createSnapshot(): Saveable.Snapshot {
        // eslint-disable-next-line no-null/no-null
        return { read: () => null };
    }

    dispose(): void {
        this.toDispose.dispose();
    }

    // Compatibility layer for the old saveable implementation prior to Theia 1.50.0
    protected compatibilityLayerEnabled = satisfiesTheiaVersion('<1.50.0');
    protected _autoSave: AutoSaveType = 'off';
    autoSaveDelay = 500;

    protected autoSaveJobs = new DisposableCollection();

    protected doAutoSave(): void {
        if (this.shouldAutoSave) {
            this.save();
        }
    }

    protected get shouldAutoSave(): boolean {
        return this.compatibilityLayerEnabled && this.dirty && this.autoSave !== 'off';
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
}
