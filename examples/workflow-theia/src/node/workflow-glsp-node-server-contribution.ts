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
import { WorkflowDiagramModule, WorkflowLayoutConfigurator, WorkflowServerModule } from '@eclipse-glsp-examples/workflow-server/node';
import { configureELKLayoutModule } from '@eclipse-glsp/layout-elk';
import { GModelStorage, LogLevel, createAppModule } from '@eclipse-glsp/server/node';
import { GLSPNodeServerContribution } from '@eclipse-glsp/theia-integration/lib/node';
import { ContainerModule, injectable } from '@theia/core/shared/inversify';
import { join } from 'path';
import { WorkflowLanguage } from '../common/workflow-language';
export const LOG_DIR = join(__dirname, '..', '..', '..', '..', 'logs');

@injectable()
export class WorkflowGLSPNodeServerContribution extends GLSPNodeServerContribution {
    protected override createServerModules(): ContainerModule[] {
        const appModule = createAppModule({ logLevel: LogLevel.info, logDir: LOG_DIR, fileLog: true, consoleLog: false });
        const elkLayoutModule = configureELKLayoutModule({ algorithms: ['layered'], layoutConfigurator: WorkflowLayoutConfigurator });
        const mainModule = new WorkflowServerModule().configureDiagramModule(
            new WorkflowDiagramModule(() => GModelStorage),
            elkLayoutModule
        );
        return [appModule, mainModule];
    }
    readonly id = WorkflowLanguage.contributionId;
}
