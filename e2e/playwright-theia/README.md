# @eclipse-glsp/playwright-theia

Theia integration for the GLSP Playwright testing framework.

Use this package to test a GLSP diagram editor running inside a Theia application.
It contributes the `Theia` integration, its page objects, and the Theia specific key
bindings; everything else comes from
[`@eclipse-glsp/playwright`](https://github.com/eclipse-glsp/glsp-core/tree/master/e2e/playwright),
which is developed in the [glsp-core](https://github.com/eclipse-glsp/glsp-core) repository.

## Usage

Create the integration options with `defineTheiaIntegration()` in your Playwright
configuration. The returned options carry the factory that the `integration` fixture uses,
so no further registration is needed:

```ts
import { defineTheiaIntegration } from '@eclipse-glsp/playwright-theia';

const integrationOptions = defineTheiaIntegration({
    url: 'http://localhost:3000',
    widgetId: 'workflow-diagram',
    workspace: '../workspace',
    file: 'example1.wf'
});

export default {
    projects: [{ name: 'theia', use: { integrationOptions } }]
};
```

Tests themselves stay integration-agnostic and keep importing `test` and `expect` from
`@eclipse-glsp/playwright`.

## Documentation

The framework concepts (integrations, page objects, extensions, flows) are documented once, in
the core package: [concepts](https://github.com/eclipse-glsp/glsp-core/tree/master/e2e/playwright/docs).
Only what is specific to Theia is documented here, under [`docs/`](./docs).

## Building

This package is built as part of the [glsp-theia-integration](https://github.com/eclipse-glsp/glsp-theia-integration)
workspace:

```console
pnpm install
pnpm compile
```

## License

This program and the accompanying materials are made available under the terms of the
[Eclipse Public License v. 2.0](http://www.eclipse.org/legal/epl-2.0) which is available at
https://www.eclipse.org/legal/epl-2.0, or the
[GNU General Public License, version 2](https://www.gnu.org/software/classpath/license.html)
with the GNU Classpath Exception.

SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
