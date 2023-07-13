/********************************************************************************
 * Copyright (c) 2017-2018 TypeFox and others.
 * Modifications: (c) 2019-2023 EclipseSource and others.
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
// based on: https://github.com/eclipse-sprotty/sprotty-theia/blob/v0.12.0/src/sprotty/theia-diagram-server.ts

import {
    Action,
    ActionHandlerRegistry,
    ActionMessage,
    ComputedBoundsAction,
    DiagramServerProxy,
    EndProgressAction,
    ExportSvgAction,
    ICommand,
    registerDefaultGLSPServerActions,
    RequestModelAction,
    ServerMessageAction,
    ServerStatusAction,
    SetDirtyStateAction,
    SetEditModeAction,
    SourceUriAware,
    StartProgressAction,
    UpdateProgressAction
} from '@eclipse-glsp/client';
import { Emitter, Event } from '@theia/core/lib/common';
import { injectable } from '@theia/core/shared/inversify';
import { TheiaGLSPConnector } from './theia-glsp-connector';

const receivedFromServerProperty = '__receivedFromServer';

@injectable()
export class GLSPTheiaDiagramServer extends DiagramServerProxy implements DirtyStateNotifier, SourceUriAware {
    readonly dirtyStateChangeEmitter: Emitter<DirtyState> = new Emitter<DirtyState>();

    protected dirtyState: DirtyState = { isDirty: false };

    protected _sourceUri: string;

    protected _connector?: TheiaGLSPConnector;

    connect(connector: TheiaGLSPConnector): void {
        this._connector = connector;
    }

    disconnect(): void {
        // empty per default
    }

    get sourceURI(): string {
        return this._sourceUri;
    }

    override initialize(registry: ActionHandlerRegistry): void {
        registerDefaultGLSPServerActions(registry, this);
        registry.register(SetDirtyStateAction.KIND, this);
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

    override handle(action: Action): void | ICommand | Action {
        if (RequestModelAction.is(action)) {
            this._sourceUri = action.options!.sourceUri as string;
        }
        return super.handle(action);
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
        if (StartProgressAction.is(action)) {
            return this.handleStartProgress(action);
        }
        if (UpdateProgressAction.is(action)) {
            return this.handleUpdateProgress(action);
        }
        if (EndProgressAction.is(action)) {
            return this.handleEndProgress(action);
        }
        return super.handleLocally(action);
    }

    override handleExportSvgAction(action: ExportSvgAction): boolean {
        this.connector.save(this.sourceURI, action);
        return false;
    }

    protected override handleComputedBounds(_action: ComputedBoundsAction): boolean {
        return true;
    }

    protected override handleServerStateAction(status: ServerStatusAction): boolean {
        this.connector.showStatus(this.clientId, status);
        return false;
    }

    protected handleSetEditModeAction(action: SetEditModeAction): boolean {
        return (action as any)[receivedFromServerProperty] !== true;
    }

    protected handleServerMessageAction(status: ServerMessageAction): boolean {
        this.connector.showMessage(this.clientId, status);
        return false;
    }

    protected handleStartProgress(action: StartProgressAction): boolean {
        this.connector.startProgress(this.clientId, action);
        return false;
    }

    protected handleUpdateProgress(action: UpdateProgressAction): boolean {
        this.connector.updateProgress(this.clientId, action);
        return false;
    }

    protected handleEndProgress(action: EndProgressAction): boolean {
        this.connector.endProgress(this.clientId, action);
        return false;
    }

    sendMessage(message: ActionMessage): void {
        this.connector.sendMessage(message);
    }

    /**
     * made public
     */
    override messageReceived(message: ActionMessage): void {
        super.messageReceived(message);
    }

    get connector(): TheiaGLSPConnector {
        if (!this._connector) {
            throw Error('TheiaDiagramServer is not connected.');
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
