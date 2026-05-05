/********************************************************************************
 * Copyright (c) 2025-2026 EclipseSource and others.
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
import { ClientState, McpInitializeResult } from '@eclipse-glsp/protocol';
import { GLSPClientContribution } from '@eclipse-glsp/theia-integration';
import { MCPFrontendService, MCPServerManager } from '@theia/ai-mcp';
import { ContributionProvider, Disposable, DisposableCollection, MaybePromise, MessageService } from '@theia/core';
import { FrontendApplication, FrontendApplicationContribution } from '@theia/core/lib/browser';
import { ClipboardService } from '@theia/core/lib/browser/clipboard-service';
import { inject, injectable, named } from '@theia/core/shared/inversify';

@injectable()
export class GlspMcpRegistration implements FrontendApplicationContribution, Disposable {
    @inject(ContributionProvider)
    @named(GLSPClientContribution)
    protected readonly glspClientContributions: ContributionProvider<GLSPClientContribution>;

    @inject(MCPFrontendService) protected mcpService: MCPFrontendService;
    @inject(MCPServerManager) protected mcpServerManager: MCPServerManager;
    @inject(MessageService) protected messageService: MessageService;
    @inject(ClipboardService) protected clipboardService: ClipboardService;

    /**
     * Whether discovered GLSP MCP servers should be auto-started by Theia AI on registration.
     * Defaults to `true` so the GLSP MCP integration is immediately available to the agent;
     * override via `rebind(GlspMcpRegistration).to(YourSubclass)` for environments where
     * servers should be registered but kept off until the user starts them on-demand.
     */
    protected readonly autostart: boolean = true;

    /**
     * Aggregated cleanup — owns one inner {@link DisposableCollection} per registration. Dispose
     * triggers `removeServer` for every registration and drops the state-change subscriptions.
     */
    protected readonly toDispose = new DisposableCollection();

    onStart(app: FrontendApplication): MaybePromise<void> {
        this.glspClientContributions.getContributions().forEach(contribution => this.registerMcpServer(contribution));
    }

    onStop(): void {
        this.dispose();
    }

    /**
     * GLSP servers boot on a random port by default, so a registered URL is stale on the next IDE
     * launch. Drop our registrations on shutdown so the next session starts fresh.
     */
    dispose(): void {
        this.toDispose.dispose();
    }

    protected async registerMcpServer(contribution: GLSPClientContribution): Promise<void> {
        // The contribution only resolves the client once it is started and initialized.
        const glspClient = await contribution.glspClient;
        const mcpServer = McpInitializeResult.getServer(glspClient.initializeResult);
        if (!mcpServer) {
            return;
        }
        await this.mcpService.addOrUpdateServer({
            name: mcpServer.name,
            serverUrl: mcpServer.url,
            // Forward any auth/connection headers announced by the GLSP server.
            ...(mcpServer.headers && { headers: mcpServer.headers }),
            autostart: this.autostart
        });

        // Per-registration cleanup group. Disposing it removes the MCP server entry AND drops the
        // state-change subscription. Triggers either on definitive GLSP failure (state listener
        // self-disposes) or on extension dispose (parent collection cascades).
        const perRegistration = new DisposableCollection(
            Disposable.create(() => this.mcpServerManager.removeServer(mcpServer.name)),
            glspClient.onCurrentStateChanged(state => {
                if (state === ClientState.Stopped || state === ClientState.ServerError) {
                    perRegistration.dispose();
                }
            })
        );
        this.toDispose.push(perRegistration);

        if (this.autostart) {
            // Theia AI's MCPFrontendApplicationContribution only fires `autoStartServers` at frontend
            // startup or on preference changes — neither covers our programmatic registration path,
            // so the server would otherwise stay registered-but-stopped until the next IDE restart.
            // Trigger an explicit start so the GLSP MCP server is usable in the current session.
            try {
                await this.mcpService.startServer(mcpServer.name);
                this.notifyConnected(mcpServer.name, mcpServer.url, 'auto-started');
            } catch (err: unknown) {
                // Workspace-trust gates and other MCP startup conditions may surface here. The
                // `autostart: true` description we stored above ensures the server will be picked
                // up on the next startup once the blocking condition clears.
                console.warn(`Failed to auto-start GLSP MCP server '${mcpServer.name}':`, err);
            }
        } else {
            this.notifyConnected(mcpServer.name, mcpServer.url, 'auto-registered');
        }
    }

    /** Info notification with a `Copy URL` action; auto-dismisses after 10s. */
    protected notifyConnected(name: string, url: string, state: 'auto-started' | 'auto-registered'): void {
        const COPY_URL_ACTION = 'Copy URL';
        this.messageService.info(`MCP server '${name}' ${state} at ${url}`, { timeout: 10_000 }, COPY_URL_ACTION).then(action => {
            if (action === COPY_URL_ACTION) {
                this.clipboardService.writeText(url);
            }
        });
    }
}
