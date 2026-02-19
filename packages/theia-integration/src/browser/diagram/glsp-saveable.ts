/********************************************************************************
 * Copyright (c) 2019-2025 EclipseSource and others.
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
import { Deferred, DirtyStateChange, EditorContextService, GLSPActionDispatcher, SaveModelAction } from '@eclipse-glsp/client';
import { Disposable, DisposableCollection, Emitter, Event } from '@theia/core';
import { Saveable } from '@theia/core/lib/browser';

/**
 * The default {@link Saveable} implementation of the `GLSPDiagramWidget`.
 * Since Theia 1.50.0, handling the autosave functionality is done by a central `SaveableService` and is no longer the responsibility of the
 * {@link Saveable} itself.
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

    protected pendingSave?: Deferred<void>;
    // The timeout in ms after which a pending save operation will be rejected if the server does not respond with a save confirmation
    // i.e dirty state change
    protected saveTimeout = 2000;

    constructor(
        protected actionDispatcher: GLSPActionDispatcher,
        protected editorContextService: EditorContextService
    ) {
        this.toDispose.pushAll([
            this.editorContextService.onDirtyStateChanged(change => this.handleDirtyStateChange(change)),
            this.onDirtyChangedEmitter
        ]);
    }

    protected handleDirtyStateChange(change: DirtyStateChange): void {
        this.onDirtyChangedEmitter.fire(undefined);
        if (change.reason === 'save' && this.pendingSave) {
            this.pendingSave.resolve();
        }

        if (change.isDirty) {
            this.onContentChangedEmitter.fire(undefined);
        }
    }

    /**
     * Saves the current diagram by dispatching a `SaveModelAction` to the GLSP server.
     * The save operation is asynchronous and the method returns a promise that resolves once the save operation is completed.
     * or is rejected if the {@link saveTimeout} is reached before the server responds with a save confirmation.
     * Note: if the diagram is currently not dirty this is a no-op and no save action is dispatched.
     * @returns A promise that resolves once the save client-server roundtrip is completed i.e.
     * the server has responded with a save confirmation in the form of `SetDirtyStateAction`
     */
    save(): Promise<void> {
        if (this.editorContextService.isDirty) {
            this.actionDispatcher.dispatch(SaveModelAction.create());
            this.pendingSave = new Deferred<void>();
            const savePromise = this.pendingSave.promise.then(() => (this.pendingSave = undefined));

            const timeoutPromise = new Promise<void>((_, reject) =>
                setTimeout(() => {
                    if (this.pendingSave && this.pendingSave.state === 'unresolved') {
                        this.pendingSave.resolve();
                        this.pendingSave = undefined;
                        reject(new Error('Save operation timed out'));
                    }
                }, this.saveTimeout)
            );

            return Promise.race([savePromise, timeoutPromise]).catch(error => {
                this.pendingSave = undefined;
                throw error;
            });
        }
        return Promise.resolve();
    }

    get dirty(): boolean {
        if (this.pendingSave) {
            return false;
        }
        return this.editorContextService.isDirty;
    }

    dispose(): void {
        this.toDispose.dispose();
    }
}
