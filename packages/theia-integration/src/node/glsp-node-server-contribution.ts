/********************************************************************************
 * Copyright (c) 2023 STMicroelectronics and others.
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
    ContainerConfiguration,
    GLSPClientProxy,
    GLSPServer,
    JsonrpcClientProxy,
    ModuleConfiguration,
    asArray,
    configureClientConnection,
    distinctAdd,
    hasFunctionProp,
    hasNumberProp,
    remove
} from '@eclipse-glsp/protocol';
import { Channel, Disposable, MaybePromise } from '@theia/core';
import { Container, ContainerModule, inject, injectable } from '@theia/core/shared/inversify';
import { MessageConnection } from 'vscode-jsonrpc';
import { createChannelConnection } from '../common';
import { BaseGLSPServerContribution, GLSPServerContributionOptions } from './glsp-server-contribution';

export const ServerContainerFactory = Symbol('ServerContainerFactory');
/**
 * An injectable factory used to create the baseline server DI container for a new GLSP Server
 * (when used as direct integration in a node backed).
 * The default factory simply creates a child container from the main Theia DI container.
 */
export type ServerContainerFactory = () => Container;

/**
 *  A reusable base implementation for {@link GLSPServerContribution}s that are running in a node backed and directly
 *  communicate with a Node GLSP Server
 **/
@injectable()
export abstract class GLSPNodeServerContribution extends BaseGLSPServerContribution {
    @inject(ServerContainerFactory)
    protected serverContainerFactory: ServerContainerFactory;

    protected abstract createServerModules(): ContainerModule[];

    override createContributionOptions(): Partial<GLSPServerContributionOptions> {
        return {
            launchedExternally: false
        };
    }

    override doConnect(clientChannel: Channel): MaybePromise<Disposable> {
        try {
            const clientConnection = this.createMessageConnection(clientChannel);
            const connectionModule = this.createConnectionModule(clientConnection);
            const container = this.createContainer(connectionModule);
            const server = container.get<GLSPServer>(GLSPServer);
            configureClientConnection(clientConnection, server);
            return Disposable.create(() => {
                server.shutdown();
                container.unbindAll();
                clientConnection.dispose();
                clientChannel.close();
            });
        } catch (error) {
            console.error(error);
            return Disposable.NULL;
        }
    }

    protected createContainer(...additionalConfiguration: ContainerConfiguration): Container {
        const container = this.serverContainerFactory();
        return configureServerContainer(container, ...this.createServerModules(), ...additionalConfiguration);
    }

    protected createConnectionModule(clientConnection: MessageConnection): ContainerModule {
        return new ContainerModule(bind => {
            bind(GLSPClientProxy).toDynamicValue(ctx => {
                const proxy = ctx.container.resolve(JsonrpcClientProxy);
                proxy.initialize(clientConnection);
                return proxy;
            });
        });
    }

    protected configureClientConnection(clientConnection: MessageConnection, server: GLSPServer): void {
        configureClientConnection(clientConnection, server);
    }

    protected createMessageConnection(clientChannel: Channel): MessageConnection {
        return createChannelConnection(clientChannel);
    }
}

/**
 * Initializes a container with the given {@link ContainerConfiguration}. The container configuration
 * consists of the set of {@link ContainerModule}s that should be loaded in the container and/or
 * In addition, for more fine-grained control {@link ModuleConfiguration}s can be passed as part fo the container configuration
 * Module loading is distinct,this means each module will only get loaded once even if it is configured multiple times.
  @param containerConfiguration
 *          Custom modules to be loaded in addition to the default modules and/or default modules that should be excluded.
  @returns The initialized container.
 */
export function configureServerContainer(container: Container, ...containerConfiguration: ContainerConfiguration): Container {
    const modules: ContainerModule[] = [];
    containerConfiguration.forEach(config => {
        if (isContainerModule(config)) {
            distinctAdd(modules, config);
        } else {
            if (config.remove) {
                remove(modules, ...asArray(config.remove));
            }
            if (config.add) {
                distinctAdd(modules, ...asArray(config.add));
            }
        }
    });
    container.load(...modules);
    return container;
}

/**
 * The container modules might originate form different inversify contexts (e.g. `inversify` vs. `@theia/core/shared/inversify`).
 * If this is the case an instanceof check can return  false negative.
 * => use a simple typeguard instead.
 */
function isContainerModule(config: ContainerModule | ModuleConfiguration): config is ContainerModule {
    return hasNumberProp(config, 'id') && hasFunctionProp(config, 'registry');
}
