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

import { ModuleConfiguration } from '@eclipse-glsp/client';
import { theiaExportModule } from './export/theia-export-module';
import { theiaNavigationModule } from './navigation/theia-navigation-module';
import { theiaNotificationModule } from './notification/notification-module';
import { theiaSelectModule } from './select/theia-select-module';
import { theiaSourceModelWatcherModule } from './source-model-watcher/theia-source-model-watcher-module';

export const THEIA_DEFAULT_MODULES = [
    theiaSelectModule,
    theiaExportModule,
    theiaNavigationModule,
    theiaSourceModelWatcherModule,
    theiaNotificationModule
] as const;

export const THEIA_DEFAULT_MODULE_CONFIG: ModuleConfiguration = {
    add: [...THEIA_DEFAULT_MODULES]
};
