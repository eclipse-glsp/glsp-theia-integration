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

/**
 * Utility type to encapsulate all information needed to construct the address for a WebSocket GLSP Server endpoint
 */
export interface WebSocketConnectionInfo {
    /** Server websocket port */
    port: number;
    /** Server hostname. Default is 'localhost' */
    host?: string;
    /** Websocket endpoint path */
    path: string;
    /** The websocket protocol used by the server. Default is 'ws' */
    protocol?: 'ws' | 'wss';
}

/**
 * Utility function that tries to construct a WebSocket address from the given partial {@link WebSocketConnectionInfo}.
 * To construct a valid address the info most provide at least a port and and a path.
 * @param info Partial connection information
 * @returns The corresponding address, or `undefined` if the info does not contain the required properties.
 */
export function getWebSocketAddress(info: Partial<WebSocketConnectionInfo>): string | undefined {
    if ('path' in info && info.path !== undefined && 'port' in info && info.port !== undefined) {
        const protocol = info.protocol ?? 'ws';
        const host = info.host ?? '127.0.0.1';

        return `${protocol}://${host}:${info.port}/${info.path}`;
    }
    return undefined;
}

/**
 * Validates wether the given string is valid WebSocket address.
 * @param address The address to validate
 * @returns `true` if the address is valid, `false` otherwise
 */
export function isValidWebSocketAddress(address: string): boolean {
    try {
        const { protocol } = new URL(address);
        return protocol === 'ws:' || protocol === 'wss:';
    } catch (error) {
        return false;
    }
}
