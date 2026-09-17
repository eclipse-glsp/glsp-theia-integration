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

import { normalizeId, TheiaEditor } from '@theia/playwright';
import type { TheiaGLSPApp } from './theia-glsp-app.po';

/**
 * Custom Page Object for the Theia editor using the widget id of the GLSP editor
 * to locate the correct editor in Theia.
 */
export class TheiaGLSPEditor extends TheiaEditor {
    constructor(filePath: string, app: TheiaGLSPApp) {
        // shell-tab-code-editor-opener:file:///c%3A/Users/user/AppData/Local/Temp/cloud-ws-JBUhb6/sample.txt:1
        // code-editor-opener:file:///c%3A/Users/user/AppData/Local/Temp/cloud-ws-JBUhb6/sample.txt:1
        super(
            {
                tabSelector: normalizeId(
                    `#shell-tab-${app.options.widgetId}:${app.workspace.pathAsUrl(filePath)}
                    )}:1`
                ),
                viewSelector: normalizeId(`#${app.options.widgetId}:${app.workspace.pathAsUrl(filePath)}`)
            },
            app
        );
    }
}
