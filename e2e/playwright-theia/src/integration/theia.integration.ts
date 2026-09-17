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

import { Locator, Page } from '@playwright/test';
import { TheiaAppLoader, TheiaWorkspace } from '@theia/playwright';
import type {
    DiagramShortcutIntegration,
    DiagramShortcuts,
    GLSPSemanticApp,
    IntegrationArgs,
    MarkerNavigator,
    MarkerNavigatorIntegration
} from '@eclipse-glsp/playwright';
import { ContextMenuIntegration, hostDiagramShortcuts, Integration, SVGMetadataUtils } from '@eclipse-glsp/playwright';
import { TheiaMarkerNavigator } from './theia-keybindings';
import { TheiaGLSPApp } from './po/theia-glsp-app.po';
import { TheiaGLSPEditor } from './po/theia-glsp-editor.po';
import { TheiaIntegrationConfig, TheiaIntegrationOptions } from './theia.options';

/**
 * The {@link TheiaIntegration} provides the glue code for working
 * with the Theia version of the GLSP-Client.
 */
export class TheiaIntegration
    extends Integration
    implements ContextMenuIntegration, DiagramShortcutIntegration, MarkerNavigatorIntegration
{
    protected theiaApp: TheiaGLSPApp;

    readonly diagramShortcuts: DiagramShortcuts = hostDiagramShortcuts;

    override get page(): Page {
        return this.theiaApp.page;
    }

    get contextMenuLocator(): Locator {
        return this.page.locator('body > .lm-Widget.lm-Menu');
    }

    constructor(
        args: IntegrationArgs,
        protected readonly options: TheiaIntegrationOptions
    ) {
        super(args, 'Theia');
    }

    /**
     * Theia rebinds the marker navigation keys, so it contributes its own navigator.
     */
    createMarkerNavigator(app: GLSPSemanticApp): MarkerNavigator {
        return new TheiaMarkerNavigator(app);
    }

    protected override async launch(): Promise<void> {
        const ws = new TheiaWorkspace(this.options.workspace ? [this.options.workspace] : undefined);
        this.theiaApp = await TheiaAppLoader.load(this.args, ws, TheiaGLSPApp as any);
        this.theiaApp.initialize(this.options);
    }

    protected override async afterLaunch(): Promise<void> {
        if (this.options.file) {
            await this.theiaApp.openEditor(this.options.file, TheiaGLSPEditor);
            await this.assertMetadataAPI();
            await this.theiaApp.notifications.closeAll();

            const selector = `${SVGMetadataUtils.typeAttrOf('graph')} svg.sprotty-graph > g`;
            await this.page.waitForSelector(selector);
            // Reset mouse state
            await this.page.click(selector, { force: true });
        }
    }
}

/**
 * Creates {@link TheiaIntegrationOptions} for use as the `integrationOptions` test option.
 *
 * The returned options carry the factory that the `integration` fixture uses to instantiate
 * the {@link TheiaIntegration}, which is how this integration plugs in without the core
 * framework having to import it.
 *
 * **Usage**
 *
 * ```ts
 * const integrationOptions = defineTheiaIntegration({
 *     url: 'http://localhost:3000',
 *     widgetId: 'workflow-diagram'
 * });
 * ```
 *
 * @param config Theia specific configuration
 * @returns Options carrying the factory for the {@link TheiaIntegration}
 */
export function defineTheiaIntegration(config: TheiaIntegrationConfig): TheiaIntegrationOptions {
    return {
        ...config,
        type: 'Theia',
        integrationFactory: (args, options) => new TheiaIntegration(args, options)
    };
}
