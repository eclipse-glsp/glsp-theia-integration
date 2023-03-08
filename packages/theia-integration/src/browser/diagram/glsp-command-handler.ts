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
import { Action, asArray, EditorContextService } from '@eclipse-glsp/client';
import { CommandHandler, MaybeArray } from '@theia/core';
import { ApplicationShell } from '@theia/core/lib/browser';
import { getDiagramWidget, GLSPDiagramWidget } from './glsp-diagram-widget';

export interface GLSPCommand {
    /**
     * Provider function for the set of {@link Action}s that should be dispatched on command execution
     * @param context The editor context of the currently active GLSP diagram
     * @returns An array of actions that should be dispatched
     */
    actions: (context: EditorContextService) => MaybeArray<Action>;
    /**
     * Optional function to control the enablement state of the command.
     * If not implemented, the command is enabled if a diagram widget is currently active
     * @param context The editor context of the currently active GLSP diagram
     * @returns `true` if the command should be enabled, `false` otherwise
     */
    isEnabled?: (context: EditorContextService) => boolean;
    /**
     * Optional function to control the visibility state of the command.
     * If not implemented, the command is visible if a diagram widget is currently active
     * Note that this function will not be called if {@link alwaysVisible} is set to `true`.
     * @param context The editor context of the currently active GLSP diagram
     * @returns `true` if the command should be visible, `false` otherwise
     */
    isVisible?: (context: EditorContextService) => boolean;
    /**
     * Optional flag to specify that a command should be always visible even
     * if no diagram widget is currently selected. Typically used for commands in global menus to render inactive menu entries rather than
     * empty menus.
     * If this option is set to `true` the {@link isVisible} function will be ignored.
     */
    alwaysVisible?: boolean;
    /**
     * Optional function to control the toggle state of the command.
     * If not implemented, the command is considered to be not toggleable
     * @param context The editor context of the currently active GLSP diagram
     * @returns `true` if the command should be toggled, `false` otherwise
     */
    isToggled?: (context: EditorContextService) => boolean;
}

/**
 * A reusable {@link CommandHandler} for simplified action dispatching in GLSP diagrams.
 */
export class GLSPCommandHandler implements CommandHandler {
    constructor(protected readonly shell: ApplicationShell, protected readonly command: GLSPCommand) {}

    async execute(): Promise<void> {
        if (this.isEnabled() && this.diagramWidget) {
            const actions = asArray(this.command.actions(this.diagramWidget.editorContext));
            return this.diagramWidget.actionDispatcher.dispatchAll(actions);
        }
    }

    get diagramWidget(): GLSPDiagramWidget | undefined {
        return getDiagramWidget(this.shell);
    }

    isEnabled(): boolean {
        return !!this.diagramWidget && (this.command.isEnabled?.(this.diagramWidget.editorContext) ?? true);
    }

    isVisible(): boolean {
        if (this.command.alwaysVisible) {
            return true;
        }
        return !!this.diagramWidget && (this.command.isVisible?.(this.diagramWidget.editorContext) ?? true);
    }

    isToggled(): boolean {
        return !!this.diagramWidget && (this.command.isToggled?.(this.diagramWidget.editorContext) ?? false);
    }
}
