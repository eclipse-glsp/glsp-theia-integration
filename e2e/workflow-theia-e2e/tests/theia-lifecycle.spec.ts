/********************************************************************************
 * Copyright (c) 2026 EclipseSource and others.
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
import { expect, test } from '@eclipse-glsp/playwright';
import { TheiaIntegration, TheiaIntegrationOptions } from '@eclipse-glsp/playwright-theia';

test.describe('The Theia integration lifecycle', () => {
    test('closes the loader page and context without closing the fixture page', async ({ integration, page, browser }) => {
        const appPage = integration.page;
        const appContext = appPage.context();
        expect(appPage).not.toBe(page);
        expect(browser.contexts()).toContain(appContext);

        await integration.close();

        expect(appPage.isClosed()).toBe(true);
        expect(browser.contexts()).toEqual([page.context()]);
        expect(page.isClosed()).toBe(false);
        // The fixture also calls close during teardown.
        await expect(integration.close()).resolves.toBeUndefined();
    });

    test('can be closed before startup', async ({ playwright, browser, page, integrationOptions }) => {
        if (!TheiaIntegrationOptions.is(integrationOptions)) {
            throw new Error('Expected Theia integration options');
        }
        const integration = new TheiaIntegration({ playwright, browser, page }, integrationOptions);

        await expect(integration.close()).resolves.toBeUndefined();
        expect(page.isClosed()).toBe(false);
        expect(browser.contexts()).toEqual([page.context()]);
    });
});
