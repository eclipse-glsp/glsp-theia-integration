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
import { applyEnvDefaults, baseConfig, loadEnv } from '@eclipse-glsp-examples/workflow-e2e/configs';
import type { GLSPPlaywrightOptions } from '@eclipse-glsp/playwright';
import { type PlaywrightTestConfig, type ReporterDescription } from '@playwright/test';
import * as path from 'path';
import { buildProjects } from './configs/project.config';
import { buildWebServers } from './configs/webserver.config';

// The `.env` is shared by every e2e package in this repository, so it lives one level up.
loadEnv(path.resolve(__dirname, '..'));
applyEnvDefaults();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const config: PlaywrightTestConfig<GLSPPlaywrightOptions> = {
    ...baseConfig,
    // Summarize the run in the GitHub Actions job overview. Added here rather than in `baseConfig`,
    // so that consumers of the shared config do not need this CI-only reporter installed.
    reporter: process.env.CI
        ? [...(baseConfig.reporter as ReporterDescription[]), ['@estruyf/github-actions-reporter']]
        : baseConfig.reporter,
    testDir: 'lib/tests',
    webServer: buildWebServers(__dirname),
    projects: buildProjects()
};

export default config;
