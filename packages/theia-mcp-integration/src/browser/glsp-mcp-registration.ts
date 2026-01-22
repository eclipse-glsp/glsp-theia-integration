/********************************************************************************
 * Copyright (c) 2025 EclipseSource and others.
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
import { getMcpServerResult } from '@eclipse-glsp/client';
import { GLSPClientContribution } from '@eclipse-glsp/theia-integration';
import { MCPFrontendService } from '@theia/ai-mcp';
import { ContributionProvider, MaybePromise } from '@theia/core';
import { FrontendApplication, FrontendApplicationContribution } from '@theia/core/lib/browser';
import { inject, injectable, named } from '@theia/core/shared/inversify';

@injectable()
export class GlspMcpRegistration implements FrontendApplicationContribution {
    @inject(ContributionProvider)
    @named(GLSPClientContribution)
    protected readonly glspClientContributions: ContributionProvider<GLSPClientContribution>;

    @inject(MCPFrontendService) protected mcpService: MCPFrontendService;

    onStart(app: FrontendApplication): MaybePromise<void> {
        this.glspClientContributions.getContributions().forEach(contribution => this.registerMcpServer(contribution));
    }

    protected async registerMcpServer(contribution: GLSPClientContribution): Promise<void> {
        // the contribution only resolves the client once it is started and initialized
        const glspClient = await contribution.glspClient;
        const mcpServer = getMcpServerResult(glspClient.initializeResult);
        if (mcpServer) {
            this.mcpService.addOrUpdateServer({ name: mcpServer.name, serverUrl: mcpServer.url });
        }
    }
}
