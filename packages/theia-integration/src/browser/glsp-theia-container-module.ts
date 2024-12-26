/********************************************************************************
 * Copyright (c) 2021-2024 EclipseSource and others.
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
import { codiconCSSString, lazyBind } from '@eclipse-glsp/client';
import { ContainerModule, inject, injectable, interfaces } from '@theia/core/shared/inversify';
import { GLSPDiagramWidget } from '.';
import { GLSPDiagramLanguage } from '../common/glsp-diagram-language';
import { registerCopyPasteContextMenu } from './copy-paste-context-menu-contribution';
import { DiagramWidgetFactory, createDiagramWidgetFactory } from './diagram/diagram-widget-factory';
import { GLSPDiagramManager, registerDiagramManager } from './diagram/glsp-diagram-manager';
import { registerDiagramLayoutCommands } from './diagram/glsp-layout-commands';
import { BaseGLSPClientContribution, GLSPClientContribution } from './glsp-client-contribution';
import { registerMarkerNavigationCommands } from './theia-navigate-to-marker-contribution';

/**
 * A wrapper interface to get access to the binding related functions
 * for a inversify container.
 */
export interface ContainerContext {
    bind: interfaces.Bind;
    unbind: interfaces.Unbind;
    isBound: interfaces.IsBound;
    rebind: interfaces.Rebind;
}

/**
 *  The `GLSPTheiaFrontendModule` provides the necessary required module configuration
 *  to implement a theia GLSP diagram language integration.
 */
export abstract class GLSPTheiaFrontendModule extends ContainerModule {
    protected abstract diagramLanguage: GLSPDiagramLanguage;

    protected enableLayoutCommands = true;
    protected enableMarkerNavigationCommands = true;
    protected enableCopyPaste = false;

    constructor() {
        super((bind, unbind, isBound, rebind) => this.initialize({ bind, unbind, isBound, rebind }));
    }

    initialize(context: ContainerContext): void {
        this.bindGLSPClientContribution(context);
        this.bindDiagramConfiguration(context);
        this.bindDiagramWidgetFactory(context);
        this.configureDiagramManager(context);

        // Optional default configuration
        this.configureDiagramLayoutCommands(context);
        this.configureCopyPasteContextMenu(context);
        this.configureMarkerNavigationCommands(context);
        this.configure(context);
    }

    /**
     * Defines the binding for the glsp client contribution of the diagram integration. A {@link ConfigurableGLSPClientContribution}
     * with the same id as the diagramLanguage is bound. Can be overwritten in subclasses to provide a custom binding using
     * the {@link GLSPClientContribution} service identifier.
     *
     * For example:
     * ```typescript
     * context.bind(GLSPClientContribution).toSelf(MyCustomGLSPClientContribution);
     * ```
     * Note that glsp client contribution bindings are consumed via multi-injection. This means binding the {@link GLSPClientContribution}
     * service identifier in singleton scope has no effect.
     *
     * @param context the container context
     */
    bindGLSPClientContribution(context: ContainerContext): void {
        context.bind(GLSPClientContribution).toDynamicValue(ctx => {
            const childContainer = ctx.container.createChild();
            childContainer.bind(GLSPDiagramLanguage).toConstantValue(this.diagramLanguage);
            return childContainer.resolve(ConfigurableGLSPClientContribution);
        });
    }

    /**
     * Defines the binding for the diagram configuration of the diagram integration. Diagram configurations are multi-injected
     * and typically just bound to the `DiagramConfiguration` service identifier with the to() syntax.
     *
     * For example:
     * ```typescript
     * context.bind(DiagramConfiguration).to(MyCustomDiagramConfiguration);
     * ```
     *
     * Note that diagram configuration bindings are consumed via multi-injection. This means binding the `DiagramConfiguration`
     * service identifier in singleton scope has no effect.
     *
     * @param context the container context
     */
    abstract bindDiagramConfiguration(context: ContainerContext): void;

    /**
     * Defines the binding for the {@link DiagramWidgetFactory} of the diagram integration. Per default a
     * factory that constructs a {@link GLSPDiagramWidget} instance is bound.
     * Can be overwritten in subclasses to provide a custom binding using
     * the {@link DiagramWidgetFactory} service identifier.
     *
     * For example:
     * ```typescript
     * context.bind(DiagramWidgetFactory)
     *  .toDynamicValue(ctx => createDiagramWidgetFactory(ctx, this.diagramLanguage.diagramType, MyDiagramWidget));
     *
     * ```
     * Note that glsp diagram factory bindings are consumed via multi-injection. This means binding the {@link DiagramWidgetFactory}
     * service identifier in singleton scope has no effect.
     *
     * @param context the container context
     */
    bindDiagramWidgetFactory(context: ContainerContext): void {
        lazyBind(context, GLSPDiagramWidget)?.toSelf();
        context.bind(DiagramWidgetFactory).toDynamicValue(ctx => createDiagramWidgetFactory(ctx, this.diagramLanguage.diagramType));
    }

    /**
     * Configures the bindings for the diagram manager of the diagram integration. A {@link ConfigurableGLSPDiagramManager}
     * is bound to a generated service identifier in singleton scope and then additional bindings for this service
     * identifier are registered. Can be overwritten in subclasses to provide a custom binding.
     *
     *  For example:
     * ```typescript
     * context.bind(MyDiagramManager).to(MyDiagramManager).inSingletonScope();
     * registerDiagramManager(context.bind, MyDiagramManager);
     * ```
     * @param context the container context
     */
    configureDiagramManager(context: ContainerContext): void {
        const diagramManagerServiceId = Symbol(`DiagramManager_${this.diagramLanguage.diagramType}`);
        context
            .bind(diagramManagerServiceId)
            .toDynamicValue(ctx => {
                const childContainer = ctx.container.createChild();
                childContainer.bind(GLSPDiagramLanguage).toConstantValue(this.diagramLanguage);
                return childContainer.resolve(InternalGLSPDiagramManager);
            })
            .inSingletonScope();
        registerDiagramManager(context.bind, diagramManagerServiceId, false);
    }

    /**
     * Can be overwritten by subclasses to provide additional configuration (e.g. extra bindings)
     * for this module.
     *
     * For example:
     * ```typescript
     * context.bind(MyCustomClass).toSelf().inSingletonScope()
     * ```
     * @param context the container context
     */
    configure(context: ContainerContext): void {
        // Empty per default
    }

    /**
     * Optional configuration to enable the default diagram layout commands for the diagram integration.
     * Can be enabled/disabled using the {@link GLSPTheiaFrontendModule.enableLayoutCommands}  property flag.
     *
     * @param context the diagram context
     */
    configureDiagramLayoutCommands(context: ContainerContext): void {
        if (this.enableLayoutCommands) {
            registerDiagramLayoutCommands(context);
        }
    }

    /**
     * Optional configuration for copy & paste functionality of the diagram integration.
     * Can be enabled/disabled using the {@link GLSPTheiaFrontendModule.enableCopyPaste} property flag.
     * Note that the glsp server also needs to support copy & paste for this diagram configuration.
     *
     * @param context the diagram context
     */
    configureCopyPasteContextMenu(context: ContainerContext): void {
        if (this.enableCopyPaste) {
            registerCopyPasteContextMenu(context);
        }
    }

    /**
     * Optional configuration to enable marker navigation for the diagram integration.
     * Can be enabled/disabled using the {@link GLSPTheiaFrontendModule.enableMarkerNavigationCommands}  property flag.
     * Note that the glsp server also needs to support copy & paste for this diagram configuration.
     *
     * @param context the diagram context
     */
    configureMarkerNavigationCommands(context: ContainerContext): void {
        if (this.enableMarkerNavigationCommands) {
            registerMarkerNavigationCommands(context);
        }
    }
}

const GLSPDiagramLanguage = Symbol('GLSPDiagramLanguage');

/**
 * Internal class that is used in {@link GLSPTheiaFrontendModule.configureDiagramManager} to
 * bind a default implementation for `DiagramManager`. A custom `DiagramManager` should
 * never extend this class. Use {@link GLSPDiagramManager} instead.
 */

@injectable()
class InternalGLSPDiagramManager extends GLSPDiagramManager {
    private _diagramType: string;
    private _label: string;
    private _fileExtensions: string[] = [];
    private _iconClass = codiconCSSString('type-hierarchy-sub');
    private _contributionId: string;
    private _providerName?: string;

    constructor(@inject(GLSPDiagramLanguage) diagramLanguage: GLSPDiagramLanguage) {
        super();
        this._fileExtensions = diagramLanguage.fileExtensions;
        this._diagramType = diagramLanguage.diagramType;
        this._label = diagramLanguage.label;
        this._iconClass = diagramLanguage.iconClass || this._iconClass;
        this._contributionId = diagramLanguage.contributionId;
        this._providerName = diagramLanguage.providerName;
    }

    get fileExtensions(): string[] {
        return this._fileExtensions;
    }

    get diagramType(): string {
        return this._diagramType;
    }

    get label(): string {
        return this._label;
    }

    get contributionId(): string {
        return this._contributionId;
    }

    override get providerName(): string | undefined {
        return this._providerName;
    }

    override get iconClass(): string {
        return this._iconClass;
    }
}

/**
 * Internal class that is used in {@link GLSPTheiaFrontendModule.bindGLSPClientContribution} to
 * bind a default implementation for {@link GLSPClientContribution}. A custom {@link GLSPClientContribution}  should
 * never extend this class. Use {@link BaseGLSPClientContribution} instead.
 */
@injectable()
class ConfigurableGLSPClientContribution extends BaseGLSPClientContribution {
    readonly id: string;

    constructor(@inject(GLSPDiagramLanguage) diagramLanguage: GLSPDiagramLanguage) {
        super();
        this.id = diagramLanguage.contributionId;
    }
}
