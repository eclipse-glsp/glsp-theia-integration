# Workflow Example — Theia E2E Tests

Theia integration tests for the GLSP `Workflow Example`.

This package holds what is specific to Theia:

- [./tests](./tests/): One registration of the complete reusable Workflow contract plus tests that
  only apply to Theia, such as closing a popup through the context menu.
- [./configs](./configs/): The Theia Playwright project and the web servers that start the GLSP
  server and the Theia browser application.

The integration-agnostic test bodies live in `@eclipse-glsp-examples/workflow-e2e`, which is
developed in [glsp-core](https://github.com/eclipse-glsp/glsp-core). This package registers the
aggregate contract locally, so newly published suites run automatically and stay customizable.

## Running

From the repository root:

```console
pnpm install
pnpm test:e2e
```

`test:e2e` builds the Theia browser application and then runs the suites. Once the application is
built, the tests can be re-run on their own:

```console
pnpm e2e test
```

Playwright starts the bundled Workflow Node server and the Theia application automatically. The
Theia application is always launched with `--glspDebug`, so its server contribution attaches to an
already running server instead of spawning one of its own.

## Configuration

All variables are optional and can be set in the environment or in an `.env` file in `e2e/`
(see [`.env.example`](../.env.example)).

| Variable               | Default | Description                                                                |
| ---------------------- | ------- | -------------------------------------------------------------------------- |
| `THEIA_PORT`           | `3000`  | Port of the Theia browser application                                      |
| `GLSP_SERVER_PORT`     | `8081`  | Port of the Workflow GLSP server                                           |
| `GLSP_SERVER_TYPE`     | `node`  | `node` starts the bundled server; `java` expects an externally started one |
| `GLSP_SERVER_EXTERNAL` | unset   | `true` to attach to a server started by hand, e.g. under a debugger        |

### Testing against another server

Only the bundled Node server is started by Playwright. Any other server — the Java server from the
[glsp-server](https://github.com/eclipse-glsp/glsp-server) repository, or a Node server under a
debugger — has to be listening on `GLSP_SERVER_PORT` before the tests are started:

```console
# in a separate shell, from your glsp-server checkout
java -jar examples/org.eclipse.glsp.example.workflow/target/*-glsp.jar --websocket --port 8081

GLSP_SERVER_TYPE=java pnpm e2e test
```

## License

This program and the accompanying materials are made available under the terms of the
[Eclipse Public License v. 2.0](http://www.eclipse.org/legal/epl-2.0) which is available at
https://www.eclipse.org/legal/epl-2.0, or the
[GNU General Public License, version 2](https://www.gnu.org/software/classpath/license.html)
with the GNU Classpath Exception.

SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
