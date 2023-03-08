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

import { CommonCommands, KeybindingContext, KeybindingContribution, KeybindingRegistry } from '@theia/core/lib/browser';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { Keybinding } from '@theia/core/lib/common/keybinding';
import { inject, injectable } from 'inversify';
import { GLSPDiagramCommands } from './glsp-diagram-commands';
import { getDiagramWidget } from './glsp-diagram-widget';

@injectable()
export class GLSPDiagramKeybindingContext implements KeybindingContext {
    static readonly ID = 'glsp.diagram.keybinding.context';
    @inject(FrontendApplication) protected readonly application: FrontendApplication;

    id = GLSPDiagramKeybindingContext.ID;

    isEnabled(_arg?: Keybinding): boolean {
        return !!getDiagramWidget(this.application.shell);
    }
}

@injectable()
export class GLSPDiagramKeybindingContribution implements KeybindingContribution {
    @inject(GLSPDiagramKeybindingContext) protected readonly diagramKeybindingContext: GLSPDiagramKeybindingContext;

    registerKeybindings(registry: KeybindingRegistry): void {
        [
            {
                command: GLSPDiagramCommands.CENTER,
                context: this.diagramKeybindingContext.id,
                keybinding: 'alt+c'
            },
            {
                command: GLSPDiagramCommands.FIT,
                context: this.diagramKeybindingContext.id,
                keybinding: 'alt+f'
            },
            {
                command: GLSPDiagramCommands.EXPORT,
                context: this.diagramKeybindingContext.id,
                keybinding: 'alt+e'
            },
            {
                command: GLSPDiagramCommands.LAYOUT,
                context: this.diagramKeybindingContext.id,
                keybinding: 'alt+l'
            },
            {
                command: GLSPDiagramCommands.SELECT_ALL,
                context: this.diagramKeybindingContext.id,
                keybinding: 'ctrlcmd+a'
            },
            {
                command: CommonCommands.UNDO.id,
                context: this.diagramKeybindingContext.id,
                keybinding: 'ctrlcmd+z'
            },
            {
                command: CommonCommands.REDO.id,
                context: this.diagramKeybindingContext.id,
                keybinding: 'ctrlcmd+shift+z'
            }
        ].forEach(binding => {
            registry.registerKeybinding(binding);
        });
    }
}
