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
import { getUrl } from '@eclipse-glsp-examples/workflow-e2e/configs';
import type { GLSPPlaywrightOptions } from '@eclipse-glsp/playwright';
import { defineTheiaIntegration } from '@eclipse-glsp/playwright-theia';
import { PlaywrightTestOptions, PlaywrightWorkerOptions, Project, devices } from '@playwright/test';
import { THEIA_DEFAULT_PORT } from './env';

export type ProjectName = 'theia';

const projectDevices = devices['Desktop Chrome'];

/**
 * The Theia integration projects.
 *
 * Takes the project list as a parameter so that an additional target (e.g. the Electron
 * application) is a new entry rather than a restructuring of this function.
 */
export function buildProjects(
    activeProjects: ProjectName[] = ['theia']
): Project<PlaywrightTestOptions & GLSPPlaywrightOptions, PlaywrightWorkerOptions>[] {
    return activeProjects.map(name => {
        const integrationOptions = defineTheiaIntegration({
            url: getUrl('THEIA_PORT', '', THEIA_DEFAULT_PORT),
            widgetId: 'workflow-diagram',
            workspace: '../../examples/workspace',
            file: 'example1.wf'
        });

        return {
            name,
            timeout: 60 * 1000,
            testDir: 'lib/tests',
            testMatch: ['**/*.spec.js'],
            use: {
                ...projectDevices,
                baseURL: integrationOptions.url,
                integrationOptions
            }
        };
    });
}
