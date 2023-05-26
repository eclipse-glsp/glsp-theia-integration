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
import { TaskNode, isTaskNode } from '@eclipse-glsp-examples/workflow-glsp/lib/model';
import { GlspSelection, getDiagramWidget } from '@eclipse-glsp/theia-integration';
import { SelectionService } from '@theia/core';
import { AbstractViewContribution, ApplicationShell, Message, codicon } from '@theia/core/lib/browser';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { Command } from '@theia/core/lib/common/command';
import { inject, injectable, postConstruct } from 'inversify';
import * as React from 'react';
import { ReactNode } from 'react';

@injectable()
export class WorkflowSelectionWidget extends ReactWidget {
    static readonly ID = 'WorkflowSelectionWidget';
    static readonly LABEL = 'Workflow Selection';

    @inject(SelectionService) protected readonly selectionService: SelectionService;
    @inject(ApplicationShell) protected readonly shell: ApplicationShell;

    protected selectedTask?: TaskNode;

    @postConstruct()
    protected async init(): Promise<void> {
        this.id = WorkflowSelectionWidget.ID;
        this.title.caption = WorkflowSelectionWidget.LABEL;
        this.title.label = WorkflowSelectionWidget.LABEL;
        this.title.iconClass = codicon('search-fuzzy');
        this.title.closable = true;

        this.node.tabIndex = -1;

        this.addGlspSelectionSupport();
        this.update();
    }

    protected override onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        this.node.focus();
    }

    protected addGlspSelectionSupport(): void {
        this.toDispose.push(this.selectionService.onSelectionChanged(selection => this.setGlspSelection(selection)));
        this.setGlspSelection(this.selectionService.selection);
    }

    protected setGlspSelection(selection?: any): void {
        if (selection) {
            // additionalSelectionData is causing problems in the 'GlspSelection.is' check
            delete selection['additionalSelectionData'];
        }
        if (GlspSelection.is(selection)) {
            this.selectedTask = this.resolveTask(selection.selectedElementsIDs);
            this.update();
        }
    }

    protected resolveTask(selectedElementsIDs: string[]): TaskNode | undefined {
        const firstSelected = selectedElementsIDs.length > 0 ? selectedElementsIDs[0] : undefined;
        if (!firstSelected) {
            return;
        }
        const widget = this.shell.activeWidget;
        const diagramWidget = widget && getDiagramWidget(widget);
        const root = diagramWidget?.editorContext.modelRoot;
        const selected = root?.index.getById(firstSelected);
        if (!selected || !isTaskNode(selected)) {
            return;
        }
        return selected;
    }

    protected override render(): ReactNode {
        if (!this.selectedTask) {
            return <div>No Selection</div>;
        }
        return (
            // we can use any framework here to render selection, e.g., a form-based layout
            <div>
                <span>{this.selectedTask.name}</span>
                <span> ({this.selectedTask.id})</span>
            </div>
        );
    }
}

export const ToggleWorkflowSelectionWidget: Command = { id: WorkflowSelectionWidget.ID + ':command' };

@injectable()
export class WorkflowSelectionWidgetViewContribution extends AbstractViewContribution<WorkflowSelectionWidget> {
    constructor() {
        super({
            widgetId: WorkflowSelectionWidget.ID,
            widgetName: WorkflowSelectionWidget.LABEL,
            defaultWidgetOptions: { area: 'bottom' },
            toggleCommandId: ToggleWorkflowSelectionWidget.id
        });
    }
}
