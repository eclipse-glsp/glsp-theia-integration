/********************************************************************************
 * Copyright (c) 2019-2023 EclipseSource and others.
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
import { GLSPClient } from '@eclipse-glsp/client';
import { ContributionProvider } from '@theia/core';
import { inject, injectable, named } from '@theia/core/shared/inversify';
import { GLSPClientContribution } from './glsp-client-contribution';

/**
 * Provides lookup methods to retrieve a glsp client (or its contribution) via id
 */
@injectable()
export class GLSPClientProvider {
    @inject(ContributionProvider)
    @named(GLSPClientContribution)
    protected readonly contributors: ContributionProvider<GLSPClientContribution>;

    /**
     * Look up the {@link GLSPClient} that is configured for the contribution Id (if any).
     * @param contributionId The contributionId of the target client
     * @returns the corresponding `GLSPClient` or `undefined` if no client is configured for the given type
     */
    async getGLSPClient(contributionId: string): Promise<GLSPClient | undefined> {
        return this.getGLSPClientContribution(contributionId)?.glspClient;
    }

    /**
     * Look up the {@link GLSPClientContribution} that is configured for the given  contribution Id (if any).
     * @param contributionId The contributionId of the target contribution
     * @returns the corresponding `GLSPClientContribution` or `undefined` if no client contribution is configured for the given type
     */
    getGLSPClientContribution(contributionId: string): GLSPClientContribution | undefined {
        return this.contributors.getContributions().find(contribution => contribution.id === contributionId);
    }
}
