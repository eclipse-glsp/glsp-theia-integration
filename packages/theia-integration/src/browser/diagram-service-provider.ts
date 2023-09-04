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
import { ContributionProvider } from '@theia/core';
import { inject, injectable, named } from '@theia/core/shared/inversify';
import { DiagramWidgetFactory } from './diagram/diagram-widget-factory';
import { DiagramConfiguration } from './diagram/glsp-diagram-configuration';
import { GLSPClientContribution } from './glsp-client-contribution';

/**
 * Provides lookup methods to diagram specific services (i.e. services that are associated with
 * a specific diagram language implementation) via the `diagramType` and/or `contributionId`
 */
@injectable()
export class DiagramServiceProvider {
    @inject(ContributionProvider)
    @named(GLSPClientContribution)
    protected readonly glspClientContributions: ContributionProvider<GLSPClientContribution>;

    @inject(ContributionProvider)
    @named(DiagramWidgetFactory)
    protected readonly widgetFactoryContributions: ContributionProvider<DiagramWidgetFactory>;

    @inject(ContributionProvider)
    @named(DiagramConfiguration)
    protected readonly diagramConfigurationContribution: ContributionProvider<DiagramConfiguration>;

    /**
     * Retrieve the {@link DiagramWidgetFactory} that is configured for the given diagramType.
     * @param diagramType The diagramType of the target widget factory.
     * @throws An error if no `DiagramWidgetFactory` could be found for the given diagram type
     * @returns the corresponding `DiagramWidgetFactory`
     */
    getDiagramWidgetFactory(diagramType: string): DiagramWidgetFactory {
        const result = this.findDiagramWidgetFactory(diagramType);
        if (!result) {
            throw new Error(`No GLSPDiagramWidgetFactory is registered for diagramType: ${diagramType}!`);
        }
        return result;
    }

    /**
     * Look up the {@link DiagramWidgetFactory} that is configured for the given diagramType(if any).
     * @param diagramType The diagramType of the target widget factory.
     * @returns the corresponding `DiagramWidgetFactory` or `undefined` if no widget factory is configured for the given type
     */
    findDiagramWidgetFactory(diagramType: string): DiagramWidgetFactory | undefined {
        return this.widgetFactoryContributions.getContributions().find(contribution => contribution.diagramType === diagramType);
    }

    /**
     * Retrieve the {@link DiagramConfiguration} that is configured for the given diagramType.
     * @param diagramType The diagramType of the target diagram configuration.
     * @throws An error if no `DiagramConfiguration` could be found for the given diagram type
     * @returns the corresponding `DiagramConfiguration`
     */
    getDiagramConfiguration(diagramType: string): DiagramConfiguration {
        const result = this.findDiagramConfiguration(diagramType);
        if (!result) {
            throw new Error(`No DiagramConfiguration is registered for diagramType: ${diagramType}!`);
        }
        return result;
    }

    /**
     * Look up the {@link DiagramWidgetFactory} that is configured for the given diagramType(if any).
     * @param diagramType The diagramType of the target diagram configuration.
     * @returns the corresponding `DiagramConfiguration` or `undefined` if no diagram configuration is configured for the given type
     */
    findDiagramConfiguration(diagramType: string): DiagramConfiguration | undefined {
        return this.diagramConfigurationContribution.getContributions().find(contribution => contribution.diagramType === diagramType);
    }

    /**
     * Retrieve the {@link DiagramConfiguration} that is configured for the given contributionId.
     * @param contributionId The id of the target contribution.
     * @throws An error if no `GLSPClientContribution` could be found for the given diagram type
     * @returns the corresponding `GLSPClientContribution`
     */
    getGLSPClientContribution(contributionId: string): GLSPClientContribution {
        const result = this.findGLSPClientContribution(contributionId);
        if (!result) {
            throw new Error(`No GLSPClientContribution is registered for diagramType: ${contributionId}!`);
        }
        return result;
    }

    /**
     * Look up the {@link GLSPClientContribution} that is configured for the given  contribution Id (if any).
     * @param contributionId The contributionId of the target contribution
     * @returns the corresponding `GLSPClientContribution` or `undefined` if no client contribution is configured for the given type
     */
    findGLSPClientContribution(contributionId: string): GLSPClientContribution | undefined {
        return this.glspClientContributions.getContributions().find(contribution => contribution.id === contributionId);
    }
}
