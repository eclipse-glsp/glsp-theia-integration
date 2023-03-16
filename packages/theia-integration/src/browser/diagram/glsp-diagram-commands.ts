/********************************************************************************
 * Copyright (c) 2017-2018 TypeFox and others.
 * Modifications: (c) 2023 EclipseSource and others.
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
// based on: https://github.com/eclipse-sprotty/sprotty-theia/blob/v0.12.0/src/theia/diagram-commands.ts
import {
    CenterAction,
    FitToScreenAction,
    LayoutOperation,
    RedoAction,
    RequestExportSvgAction,
    SelectAllAction,
    UndoAction
} from '@eclipse-glsp/client';
import { ApplicationShell, CommonCommands } from '@theia/core/lib/browser';
import { CommandContribution, CommandRegistry, MAIN_MENU_BAR, MenuContribution, MenuModelRegistry, MenuPath } from '@theia/core/lib/common';
import { inject, injectable } from 'inversify';
import { GLSPCommandHandler } from './glsp-command-handler';

export namespace GLSPDiagramCommands {
    export const CENTER = 'glsp.diagram:center';
    export const FIT = 'glsp.diagram:fit';
    export const EXPORT = 'glsp.diagram:export';
    export const SELECT_ALL = 'glsp.diagram.selectAll';
    export const DELETE = 'glsp.diagram.delete';
    export const LAYOUT = 'glsp.diagram.layout';
}

export namespace GLSPDiagramMenus {
    export const DIAGRAM: MenuPath = MAIN_MENU_BAR.concat('3_glsp_diagram');
}

@injectable()
export class GLSPDiagramMenuContribution implements MenuContribution {
    registerMenus(registry: MenuModelRegistry): void {
        registry.registerSubmenu(GLSPDiagramMenus.DIAGRAM, 'Diagram');

        registry.registerMenuAction(GLSPDiagramMenus.DIAGRAM, {
            commandId: GLSPDiagramCommands.CENTER
        });
        registry.registerMenuAction(GLSPDiagramMenus.DIAGRAM, {
            commandId: GLSPDiagramCommands.FIT
        });
        registry.registerMenuAction(GLSPDiagramMenus.DIAGRAM, {
            commandId: GLSPDiagramCommands.EXPORT
        });
        registry.registerMenuAction(GLSPDiagramMenus.DIAGRAM, {
            commandId: GLSPDiagramCommands.LAYOUT
        });
        registry.registerMenuAction(GLSPDiagramMenus.DIAGRAM, {
            commandId: GLSPDiagramCommands.SELECT_ALL
        });
    }
}

@injectable()
export class GLSPDiagramCommandContribution implements CommandContribution {
    @inject(ApplicationShell)
    protected readonly shell: ApplicationShell;

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand({
            id: GLSPDiagramCommands.CENTER,
            label: 'Center'
        });
        registry.registerCommand({
            id: GLSPDiagramCommands.FIT,
            label: 'Fit to screen'
        });
        registry.registerCommand({
            id: GLSPDiagramCommands.EXPORT,
            label: 'Export'
        });
        registry.registerCommand({
            id: GLSPDiagramCommands.LAYOUT,
            label: 'Layout'
        });
        registry.registerCommand({
            id: GLSPDiagramCommands.SELECT_ALL,
            label: 'Select all'
        });

        registry.registerHandler(
            GLSPDiagramCommands.CENTER,
            new GLSPCommandHandler(this.shell, { actions: () => CenterAction.create([]), alwaysVisible: true })
        );
        registry.registerHandler(
            GLSPDiagramCommands.FIT,
            new GLSPCommandHandler(this.shell, { actions: () => FitToScreenAction.create([]), alwaysVisible: true })
        );
        registry.registerHandler(
            GLSPDiagramCommands.EXPORT,
            new GLSPCommandHandler(this.shell, { actions: () => RequestExportSvgAction.create(), alwaysVisible: true })
        );
        registry.registerHandler(
            GLSPDiagramCommands.LAYOUT,
            new GLSPCommandHandler(this.shell, { actions: () => LayoutOperation.create(), alwaysVisible: true })
        );
        registry.registerHandler(
            GLSPDiagramCommands.SELECT_ALL,
            new GLSPCommandHandler(this.shell, { actions: () => SelectAllAction.create(true), alwaysVisible: true })
        );
        registry.registerHandler(
            CommonCommands.UNDO.id,
            new GLSPCommandHandler(this.shell, { actions: () => UndoAction.create(), alwaysVisible: true })
        );
        registry.registerHandler(
            CommonCommands.REDO.id,
            new GLSPCommandHandler(this.shell, { actions: () => RedoAction.create(), alwaysVisible: true })
        );
    }
}
