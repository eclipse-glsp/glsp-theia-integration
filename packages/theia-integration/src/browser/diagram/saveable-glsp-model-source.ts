/********************************************************************************
 * Copyright (c) 2019-2023 EclipseSource and others.
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
import { IActionDispatcher, ModelSource, SaveModelAction } from '@eclipse-glsp/client';
import { Disposable, DisposableCollection, Emitter, Event, MaybePromise } from '@theia/core';
import { Saveable } from '@theia/core/lib/browser';
import { DirtyStateNotifier } from './glsp-theia-diagram-server';

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
        if (this.isDirty) {
            return this.actionDispatcher.dispatch(SaveModelAction.create());
        }
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
