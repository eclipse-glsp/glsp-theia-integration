/********************************************************************************
 * Copyright (c) 2019-2023 EclipseSource and others.
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
    AlignElementsAction,
    Alignment,
    bindAsService,
    ReduceFunctionType,
    ResizeDimension,
    ResizeElementsAction,
    SelectFunctionType
} from '@eclipse-glsp/client';
import { CommandContribution, CommandRegistry, MenuContribution, MenuModelRegistry, MenuPath } from '@theia/core';
import { ApplicationShell, KeybindingContribution, KeybindingRegistry } from '@theia/core/lib/browser';
import { inject, injectable, interfaces } from '@theia/core/shared/inversify';
import { GLSPCommandHandler } from './glsp-command-handler';
import { GLSPDiagramMenus } from './glsp-diagram-commands';
import { GLSPDiagramKeybindingContext } from './glsp-diagram-keybinding';

export function registerDiagramLayoutCommands(bind: interfaces.Bind): void {
    bindAsService(bind, CommandContribution, GLSPLayoutCommandContribution);
    bindAsService(bind, MenuContribution, GLSPLayoutMenuContribution);
    bindAsService(bind, KeybindingContribution, GLSPLayoutKeybindingContribution);
}

export namespace GLSPLayoutCommands {
    export const RESIZE_WIDTH_MIN = 'glsp:' + ResizeElementsAction.KIND + ':width:min';
    export const RESIZE_WIDTH_MIN_LABEL = 'Minimal Width';
    export const RESIZE_WIDTH_MAX = 'glsp:' + ResizeElementsAction.KIND + ':width:max';
    export const RESIZE_WIDTH_MAX_LABEL = 'Maximal Width';
    export const RESIZE_WIDTH_AVG = 'glsp:' + ResizeElementsAction.KIND + ':width:avg';
    export const RESIZE_WIDTH_AVG_LABEL = 'Average Width';
    export const RESIZE_WIDTH_FIRST = 'glsp:' + ResizeElementsAction.KIND + ':width:first';
    export const RESIZE_WIDTH_FIRST_LABEL = 'Width of First Selected Element';
    export const RESIZE_WIDTH_LAST = 'glsp:' + ResizeElementsAction.KIND + ':width:last';
    export const RESIZE_WIDTH_LAST_LABEL = 'Width of Last Selected Element';

    export const RESIZE_HEIGHT_MIN = 'glsp:' + ResizeElementsAction.KIND + ':height:min';
    export const RESIZE_HEIGHT_MIN_LABEL = 'Minimal Height';
    export const RESIZE_HEIGHT_MAX = 'glsp:' + ResizeElementsAction.KIND + ':height:max';
    export const RESIZE_HEIGHT_MAX_LABEL = 'Maximal Height';
    export const RESIZE_HEIGHT_AVG = 'glsp:' + ResizeElementsAction.KIND + ':height:avg';
    export const RESIZE_HEIGHT_AVG_LABEL = 'Average Height';
    export const RESIZE_HEIGHT_FIRST = 'glsp:' + ResizeElementsAction.KIND + ':height:first';
    export const RESIZE_HEIGHT_FIRST_LABEL = 'Height of First Selected Element';
    export const RESIZE_HEIGHT_LAST = 'glsp:' + ResizeElementsAction.KIND + ':height:last';
    export const RESIZE_HEIGHT_LAST_LABEL = 'Height of Last Selected Element';

    export const RESIZE_WIDTH_AND_HEIGHT_MIN = 'glsp:' + ResizeElementsAction.KIND + ':width_and_height:min';
    export const RESIZE_WIDTH_AND_HEIGHT_MIN_LBL = 'Minimal Width and Height';
    export const RESIZE_WIDTH_AND_HEIGHT_MAX = 'glsp:' + ResizeElementsAction.KIND + ':width_and_height:max';
    export const RESIZE_WIDTH_AND_HEIGHT_MAX_LBL = 'Maximal Width and Height';
    export const RESIZE_WIDTH_AND_HEIGHT_AVG = 'glsp:' + ResizeElementsAction.KIND + ':width_and_height:avg';
    export const RESIZE_WIDTH_AND_HEIGHT_AVG_LBL = 'Average Width and Height';
    export const RESIZE_WIDTH_AND_HEIGHT_FIRST = 'glsp:' + ResizeElementsAction.KIND + ':width_and_height:first';
    export const RESIZE_WIDTH_AND_HEIGHT_FIRST_LBL = 'Width and Height of First Selected Element';
    export const RESIZE_WIDTH_AND_HEIGHT_LAST = 'glsp:' + ResizeElementsAction.KIND + ':width_and_height:last';
    export const RESIZE_WIDTH_AND_HEIGHT_LAST_LBL = 'Width and Height of Last Selected Element';

    export const ALIGN_LEFT = 'glsp:' + AlignElementsAction.KIND + ':left';
    export const ALIGN_LEFT_LABEL = 'Left';
    export const ALIGN_CENTER = 'glsp:' + AlignElementsAction.KIND + ':center';
    export const ALIGN_CENTER_LABEL = 'Center';
    export const ALIGN_RIGHT = 'glsp:' + AlignElementsAction.KIND + ':right';
    export const ALIGN_RIGHT_LABEL = 'Right';
    export const ALIGN_TOP = 'glsp:' + AlignElementsAction.KIND + ':top';
    export const ALIGN_TOP_LABEL = 'Top';
    export const ALIGN_MIDDLE = 'glsp:' + AlignElementsAction.KIND + ':middle';
    export const ALIGN_MIDDLE_LABEL = 'Middle';
    export const ALIGN_BOTTOM = 'glsp:' + AlignElementsAction.KIND + ':bottom';
    export const ALIGN_BOTTOM_LABEL = 'Bottom';

    export const ALIGN_LEFT_FIRST = 'glsp:' + AlignElementsAction.KIND + ':left:first';
    export const ALIGN_LEFT_FIRST_LABEL = 'Left of First Selected Element';
    export const ALIGN_CENTER_FIRST = 'glsp:' + AlignElementsAction.KIND + ':center:first';
    export const ALIGN_CENTER_FIRST_LABEL = 'Center of First Selected Element';
    export const ALIGN_RIGHT_FIRST = 'glsp:' + AlignElementsAction.KIND + ':right:first';
    export const ALIGN_RIGHT_FIRST_LABEL = 'Right of First Selected Element';
    export const ALIGN_TOP_FIRST = 'glsp:' + AlignElementsAction.KIND + ':top:first';
    export const ALIGN_TOP_FIRST_LABEL = 'Top of First Selected Element';
    export const ALIGN_MIDDLE_FIRST = 'glsp:' + AlignElementsAction.KIND + ':middle:first';
    export const ALIGN_MIDDLE_FIRST_LABEL = 'Middle of First Selected Element';
    export const ALIGN_BOTTOM_FIRST = 'glsp:' + AlignElementsAction.KIND + ':bottom:first';
    export const ALIGN_BOTTOM_FIRST_LABEL = 'Bottom of First Selected Element';

    export const ALIGN_LEFT_LAST = 'glsp:' + AlignElementsAction.KIND + ':left:last';
    export const ALIGN_LEFT_LAST_LABEL = 'Left of Last Selected Element';
    export const ALIGN_CENTER_LAST = 'glsp:' + AlignElementsAction.KIND + ':center:last';
    export const ALIGN_CENTER_LAST_LABEL = 'Center of Last Selected Element';
    export const ALIGN_RIGHT_LAST = 'glsp:' + AlignElementsAction.KIND + ':right:last';
    export const ALIGN_RIGHT_LAST_LABEL = 'Right of Last Selected Element';
    export const ALIGN_TOP_LAST = 'glsp:' + AlignElementsAction.KIND + ':top:last';
    export const ALIGN_TOP_LAST_LABEL = 'Top of Last Selected Element';
    export const ALIGN_MIDDLE_LAST = 'glsp:' + AlignElementsAction.KIND + ':middle:last';
    export const ALIGN_MIDDLE_LAST_LABEL = 'Middle of Last Selected Element';
    export const ALIGN_BOTTOM_LAST = 'glsp:' + AlignElementsAction.KIND + ':bottom:last';
    export const ALIGN_BOTTOM_LAST_LABEL = 'Bottom of Last Selected Element';
}

export namespace GLSPLayoutMenus {
    export const ALIGN_MENU: MenuPath = GLSPDiagramMenus.DIAGRAM.concat('align');
    export const ALIGN_HORIZONTAL_GROUP: MenuPath = ALIGN_MENU.concat('1_horizontal');
    export const ALIGN_VERTICAL_GROUP: MenuPath = ALIGN_MENU.concat('2_vertical');
    export const ALIGN_HORIZONTAL_FIRST_GROUP: MenuPath = ALIGN_MENU.concat('3_horizontal_first');
    export const ALIGN_VERTICAL_FIRST_GROUP: MenuPath = ALIGN_MENU.concat('4_vertical_first');
    export const ALIGN_HORIZONTAL_LAST_GROUP: MenuPath = ALIGN_MENU.concat('5_horizontal_last');
    export const ALIGN_VERTICAL_LAST_GROUP: MenuPath = ALIGN_MENU.concat('6_vertical_last');

    export const RESIZE_MENU: MenuPath = GLSPDiagramMenus.DIAGRAM.concat('resize');
    export const RESIZE_WIDTH_GROUP: MenuPath = RESIZE_MENU.concat('1_width');
    export const RESIZE_HEIGHT_GROUP: MenuPath = RESIZE_MENU.concat('2_height');
    export const RESIZE_WIDTH_AND_HEIGHT_GROUP: MenuPath = RESIZE_MENU.concat('3_width_and_height');
}

@injectable()
export class GLSPLayoutMenuContribution implements MenuContribution {
    registerMenus(registry: MenuModelRegistry): void {
        registry.registerSubmenu(GLSPLayoutMenus.RESIZE_MENU, 'Resize');
        registry.registerMenuAction(GLSPLayoutMenus.RESIZE_WIDTH_GROUP, {
            commandId: GLSPLayoutCommands.RESIZE_WIDTH_MIN,
            order: '1'
        });
        registry.registerMenuAction(GLSPLayoutMenus.RESIZE_WIDTH_GROUP, {
            commandId: GLSPLayoutCommands.RESIZE_WIDTH_MAX,
            order: '2'
        });
        registry.registerMenuAction(GLSPLayoutMenus.RESIZE_WIDTH_GROUP, {
            commandId: GLSPLayoutCommands.RESIZE_WIDTH_AVG,
            order: '3'
        });
        registry.registerMenuAction(GLSPLayoutMenus.RESIZE_WIDTH_GROUP, {
            commandId: GLSPLayoutCommands.RESIZE_WIDTH_FIRST,
            order: '4'
        });
        registry.registerMenuAction(GLSPLayoutMenus.RESIZE_WIDTH_GROUP, {
            commandId: GLSPLayoutCommands.RESIZE_WIDTH_LAST,
            order: '5'
        });

        registry.registerMenuAction(GLSPLayoutMenus.RESIZE_HEIGHT_GROUP, {
            commandId: GLSPLayoutCommands.RESIZE_HEIGHT_MIN,
            order: '1'
        });
        registry.registerMenuAction(GLSPLayoutMenus.RESIZE_HEIGHT_GROUP, {
            commandId: GLSPLayoutCommands.RESIZE_HEIGHT_MAX,
            order: '2'
        });
        registry.registerMenuAction(GLSPLayoutMenus.RESIZE_HEIGHT_GROUP, {
            commandId: GLSPLayoutCommands.RESIZE_HEIGHT_AVG,
            order: '3'
        });
        registry.registerMenuAction(GLSPLayoutMenus.RESIZE_HEIGHT_GROUP, {
            commandId: GLSPLayoutCommands.RESIZE_HEIGHT_FIRST,
            order: '5'
        });
        registry.registerMenuAction(GLSPLayoutMenus.RESIZE_HEIGHT_GROUP, {
            commandId: GLSPLayoutCommands.RESIZE_HEIGHT_LAST,
            order: '4'
        });

        registry.registerMenuAction(GLSPLayoutMenus.RESIZE_WIDTH_AND_HEIGHT_GROUP, {
            commandId: GLSPLayoutCommands.RESIZE_WIDTH_AND_HEIGHT_MIN,
            order: '1'
        });
        registry.registerMenuAction(GLSPLayoutMenus.RESIZE_WIDTH_AND_HEIGHT_GROUP, {
            commandId: GLSPLayoutCommands.RESIZE_WIDTH_AND_HEIGHT_MAX,
            order: '2'
        });
        registry.registerMenuAction(GLSPLayoutMenus.RESIZE_WIDTH_AND_HEIGHT_GROUP, {
            commandId: GLSPLayoutCommands.RESIZE_WIDTH_AND_HEIGHT_AVG,
            order: '3'
        });
        registry.registerMenuAction(GLSPLayoutMenus.RESIZE_WIDTH_AND_HEIGHT_GROUP, {
            commandId: GLSPLayoutCommands.RESIZE_WIDTH_AND_HEIGHT_FIRST,
            order: '4'
        });
        registry.registerMenuAction(GLSPLayoutMenus.RESIZE_WIDTH_AND_HEIGHT_GROUP, {
            commandId: GLSPLayoutCommands.RESIZE_WIDTH_AND_HEIGHT_LAST,
            order: '5'
        });

        registry.registerSubmenu(GLSPLayoutMenus.ALIGN_MENU, 'Align');
        registry.registerMenuAction(GLSPLayoutMenus.ALIGN_HORIZONTAL_GROUP, {
            commandId: GLSPLayoutCommands.ALIGN_LEFT,
            order: '1'
        });
        registry.registerMenuAction(GLSPLayoutMenus.ALIGN_HORIZONTAL_GROUP, {
            commandId: GLSPLayoutCommands.ALIGN_CENTER,
            order: '2'
        });
        registry.registerMenuAction(GLSPLayoutMenus.ALIGN_HORIZONTAL_GROUP, {
            commandId: GLSPLayoutCommands.ALIGN_RIGHT,
            order: '3'
        });
        registry.registerMenuAction(GLSPLayoutMenus.ALIGN_VERTICAL_GROUP, {
            commandId: GLSPLayoutCommands.ALIGN_TOP,
            order: '4'
        });
        registry.registerMenuAction(GLSPLayoutMenus.ALIGN_VERTICAL_GROUP, {
            commandId: GLSPLayoutCommands.ALIGN_MIDDLE,
            order: '5'
        });
        registry.registerMenuAction(GLSPLayoutMenus.ALIGN_VERTICAL_GROUP, {
            commandId: GLSPLayoutCommands.ALIGN_BOTTOM,
            order: '6'
        });

        registry.registerMenuAction(GLSPLayoutMenus.ALIGN_HORIZONTAL_FIRST_GROUP, {
            commandId: GLSPLayoutCommands.ALIGN_LEFT_FIRST,
            order: '1'
        });
        registry.registerMenuAction(GLSPLayoutMenus.ALIGN_HORIZONTAL_FIRST_GROUP, {
            commandId: GLSPLayoutCommands.ALIGN_CENTER_FIRST,
            order: '2'
        });
        registry.registerMenuAction(GLSPLayoutMenus.ALIGN_HORIZONTAL_FIRST_GROUP, {
            commandId: GLSPLayoutCommands.ALIGN_RIGHT_FIRST,
            order: '3'
        });
        registry.registerMenuAction(GLSPLayoutMenus.ALIGN_VERTICAL_FIRST_GROUP, {
            commandId: GLSPLayoutCommands.ALIGN_TOP_FIRST,
            order: '4'
        });
        registry.registerMenuAction(GLSPLayoutMenus.ALIGN_VERTICAL_FIRST_GROUP, {
            commandId: GLSPLayoutCommands.ALIGN_MIDDLE_FIRST,
            order: '5'
        });
        registry.registerMenuAction(GLSPLayoutMenus.ALIGN_VERTICAL_FIRST_GROUP, {
            commandId: GLSPLayoutCommands.ALIGN_BOTTOM_FIRST,
            order: '6'
        });

        registry.registerMenuAction(GLSPLayoutMenus.ALIGN_HORIZONTAL_LAST_GROUP, {
            commandId: GLSPLayoutCommands.ALIGN_LEFT_LAST,
            order: '1'
        });
        registry.registerMenuAction(GLSPLayoutMenus.ALIGN_HORIZONTAL_LAST_GROUP, {
            commandId: GLSPLayoutCommands.ALIGN_CENTER_LAST,
            order: '2'
        });
        registry.registerMenuAction(GLSPLayoutMenus.ALIGN_HORIZONTAL_LAST_GROUP, {
            commandId: GLSPLayoutCommands.ALIGN_RIGHT_LAST,
            order: '3'
        });
        registry.registerMenuAction(GLSPLayoutMenus.ALIGN_VERTICAL_LAST_GROUP, {
            commandId: GLSPLayoutCommands.ALIGN_TOP_LAST,
            order: '4'
        });
        registry.registerMenuAction(GLSPLayoutMenus.ALIGN_VERTICAL_LAST_GROUP, {
            commandId: GLSPLayoutCommands.ALIGN_MIDDLE_LAST,
            order: '5'
        });
        registry.registerMenuAction(GLSPLayoutMenus.ALIGN_VERTICAL_LAST_GROUP, {
            commandId: GLSPLayoutCommands.ALIGN_BOTTOM_LAST,
            order: '6'
        });
    }
}

@injectable()
export class GLSPLayoutCommandContribution implements CommandContribution {
    constructor(@inject(ApplicationShell) protected readonly shell: ApplicationShell) {}

    registerResize(
        registry: CommandRegistry,
        id: string,
        label: string,
        dimension: ResizeDimension,
        reduceFunction: ReduceFunctionType
    ): void {
        registry.registerCommand(
            {
                id: id,
                category: 'Diagram',
                label: 'Resize to ' + label
            },
            new GLSPCommandHandler(this.shell, {
                actions: () => [ResizeElementsAction.create({ dimension, reduceFunction })],
                isEnabled: context => !context.isReadonly && context.get().selectedElementIds.length > 1
            })
        );
    }

    registerAlign(registry: CommandRegistry, id: string, label: string, alignment: Alignment, selectionFunction: SelectFunctionType): void {
        registry.registerCommand(
            {
                id: id,
                category: 'Diagram',
                label: 'Align ' + label
            },
            new GLSPCommandHandler(this.shell, {
                actions: () => [AlignElementsAction.create({ alignment, selectionFunction })],
                isEnabled: context => !context.isReadonly && context.get().selectedElementIds.length > 1
            })
        );
    }

    registerCommands(reg: CommandRegistry): void {
        this.registerResize(
            reg,
            GLSPLayoutCommands.RESIZE_WIDTH_MIN,
            GLSPLayoutCommands.RESIZE_WIDTH_MIN_LABEL,
            ResizeDimension.Width,
            'min'
        );
        this.registerResize(
            reg,
            GLSPLayoutCommands.RESIZE_WIDTH_MAX,
            GLSPLayoutCommands.RESIZE_WIDTH_MAX_LABEL,
            ResizeDimension.Width,
            'max'
        );
        this.registerResize(
            reg,
            GLSPLayoutCommands.RESIZE_WIDTH_AVG,
            GLSPLayoutCommands.RESIZE_WIDTH_AVG_LABEL,
            ResizeDimension.Width,
            'avg'
        );
        this.registerResize(
            reg,
            GLSPLayoutCommands.RESIZE_WIDTH_FIRST,
            GLSPLayoutCommands.RESIZE_WIDTH_FIRST_LABEL,
            ResizeDimension.Width,
            'first'
        );
        this.registerResize(
            reg,
            GLSPLayoutCommands.RESIZE_WIDTH_LAST,
            GLSPLayoutCommands.RESIZE_WIDTH_LAST_LABEL,
            ResizeDimension.Width,
            'last'
        );

        this.registerResize(
            reg,
            GLSPLayoutCommands.RESIZE_HEIGHT_MIN,
            GLSPLayoutCommands.RESIZE_HEIGHT_MIN_LABEL,
            ResizeDimension.Height,
            'min'
        );
        this.registerResize(
            reg,
            GLSPLayoutCommands.RESIZE_HEIGHT_MAX,
            GLSPLayoutCommands.RESIZE_HEIGHT_MAX_LABEL,
            ResizeDimension.Height,
            'max'
        );
        this.registerResize(
            reg,
            GLSPLayoutCommands.RESIZE_HEIGHT_AVG,
            GLSPLayoutCommands.RESIZE_HEIGHT_AVG_LABEL,
            ResizeDimension.Height,
            'avg'
        );
        this.registerResize(
            reg,
            GLSPLayoutCommands.RESIZE_HEIGHT_FIRST,
            GLSPLayoutCommands.RESIZE_HEIGHT_FIRST_LABEL,
            ResizeDimension.Height,
            'first'
        );
        this.registerResize(
            reg,
            GLSPLayoutCommands.RESIZE_HEIGHT_LAST,
            GLSPLayoutCommands.RESIZE_HEIGHT_LAST_LABEL,
            ResizeDimension.Height,
            'last'
        );

        this.registerResize(
            reg,
            GLSPLayoutCommands.RESIZE_WIDTH_AND_HEIGHT_MIN,
            GLSPLayoutCommands.RESIZE_WIDTH_AND_HEIGHT_MIN_LBL,
            ResizeDimension.Width_And_Height,
            'min'
        );
        this.registerResize(
            reg,
            GLSPLayoutCommands.RESIZE_WIDTH_AND_HEIGHT_MAX,
            GLSPLayoutCommands.RESIZE_WIDTH_AND_HEIGHT_MAX_LBL,
            ResizeDimension.Width_And_Height,
            'max'
        );
        this.registerResize(
            reg,
            GLSPLayoutCommands.RESIZE_WIDTH_AND_HEIGHT_AVG,
            GLSPLayoutCommands.RESIZE_WIDTH_AND_HEIGHT_AVG_LBL,
            ResizeDimension.Width_And_Height,
            'avg'
        );
        this.registerResize(
            reg,
            GLSPLayoutCommands.RESIZE_WIDTH_AND_HEIGHT_FIRST,
            GLSPLayoutCommands.RESIZE_WIDTH_AND_HEIGHT_FIRST_LBL,
            ResizeDimension.Width_And_Height,
            'first'
        );
        this.registerResize(
            reg,
            GLSPLayoutCommands.RESIZE_WIDTH_AND_HEIGHT_LAST,
            GLSPLayoutCommands.RESIZE_WIDTH_AND_HEIGHT_LAST_LBL,
            ResizeDimension.Width_And_Height,
            'last'
        );

        this.registerAlign(reg, GLSPLayoutCommands.ALIGN_LEFT, GLSPLayoutCommands.ALIGN_LEFT_LABEL, Alignment.Left, 'all');
        this.registerAlign(reg, GLSPLayoutCommands.ALIGN_CENTER, GLSPLayoutCommands.ALIGN_CENTER_LABEL, Alignment.Center, 'all');
        this.registerAlign(reg, GLSPLayoutCommands.ALIGN_RIGHT, GLSPLayoutCommands.ALIGN_RIGHT_LABEL, Alignment.Right, 'all');
        this.registerAlign(reg, GLSPLayoutCommands.ALIGN_TOP, GLSPLayoutCommands.ALIGN_TOP_LABEL, Alignment.Top, 'all');
        this.registerAlign(reg, GLSPLayoutCommands.ALIGN_MIDDLE, GLSPLayoutCommands.ALIGN_MIDDLE_LABEL, Alignment.Middle, 'all');
        this.registerAlign(reg, GLSPLayoutCommands.ALIGN_BOTTOM, GLSPLayoutCommands.ALIGN_BOTTOM_LABEL, Alignment.Bottom, 'all');

        this.registerAlign(reg, GLSPLayoutCommands.ALIGN_LEFT_FIRST, GLSPLayoutCommands.ALIGN_LEFT_FIRST_LABEL, Alignment.Left, 'first');
        this.registerAlign(
            reg,
            GLSPLayoutCommands.ALIGN_CENTER_FIRST,
            GLSPLayoutCommands.ALIGN_CENTER_FIRST_LABEL,
            Alignment.Center,
            'first'
        );
        this.registerAlign(reg, GLSPLayoutCommands.ALIGN_RIGHT_FIRST, GLSPLayoutCommands.ALIGN_RIGHT_FIRST_LABEL, Alignment.Right, 'first');
        this.registerAlign(reg, GLSPLayoutCommands.ALIGN_TOP_FIRST, GLSPLayoutCommands.ALIGN_TOP_FIRST_LABEL, Alignment.Top, 'first');
        this.registerAlign(
            reg,
            GLSPLayoutCommands.ALIGN_MIDDLE_FIRST,
            GLSPLayoutCommands.ALIGN_MIDDLE_FIRST_LABEL,
            Alignment.Middle,
            'first'
        );
        this.registerAlign(
            reg,
            GLSPLayoutCommands.ALIGN_BOTTOM_FIRST,
            GLSPLayoutCommands.ALIGN_BOTTOM_FIRST_LABEL,
            Alignment.Bottom,
            'first'
        );

        this.registerAlign(reg, GLSPLayoutCommands.ALIGN_LEFT_LAST, GLSPLayoutCommands.ALIGN_LEFT_LAST_LABEL, Alignment.Left, 'last');
        this.registerAlign(reg, GLSPLayoutCommands.ALIGN_CENTER_LAST, GLSPLayoutCommands.ALIGN_CENTER_LAST_LABEL, Alignment.Center, 'last');
        this.registerAlign(reg, GLSPLayoutCommands.ALIGN_RIGHT_LAST, GLSPLayoutCommands.ALIGN_RIGHT_LAST_LABEL, Alignment.Right, 'last');
        this.registerAlign(reg, GLSPLayoutCommands.ALIGN_TOP_LAST, GLSPLayoutCommands.ALIGN_TOP_LAST_LABEL, Alignment.Top, 'last');
        this.registerAlign(reg, GLSPLayoutCommands.ALIGN_MIDDLE_LAST, GLSPLayoutCommands.ALIGN_MIDDLE_LAST_LABEL, Alignment.Middle, 'last');
        this.registerAlign(reg, GLSPLayoutCommands.ALIGN_BOTTOM_LAST, GLSPLayoutCommands.ALIGN_BOTTOM_LAST_LABEL, Alignment.Bottom, 'last');
    }
}

@injectable()
export class GLSPLayoutKeybindingContribution implements KeybindingContribution {
    constructor(@inject(GLSPDiagramKeybindingContext) protected readonly diagramKeybindingContext: GLSPDiagramKeybindingContext) {}

    registerKeybindings(registry: KeybindingRegistry): void {
        registry.registerKeybinding({
            command: GLSPLayoutCommands.ALIGN_LEFT,
            context: this.diagramKeybindingContext.id,
            keybinding: 'alt+shift+left',
            when: '!glspEditorIsReadonly && glspEditorHasMultipleSelection'
        });
        registry.registerKeybinding({
            command: GLSPLayoutCommands.ALIGN_RIGHT,
            context: this.diagramKeybindingContext.id,
            keybinding: 'alt+shift+right',
            when: '!glspEditorIsReadonly && glspEditorHasMultipleSelection'
        });
        registry.registerKeybinding({
            command: GLSPLayoutCommands.ALIGN_TOP,
            context: this.diagramKeybindingContext.id,
            keybinding: 'alt+shift+up',
            when: '!glspEditorIsReadonly && glspEditorHasMultipleSelection'
        });
        registry.registerKeybinding({
            command: GLSPLayoutCommands.ALIGN_BOTTOM,
            context: this.diagramKeybindingContext.id,
            keybinding: 'alt+shift+down',
            when: '!glspEditorIsReadonly && glspEditorHasMultipleSelection'
        });
    }
}
