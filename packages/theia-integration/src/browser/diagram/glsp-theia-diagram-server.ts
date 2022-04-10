/********************************************************************************
 * Copyright (c) 2019-2022 EclipseSource and others.
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
    Action,
    ActionHandlerRegistry,
    ComputedBoundsAction,
    ExportSvgAction,
    registerDefaultGLSPServerActions,
    ServerMessageAction,
    SetDirtyStateAction,
    SetEditModeAction,
    SourceUriAware
} from '@eclipse-glsp/client';
import { Emitter, Event } from '@theia/core/lib/common';
import { injectable } from '@theia/core/shared/inversify';
import { TheiaDiagramServer } from 'sprotty-theia';
import { isTheiaGLSPConnector, TheiaGLSPConnector } from './theia-glsp-connector';

const receivedFromServerProperty = '__receivedFromServer';

@injectable()
export class GLSPTheiaDiagramServer extends TheiaDiagramServer implements DirtyStateNotifier, SourceUriAware {
    readonly dirtyStateChangeEmitter: Emitter<DirtyState> = new Emitter<DirtyState>();

    protected dirtyState: DirtyState = { isDirty: false };

    override initialize(registry: ActionHandlerRegistry): void {
        registerDefaultGLSPServerActions(registry, this);
        registry.register(SetDirtyStateAction.KIND, this);
    }

    public get sourceURI(): string {
        return this.sourceUri;
    }

    get onDirtyStateChange(): Event<DirtyState> {
        return this.dirtyStateChangeEmitter.event;
    }

    protected setDirty(dirty: boolean): void {
        if (dirty !== this.dirtyState.isDirty) {
            this.dirtyState = { isDirty: dirty };
            this.dirtyStateChangeEmitter.fire(this.dirtyState);
        }
    }

    override handleLocally(action: Action): boolean {
        if (SetDirtyStateAction.is(action)) {
            this.setDirty(action.isDirty);
            return false;
        }
        if (ServerMessageAction.is(action)) {
            return this.handleServerMessageAction(action);
        }
        if (SetEditModeAction.is(action)) {
            return this.handleSetEditModeAction(action);
        }
        return super.handleLocally(action);
    }

    override handleExportSvgAction(action: ExportSvgAction): boolean {
        this.connector.save(this.sourceUri, action);
        return false;
    }

    protected override handleComputedBounds(_action: ComputedBoundsAction): boolean {
        return true;
    }

    protected handleSetEditModeAction(action: SetEditModeAction): boolean {
        return (action as any)[receivedFromServerProperty] !== true;
    }

    protected handleServerMessageAction(status: ServerMessageAction): boolean {
        this.connector.showMessage(this.clientId, status);
        return false;
    }

    override get connector(): TheiaGLSPConnector {
        if (!this._connector) {
            throw Error('TheiaDiagramServer is not connected.');
        }
        if (!isTheiaGLSPConnector(this._connector)) {
            throw new Error('Connector needs to be a instance of "TheiaGLSPConnector');
        }
        return this._connector;
    }
}
export interface DirtyState {
    isDirty: boolean;
}

export interface DirtyStateNotifier {
    readonly onDirtyStateChange: Event<DirtyState>;
}

export namespace DirtyStateNotifier {
    export function is(arg: any): arg is DirtyStateNotifier {
        return !!arg && 'onDirtyStateChange' in arg;
    }
}
