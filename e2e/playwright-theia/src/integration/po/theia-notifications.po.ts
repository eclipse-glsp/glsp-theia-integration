/********************************************************************************
 * Copyright (c) 2024-2026 EclipseSource and others.
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

import { TheiaApp, TheiaPageObject } from '@theia/playwright';

/**
 * Page Object for notifications.
 */
export class TheiaNotifications extends TheiaPageObject {
    readonly locator;

    constructor(
        app: TheiaApp,
        protected readonly selector = '.theia-notifications-container'
    ) {
        super(app);
        this.locator = this.page.locator(this.selector);
    }

    async closeAll(): Promise<void> {
        for await (const clear of await this.locator.locator('[title="Clear"]').all()) {
            if (await clear.isVisible()) {
                await clear.click();
            }
        }
    }
}
