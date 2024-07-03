/********************************************************************************
 * Copyright (c) 2024 EclipseSource and others.
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

import { THEIA_VERSION } from '@theia/core';
import * as semver from 'semver';

/**
 * Returns the currently used Theia version i.e. the version of the installed @theia/core package.
 *
 */
export function getTheiaVersion(): string {
    return THEIA_VERSION;
}

/**
 * Validates if the current Theia version satisfies the given semver range.
 * @param range - The semver range to validate against the current Theia version.
 * @param optionsOrLoose - Optional configuration options to treat the given range as loose or include prerelease versions.
 * By default, prerelease versions are included.
 * @returns `true` if the current Theia version satisfies the given range, `false` otherwise.
 * @throws An error if the given range is invalid.
 */
export function satisfiesTheiaVersion(range: string, options: boolean | semver.RangeOptions = { includePrerelease: true }): boolean {
    if (!semver.valid(range) && !semver.validRange(range)) {
        throw new Error(`Invalid version or range: ${range}`);
    }
    return semver.satisfies(getTheiaVersion(), range, options);
}
