/********************************************************************************
 * Copyright (c) 2023-2026 Business Informatics Group (TU Wien) and others.
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

import { Page } from '@playwright/test';
import { TheiaApp, TheiaEditor, TheiaWorkspace } from '@theia/playwright';
import type { TheiaIntegrationOptions } from '../theia.options';
import { TheiaNotifications } from './theia-notifications.po';

/**
 * App for accessing the [Theia Page Objects](https://www.npmjs.com/package/@theia/playwright).
 */
export class TheiaGLSPApp extends TheiaApp {
    protected _options: TheiaIntegrationOptions;

    notifications: TheiaNotifications;

    get options(): TheiaIntegrationOptions {
        return this._options;
    }

    public constructor(page: Page, workspace: TheiaWorkspace, isElectron: boolean) {
        super(page, workspace, isElectron);
        this.notifications = this.createNotifications();
    }

    initialize(options: TheiaIntegrationOptions): void {
        this._options = options;
    }

    protected createNotifications(): TheiaNotifications {
        return new TheiaNotifications(this);
    }

    override openEditor<T extends TheiaEditor>(
        filePath: string,
        editorFactory: new (editorFilePath: string, app: TheiaGLSPApp) => T,
        editorName?: string | undefined,
        expectFileNodes?: boolean | undefined
    ): Promise<T> {
        return super.openEditor(filePath, editorFactory as new (f: string, a: TheiaApp) => T, editorName, expectFileNodes);
    }
}
