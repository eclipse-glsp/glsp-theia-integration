# The Theia integration

This document covers only what is specific to running the GLSP Playwright framework against a Theia
application. The framework concepts it builds on — integrations, page objects, extensions, flows and
capabilities — are documented once, in the core package:
[glsp-core/e2e/playwright/docs](https://github.com/eclipse-glsp/glsp-core/tree/master/e2e/playwright/docs).

## What the integration provides

`TheiaIntegration` launches a Theia application through `@theia/playwright`'s `TheiaAppLoader`,
opens a diagram editor on a file in the workspace, and exposes the diagram to the shared page
objects. Beyond the base `Integration` contract it implements three capabilities that only exist in
an IDE context:

| Capability                   | What Theia contributes                                                                   |
| ---------------------------- | ---------------------------------------------------------------------------------------- |
| `ContextMenuIntegration`     | The Lumino menu rendered as a sibling of `body`, so the shared context-menu suites apply |
| `DiagramShortcutIntegration` | Host key bindings (`hostDiagramShortcuts`) rather than the browser-level defaults        |
| `MarkerNavigatorIntegration` | `TheiaMarkerNavigator`, because Theia rebinds the marker navigation keys                 |

Suites in `@eclipse-glsp-examples/workflow-e2e` branch on these capabilities, so a Theia run picks up
the context-menu and marker-navigation cases automatically — no per-suite overrides are needed.

## Options

`defineTheiaIntegration()` is the only supported way to build the options: it fills in the
discriminator and the factory that the `integration` fixture uses, so a hand-written options literal
is a compile error.

| Option      | Required | Description                                                            |
| ----------- | -------- | ---------------------------------------------------------------------- |
| `url`       | yes      | Base URL of the Theia application                                      |
| `widgetId`  | yes      | Id of the diagram widget, e.g. `workflow-diagram`                      |
| `workspace` | no       | Path to a workspace directory; copied to a temporary location per test |
| `file`      | no       | File in the workspace to open; when omitted no editor is opened        |

## Launching the GLSP server

Theia's `GLSPServerContribution` spawns the GLSP server itself unless the application is started
with `--glspDebug`, which sets `launchedExternally`. Tests that want to own the server lifecycle —
to isolate its log output, or to run against a Java server — therefore start the server themselves
and pass `--glspDebug` to Theia. Without that flag the application launches its own server and the
two compete for the same port.

See [`workflow-theia-e2e`](../../workflow-theia-e2e/README.md) for a complete configuration.

## License

This program and the accompanying materials are made available under the terms of the
[Eclipse Public License v. 2.0](http://www.eclipse.org/legal/epl-2.0) which is available at
https://www.eclipse.org/legal/epl-2.0, or the
[GNU General Public License, version 2](https://www.gnu.org/software/classpath/license.html)
with the GNU Classpath Exception.

SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
