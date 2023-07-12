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
import {
    bindAsService,
    configureActionHandler,
    ContainerConfiguration,
    ExternalSourceModelChangedHandler,
    InstanceRegistry,
    NavigateToExternalTargetAction,
    TYPES
} from '@eclipse-glsp/client';
import { Container, inject, injectable, multiInject, optional } from '@theia/core/shared/inversify';
import { TheiaContextMenuService } from '../theia-glsp-context-menu-service';
import { TheiaNavigateToExternalTargetHandler } from '../theia-navigate-to-external-target-handler';
import { TheiaSourceModelChangedHandler } from '../theia-source-model-changed-handler';
import { connectTheiaContextMenuService, TheiaContextMenuServiceFactory } from './theia-context-menu-service';
import { TheiaGLSPSelectionForwarder } from './theia-glsp-selection-forwarder';
import { connectTheiaMarkerManager, TheiaMarkerManager, TheiaMarkerManagerFactory } from './theia-marker-manager';

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
     * @param widgetId The id of the corresponding diagram widget
     * @param containerConfiguration Additional container configuration.
     *  Typically modules that are scoped to the Theia application context and  should be loaded on top of the generic diagram modules.
     */
    createContainer(widgetId: string, ...containerConfiguration: ContainerConfiguration): Container;
    /** The id of the corresponding `DiagramWidget` */
    readonly diagramType: string;
}

/**
 * Registry for querying all configured {@link DiagramConfiguration}s.
 */
@injectable()
export class DiagramConfigurationRegistry extends InstanceRegistry<DiagramConfiguration> {
    constructor(@multiInject(DiagramConfiguration) @optional() diagramConfigs: DiagramConfiguration[]) {
        super();
        diagramConfigs.forEach(c => this.register(c.diagramType, c));
    }
}

/**
 * Default {@link DiagramConfiguration} implementation for GLSP diagrams.
 * The created diagram container is a child container of the main Theia DI container.
 * This means that services that are configured inside of the diagram container also have access (i.e. can inject)
 * services from the main Theia DI container.
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

    createContainer(widgetId: string, ...containerConfiguration: ContainerConfiguration): Container {
        const container = this.diagramContainerFactory();
        this.configureContainer(container, widgetId, ...containerConfiguration);
        this.initializeContainer(container);
        return container;
    }

    /**
     * Configures the freshly created DI container by loading the diagram specific modules and services.
     * Theia specific bindings can be either be loaded as additional {@link ContainerConfiguration} or
     *  setup using the {@link configure} method.
     * @param container The newly created DI container
     * @param widgetId  The id of the corresponding diagram widget.
     * @param containerConfiguration Optional additional container configuration
     */
    abstract configureContainer(container: Container, widgetId: string, ...containerConfiguration: ContainerConfiguration): void;

    protected initializeContainer(container: Container): void {
        bindAsService(container, TYPES.ISelectionListener, TheiaGLSPSelectionForwarder);

        container.bind(ExternalSourceModelChangedHandler).toService(TheiaSourceModelChangedHandler);
        configureActionHandler(container, NavigateToExternalTargetAction.KIND, TheiaNavigateToExternalTargetHandler);
        connectTheiaContextMenuService(container, this.contextMenuServiceFactory);
        connectTheiaMarkerManager(container, this.theiaMarkerManager, this.diagramType);
    }
}

export function configureDiagramServer<T>(container: Container, server: { new (...args: any[]): T }): void {
    container.bind(server).toSelf().inSingletonScope();
    container.bind(TYPES.ModelSource).toService(server);
}
