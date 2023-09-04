/********************************************************************************
 * Copyright (c) 2023 EclipseSource and others.
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
 */
export function createDiagramWidgetFactory(context: interfaces.Context, diagramType: string): DiagramWidgetFactory {
    return {
        diagramType,
        create: (options, diagramDiContainer) => {
            const diagramWidget = context.container.get(GLSPDiagramWidget);
            diagramWidget.configure(options, diagramDiContainer);
            return diagramWidget;
        }
    };
}
