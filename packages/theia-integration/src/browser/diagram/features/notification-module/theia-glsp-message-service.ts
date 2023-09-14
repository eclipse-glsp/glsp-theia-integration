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
import {
    EndProgressAction,
    IActionHandler,
    ICommand,
    MessageAction,
    StartProgressAction,
    UpdateProgressAction
} from '@eclipse-glsp/client';
import { MessageService, Progress } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { Action } from 'sprotty-protocol/lib/actions';

@injectable()
export class TheiaGLSPMessageService implements IActionHandler {
    static readonly SHOW_DETAILS_LABEL = 'Show details';

    @inject(MessageService)
    protected messageService: MessageService;

    protected progressReporters: Map<string, Progress> = new Map();

    handle(action: Action): void | Action | ICommand {
        if (MessageAction.is(action)) {
            return this.message(action);
        }
        if (StartProgressAction.is(action)) {
            return this.startProgress(action);
        }
        if (UpdateProgressAction.is(action)) {
            return this.updateProgress(action);
        }
        if (EndProgressAction.is(action)) {
            return this.endProgress(action);
        }
    }

    protected message(action: MessageAction): void {
        if (!this.shouldShowMessage(action)) {
            return;
        }

        const method = this.toMessageServiceMethod(action.severity);
        const text = action.message;
        const details = action.details ?? '';
        const actions = details ? [TheiaGLSPMessageService.SHOW_DETAILS_LABEL] : [];
        this.messageService[method](text, undefined, ...actions).then(result => {
            if (result === TheiaGLSPMessageService.SHOW_DETAILS_LABEL) {
                this.showDetailsDialog(text, details);
            }
        });
    }

    protected toMessageServiceMethod(severity: string): keyof Pick<MessageService, 'log' | 'info' | 'error' | 'warn'> {
        switch (severity) {
            case 'ERROR':
                return 'error';
            case 'WARNING':
                return 'warn';
            case 'INFO':
                return 'info';
        }
        return 'log';
    }

    protected shouldShowMessage(action: MessageAction): boolean {
        return action.severity !== 'NONE';
    }

    protected showDetailsDialog(title: string, msg: string): Promise<boolean | undefined> {
        const wrappedMsg = wrapMessage(msg);
        return new ConfirmDialog({ title, msg: wrappedMsg }).open();
    }

    protected startProgress(action: StartProgressAction): void {
        const { progressId, title, message, percentage } = action;
        const newPercentage = (percentage ?? -1) >= 0 ? percentage : undefined;
        this.messageService
            .showProgress({ text: title }) //
            .then(progress => {
                this.progressReporters.set(progressId, progress);
                progress.report({ message, work: newPercentage ? { done: newPercentage, total: 100 } : undefined });
            });
    }

    protected progressReporterId(widgetId: string, progressId: string): string {
        return `${widgetId}_${progressId}`;
    }

    protected updateProgress(action: UpdateProgressAction): void {
        const { progressId, message, percentage } = action;
        const newPercentage = (percentage ?? -1) >= 0 ? percentage : undefined;
        const progress = this.progressReporters.get(progressId);
        if (!progress) {
            return;
        }
        progress.report({ message, work: newPercentage ? { done: newPercentage, total: 100 } : undefined });
    }

    protected endProgress(action: EndProgressAction): void {
        const { progressId } = action;
        const progress = this.progressReporters.get(progressId);
        if (!progress) {
            return;
        }
        this.progressReporters.delete(progressId);
        progress.cancel();
    }
}

/**
 * Wraps the given message in a pre-formatted,
 * scrollable div.
 * @param msg
 */
function wrapMessage(msg: string): HTMLDivElement {
    const scrollDiv = document.createElement('div');
    scrollDiv.className = 'scroll-div';
    const pre = document.createElement('pre');
    pre.textContent = msg;
    scrollDiv.appendChild(pre);
    return scrollDiv;
}
