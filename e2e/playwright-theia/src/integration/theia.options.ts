/********************************************************************************
 * Copyright (c) 2023-2026 Business Informatics Group (TU Wien) and others.
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

import type { BaseIntegrationOptions, IntegrationFactory, IntegrationOptions } from '@eclipse-glsp/playwright';

export interface TheiaIntegrationOptions extends BaseIntegrationOptions {
    type: 'Theia';
    /**
     * Required, so that a hand-written options literal is a compile error.
     * Use {@link defineTheiaIntegration} to create the options.
     */
    integrationFactory: IntegrationFactory<TheiaIntegrationOptions>;
    url: string;
    widgetId: string;
    workspace?: string;
    file?: string;
}

/**
 * The hand-written part of {@link TheiaIntegrationOptions}, i.e. everything except the
 * discriminator and the factory that {@link defineTheiaIntegration} fills in.
 */
export type TheiaIntegrationConfig = Omit<TheiaIntegrationOptions, 'type' | 'integrationFactory'>;

declare global {
    namespace GLSPPlaywright {
        interface IntegrationOptionsMap {
            Theia: TheiaIntegrationOptions;
        }
    }
}

export namespace TheiaIntegrationOptions {
    export function is(options?: IntegrationOptions): options is TheiaIntegrationOptions {
        return options?.type === 'Theia';
    }
}
