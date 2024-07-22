/********************************************************************************
 * Copyright (c) 2023-2024 EclipseSource and others.
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

import { Constructor } from '@eclipse-glsp/client';
import { Container, interfaces } from '@theia/core/shared/inversify';
import { GLSPDiagramWidget, GLSPDiagramWidgetOptions } from './glsp-diagram-widget';
/**
 * A factory for creating new, injectable {@link GLSPDiagramWidget} instances.
 * Scoped to a specific `diagramType`
 */
export const DiagramWidgetFactory = Symbol('DiagramWidgetFactory');
export interface DiagramWidgetFactory {
    diagramType: string;
    create(options: GLSPDiagramWidgetOptions, diagramDiContainer: Container): GLSPDiagramWidget;
}

/**
 * Utility function to create the default inversify binding for the {@link DiagramWidgetFactory}
 * @param context the inversify context
 * @param diagramType the diagram type this factory is for
 * @param widgetConstructor The optional widget constructor that should be used by this factory (i.e resolved from the container).
 *                          Can be used to create a factory for a subclass of {@link GLSPDiagramWidget}.
 */
export function createDiagramWidgetFactory(
    context: interfaces.Context,
    diagramType: string,
    widgetConstructor?: Constructor<GLSPDiagramWidget>
): DiagramWidgetFactory {
    return {
        diagramType,
        create: (options, diagramDiContainer) => {
            const serviceId: Constructor<GLSPDiagramWidget> = widgetConstructor ?? GLSPDiagramWidget;
            const diagramWidget = context.container.resolve(serviceId);
            diagramWidget.configure(options, diagramDiContainer);
            return diagramWidget;
        }
    };
}
