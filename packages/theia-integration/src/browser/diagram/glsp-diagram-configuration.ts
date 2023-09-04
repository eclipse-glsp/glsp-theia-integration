/********************************************************************************
 * Copyright (c) 2020-2023 EclipseSource and others.
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
import { ContainerConfiguration, IDiagramOptions, createDiagramOptionsModule } from '@eclipse-glsp/client';
import { Container, ContainerModule, inject, injectable } from '@theia/core/shared/inversify';
import { TheiaContextMenuService } from '../theia-glsp-context-menu-service';
import { THEIA_DEFAULT_MODULE_CONFIG } from './features/default-modules';
import { TheiaContextMenuServiceFactory, connectTheiaContextMenuService } from './theia-context-menu-service';
import { TheiaMarkerManager, TheiaMarkerManagerFactory, connectTheiaMarkerManager } from './theia-marker-manager';

export const DiagramContainerFactory = Symbol('DiagramContainerFactory');
/**
 * An injectable factory used to create the baseline diagram DI container for a new diagram widget.
 * The default factory simply creates a child container from the main Theia DI container.
 */
export type DiagramContainerFactory = () => Container;

export const DiagramConfiguration = Symbol('DiagramConfiguration');

/**
 * The `DiagramConfiguration` is responsible for creating and initializing a diagram container for a GLSP diagram widget.
 */
export interface DiagramConfiguration {
    /**
     * Creates a new diagram container for a widget with the given id and container configuration
     * @param options The diagram specific configuration options.
     * @param containerConfiguration Additional container configuration.
     *  Typically modules that are scoped to the Theia application context and  should be loaded on top of the generic diagram modules.
     */
    createContainer(options: IDiagramOptions, ...containerConfiguration: ContainerConfiguration): Container;
    /** The id of the corresponding `DiagramWidget` */
    readonly diagramType: string;
}
/**
 * Default {@link DiagramConfiguration} implementation for GLSP diagrams.
 * The created diagram container is a child container of the main Theia DI container.
 * This means that services that are configured inside of the diagram container also have access (i.e. can inject)
 * services from the main Theia DI container.
 *
 * (bound in Theia main DI container)
 */
@injectable()
export abstract class GLSPDiagramConfiguration implements DiagramConfiguration {
    @inject(TheiaContextMenuServiceFactory)
    protected readonly contextMenuServiceFactory: () => TheiaContextMenuService;
    @inject(TheiaMarkerManagerFactory)
    protected readonly theiaMarkerManager: () => TheiaMarkerManager;
    @inject(DiagramContainerFactory)
    protected readonly diagramContainerFactory: DiagramContainerFactory;

    abstract readonly diagramType: string;

    createContainer(options: IDiagramOptions): Container {
        const container = this.diagramContainerFactory();
        const diagramOptionsModule = this.createDiagramOptionsModule(options);
        this.configureContainer(container, diagramOptionsModule, ...this.getContainerConfiguration());
        this.initializeContainer(container);
        return container;
    }

    protected createDiagramOptionsModule(options: IDiagramOptions): ContainerModule {
        return createDiagramOptionsModule(options);
    }

    /**
     * Retrieves additional {@link ContainerConfiguration} for the diagram container.
     * Typically this composes a set of theia specific customization modules.
     * @returns the container configuration
     */
    protected getContainerConfiguration(): ContainerConfiguration {
        return [THEIA_DEFAULT_MODULE_CONFIG];
    }

    /**
     * Configures the freshly created DI container by loading the diagram specific modules and services.
     * Theia specific bindings can be either be loaded as additional {@link ContainerConfiguration} or
     *  setup using the {@link configure} method.
     * @param container The newly created DI container
     * @param containerConfiguration Optional additional container configuration
     */
    abstract configureContainer(container: Container, ...containerConfiguration: ContainerConfiguration): void;

    protected initializeContainer(container: Container): void {
        connectTheiaContextMenuService(container, this.contextMenuServiceFactory);
        connectTheiaMarkerManager(container, this.theiaMarkerManager, this.diagramType);
    }
}
