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

/**
 * Port of the Theia browser application. Not registered with `@eclipse-glsp-examples/workflow-e2e`,
 * which only knows the applications shipped by glsp-core, so it is passed to `getPort` explicitly.
 */
export const THEIA_DEFAULT_PORT = 3000;

/**
 * WebSocket path the Workflow GLSP server listens on. Hard-coded by the Workflow server app, and
 * handed to Theia via `--WF_PATH` so its server contribution connects to the same endpoint.
 */
export const GLSP_WEBSOCKET_PATH = 'workflow';
