/********************************************************************************
 * Copyright (c) 2026 EclipseSource and others.
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
import { ExportFormat, ExportResultAction, RequestExportAction } from '@eclipse-glsp/client';
import { CommandHandler, MessageService, URI } from '@theia/core';
import { ApplicationShell, QuickInputService } from '@theia/core/lib/browser';
import { BinaryBuffer } from '@theia/core/lib/common/buffer';
import { FileDialogService } from '@theia/filesystem/lib/browser/file-dialog/file-dialog-service';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileStat } from '@theia/filesystem/lib/common/files';
import { getDiagramWidget, GLSPDiagramWidget } from '../../glsp-diagram-widget';

interface ExportFormatChoice {
    label: string;
    format: ExportFormat;
    extension: string;
    filterLabel: string;
}

const EXPORT_FORMATS: ExportFormatChoice[] = [
    { label: 'SVG', format: 'svg', extension: 'svg', filterLabel: 'SVG Image (*.svg)' },
    { label: 'PNG', format: 'png', extension: 'png', filterLabel: 'PNG Image (*.png)' }
];

/**
 * {@link CommandHandler} for the "Export Diagram" menu command. Asks the user for the target
 * format up front, then opens the save dialog with a single matching filter so the resulting
 * URI's extension is unambiguous. Uses the request/response dispatcher path so the export
 * result lands here directly rather than fanning out to action handlers.
 */
export class TheiaExportCommandHandler implements CommandHandler {
    constructor(
        protected readonly shell: ApplicationShell,
        protected readonly fileService: FileService,
        protected readonly fileDialogService: FileDialogService,
        protected readonly quickInputService: QuickInputService,
        protected readonly messageService: MessageService
    ) {}

    async execute(): Promise<void> {
        const widget = getDiagramWidget(this.shell);
        if (!widget) {
            return;
        }

        const choice = await this.pickFormat();
        if (!choice) {
            return;
        }

        const folder = await this.getExportFolder(widget);
        let file = await this.fileDialogService.showSaveDialog(
            { title: 'Export Diagram', filters: { [choice.filterLabel]: [choice.extension] } },
            folder
        );
        if (!file) {
            return;
        }
        file = this.ensureExtension(file, choice.extension);

        try {
            const result = await widget.actionDispatcher.request(RequestExportAction.create(choice.format));
            await this.writeResult(file, result);
            this.messageService.info(`Diagram exported to '${file.path.name}'`);
        } catch (error) {
            this.messageService.error(`Error exporting diagram: ${error}`);
        }
    }

    isEnabled(): boolean {
        return !!getDiagramWidget(this.shell);
    }

    isVisible(): boolean {
        return true;
    }

    protected async pickFormat(): Promise<ExportFormatChoice | undefined> {
        const items = EXPORT_FORMATS.map(choice => ({
            label: choice.label,
            description: choice.filterLabel,
            choice
        }));
        const picked = await this.quickInputService.showQuickPick(items, {
            title: 'Export Diagram',
            placeholder: 'Select export format'
        });
        return picked?.choice;
    }

    protected ensureExtension(file: URI, extension: string): URI {
        const expected = '.' + extension;
        return file.path.ext.toLowerCase() === expected ? file : new URI(file.path.fsPath() + expected);
    }

    protected writeResult(file: URI, result: ExportResultAction): Promise<unknown> {
        if (result.encoding === 'base64') {
            return this.fileService.writeFile(file, BinaryBuffer.wrap(this.decodeBase64(result.data)));
        }
        return this.fileService.write(file, result.data);
    }

    protected decodeBase64(data: string): Uint8Array {
        const binary = atob(data);
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index++) {
            bytes[index] = binary.charCodeAt(index);
        }
        return bytes;
    }

    protected getExportFolder(widget: GLSPDiagramWidget): Promise<FileStat> {
        return this.fileService.resolve(new URI(widget.editorContext.sourceUri));
    }
}
