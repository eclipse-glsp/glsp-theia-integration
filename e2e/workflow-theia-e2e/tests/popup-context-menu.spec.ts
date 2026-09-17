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
import { expect } from '@eclipse-glsp/playwright';
import { assertPopup, expectedManualPopupText, manualLabel, TaskManual, test } from '@eclipse-glsp-examples/workflow-e2e';

// Closing the popup through the context menu is only reachable in Theia, the only integration
// that provides a context menu.
test.describe('The popup', () => {
    test.describe('should be closed on', () => {
        test('context menu', async ({ workflow: { app, glspServer } }) => {
            await assertPopup(app, manualLabel, TaskManual, expectedManualPopupText(glspServer));

            await app.contextMenu.open();
            await app.popup.waitForHidden();

            await expect(app.popup.locate()).toBeHidden();
        });
    });
});
