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
import { bindAsService } from '@eclipse-glsp/client';
import { MenuContribution, MenuModelRegistry } from '@theia/core';
import { CommonCommands } from '@theia/core/lib/browser';
import { injectable, interfaces } from '@theia/core/shared/inversify';
import { TheiaGLSPContextMenu } from './theia-glsp-context-menu-service';

export function registerCopyPasteContextMenu(bind: interfaces.Bind): void {
    bindAsService(bind, MenuContribution, CopyPasteMenuContribution);
}

@injectable()
export class CopyPasteMenuContribution implements MenuContribution {
    static readonly COPY_PASTE = TheiaGLSPContextMenu.CONTEXT_MENU.concat('copy-paste');
    registerMenus(menus: MenuModelRegistry): void {
        menus.registerMenuAction(CopyPasteMenuContribution.COPY_PASTE, {
            commandId: CommonCommands.CUT.id,
            order: '0'
        });
        menus.registerMenuAction(CopyPasteMenuContribution.COPY_PASTE, {
            commandId: CommonCommands.COPY.id,
            order: '1'
        });
        menus.registerMenuAction(CopyPasteMenuContribution.COPY_PASTE, {
            commandId: CommonCommands.PASTE.id,
            order: '2'
        });
    }
}
