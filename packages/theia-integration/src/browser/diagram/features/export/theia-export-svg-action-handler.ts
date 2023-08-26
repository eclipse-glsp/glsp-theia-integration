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
import { EditorContextService, ExportSvgAction, IActionHandler } from '@eclipse-glsp/client';
import { MessageService, URI } from '@theia/core';
import { inject, injectable } from '@theia/core/shared/inversify';
import { FileDialogService } from '@theia/filesystem/lib/browser/file-dialog/file-dialog-service';
import { FileService } from '@theia/filesystem/lib/browser/file-service';

/**
 * Default {@link IActionHandler} for {@link ExportSvgAction}s in Theia
 * (bound in Diagram child DI container)
 */
@injectable()
export class TheiaExportSvgActionHandler implements IActionHandler {
    @inject(FileService)
    protected fileService: FileService;

    @inject(FileDialogService)
    protected fileDialogService: FileDialogService;

    @inject(MessageService)
    protected messageService: MessageService;

    @inject(EditorContextService)
    protected editorContextService: EditorContextService;

    handle(action: ExportSvgAction): void {
        this.export(action);
    }

    async export(action: ExportSvgAction): Promise<void> {
        const uri = this.editorContextService.sourceUri;
        const folder = await this.fileService.resolve(new URI(uri));
        let file = await this.fileDialogService.showSaveDialog({ title: 'Export Diagram', filters: { 'Images (*.svg)': ['svg'] } }, folder);
        if (file) {
            try {
                if (!file.path.ext) {
                    file = new URI(file.path.fsPath() + '.svg');
                }
                await this.fileService.write(file, action.svg);
                this.messageService.info(`Diagram exported to '${file.path.name}'`);
            } catch (error) {
                this.messageService.info(`Error exporting diagram '${error}'`);
            }
        }
    }
}
