/********************************************************************************
 * Copyright (c) 2019 EclipseSource and others.
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
import { ContributionProvider, ILogger } from "@theia/core/lib/common";
import { MessagingService } from "@theia/core/lib/node/messaging/messaging-service";
import { inject, injectable, named } from "inversify";

import { GLSPContribution } from "../common";
import { GLSPServerContribution } from "./glsp-server-contribution";

@injectable()
export class GLSPBackendContribution implements MessagingService.Contribution, GLSPContribution.Service {
    @inject(ILogger) @named('glsp')
    protected readonly logger: ILogger;

    @inject(ContributionProvider) @named(GLSPServerContribution)
    protected readonly contributors: ContributionProvider<GLSPServerContribution>;

    protected nextId: number = 1;
    protected readonly sessions = new Map<string, any>();

    async create(contributionId: string, startParameters: any): Promise<string> {
        const id = this.nextId;
        this.nextId++;
        const sessionId = String(id);
        this.sessions.set(sessionId, startParameters);
        return sessionId;
    }

    async destroy(sessionId: string): Promise<void> {
        this.sessions.delete(sessionId);
    }

    configure(service: MessagingService): void {
        for (const contribution of this.contributors.getContributions()) {
            const path = GLSPContribution.getPath(contribution);
            service.forward(path, async ({ id }: { id: string }, connection) => {
                try {
                    const parameters = this.sessions.get(id);
                    connection.onClose(() => this.destroy(id));
                    await contribution.start(connection, { sessionId: id, parameters });
                } catch (e) {
                    this.logger.error(`Error occurred while starting glsp contribution. ${path}.`, e);
                }
            });
        }
    }
}
