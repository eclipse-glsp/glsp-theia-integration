# Eclipse GLSP - Theia Integration for GLSP Clients [![CI](https://github.com/eclipse-glsp/glsp-theia-integration/actions/workflows/ci.yml/badge.svg)](https://github.com/eclipse-glsp/glsp-theia-integration/actions/workflows/ci.yml) [![Publish next](https://github.com/eclipse-glsp/glsp-theia-integration/actions/workflows/publish-next.yml/badge.svg)](https://github.com/eclipse-glsp/glsp-theia-integration/actions/workflows/publish-next.yml)

This project contains the glue code necessary to integrate diagram editors built with the [graphical language server platform](https://github.com/eclipse-glsp/glsp) with [Eclipse Theia](https://github.com/theia-ide/theia) as well as an example Theia application for testing purposes.

This project is built with `yarn` and is available from npm via [@eclipse-glsp/theia-integration](https://www.npmjs.com/package/@eclipse-glsp/theia-integration).

For details on building the project, please see the [README file of the theia-integration package](/packages/theia-integration/README.md).

## Theia Version Compatibility

| @eclipse-glsp/theia-integration | Theia              |
| ------------------------------- | ------------------ |
| 0.8.0                           | <=1.4.0            |
| 0.9.0                           | >=1.20.0 <= 1.25.0 |
| 1.0.0                           | >=1.25.0 <= 1.26.0 |
| 1.0.0-theia1.27.0               | >=1.27.0 < 1.34.0  |
| 1.0.0-theia1.34.0               | >=1.34.0 < 1.39.0  |
| 2.0.0                           | >=1.39.0 < 1.45.0  |
| 2.1.x                           | >=1.39.0 < 1.45.0  |
| 2.1.0-theia1.45.0               | >=1.45.0 < 1.50.0  |
| 2.1.0-theia1.50.0               | >=1.45.0           |
| next                            | >=1.45.0           |

> Note: For versions <=1.0.0 it is not possible to safely restrict the maximum version of Theia packages. If you encounter build errors related to multiple resolved Theia versions please add a resolutions block to the `package.json` of your project e.g. for `1.0.0-theia1.27.0`:

```json
...
 "resolutions": {
    "**/@theia/core": "1.27.0",
    "**/@theia/editor": "1.27.0",
    "**/@theia/filesystem": "1.27.0",
    "**/@theia/messages": "1.27.0",
    "**/@theia/monaco": "1.27.0"
  },
...
```

## Workflow Diagram Example

The workflow diagram is a consistent example provided by all GLSP components.
The example implements a simple flow chart diagram editor with different types of nodes and edges (see screenshot below).
The example can be used to try out different GLSP features, as well as several available integrations with IDE platforms (Theia, VSCode, Eclipse, Standalone).
It also offers different server connectivity possibilities such as socket or websocket connections.
See [our project website](https://www.eclipse.org/glsp/documentation/#workflowoverview) for an overview of the workflow example and all components implementing it.

> _**Remark:**_ The workflow example is a fully dev example, as it combines a variety of integration and connectivity options to easily test the different use cases. However, it should not be used as a blueprint for your custom implementation, for this we recommend the [GLSP project templates](https://github.com/eclipse-glsp/glsp-examples/tree/master/project-templates) in the GLSP example repository.

<https://user-images.githubusercontent.com/588090/154459938-849ca684-11b3-472c-8a59-98ea6cb0b4c1.mp4>

### How to start the Workflow Diagram example?

Clone this repository and build Theia-Integration packages:

```bash
yarn install
```

To build the browser application execute:

```bash
yarn browser build
```

Next, start the Theia application, and point your browser to [localhost:3000](http://localhost:3000):

```bash
yarn browser start
```

To build the Electron application execute:

```bash
yarn electron build
```

Then start the Electron application with:

```bash
yarn electron start
```

### How to start the Workflow Diagram example server from the sources

If you want to explore or change the Workflow Diagram Server too, you can clone, build and start the `workflow example glsp-server`
for [Java](https://github.com/eclipse-glsp/glsp-server#workflow-diagram-example) or [Node](https://github.com/eclipse-glsp/glsp-server#workflow-diagram-example) from your IDE instead of using the pre-built version of the Workflow Diagram Server.
Checkout the README of the [glsp-server](https://github.com/eclipse-glsp/glsp-server#how-to-start-the-workflow-diagram-example) or [glsp-server-node](https://github.com/eclipse-glsp/glsp-server-node#how-to-start-the-workflow-diagram-example) for instructions on building and running the Workflow Diagram Server example.

Once the Workflow Diagram Server is running, start the Theia application with the `debug` flag so that it'll connect to an existing server process -- the one you started from the command line or from your IDE before:

```bash
yarn browser start:debug

// or

yarn electron start:debug
```

### Start Workflow Diagram example in WebSocket mode

The default example use case uses a socket communication from the backend to the GLSP server.

To communicate with the server via WebSockets, there are two options available:

#### **1. Connect to GLSP server from Theia backend via WebSockets**

To connect to the example GLSP server in WebSocket mode from the backend, this can be achieved by passing the CLI argument `--WF_PATH=<path>`.
In the example the argument to be passed is `--WF_PATH=workflow`.

The example provides scripts and launch configs that pass this argument to test this connectivity option either in embedded or debug mode:

-   Embedded: Start a Node GLSP server in WebSocket mode along with the backend:

    -   VS Code Launch config: `Launch Workflow Browser Backend (WebSocket GLSP Server)`
    -   Script: `yarn browser start:ws` or `yarn electron start:ws`

-   Debug mode: Expects a running GLSP server (Java or Node) in WebSocket mode:
    -   VS Code Launch config: `Launch Workflow Browser Backend (External Websocket GLSP Server)`
    -   Script: `yarn browser start:ws:debug` or `yarn electron start:ws:debug`

#### **2. Connect directly to GLSP server from frontend via WebSockets**

This skips binding of the GLSP backend contribution if `--directWebSocket` argument is passed to the Theia backend.
The workflow diagram example frontend additionally expects an environment variable (e.g. `"WEBSOCKET_PORT=8081"`) to trigger the direct connection from the GLSP frontend client to the running GLSP WebSocket Server.
In this case, we do not have any GLSP backend contribution which means, the GLSP server instance is not started automatically, and needs either to be started manually or by some other party.

The workflow example provides a launch config that passes the argument sets the environment variable:

-   Debug mode: Expects a running GLSP server (Java or node.js) in WebSocket mode:
    -   VS Code Launch config: `Launch Theia Browser Backend (Direct WebSocket GLSP Server connection from frontend)`

### Start Workflow Diagram example without a dedicated server process

The default example use case uses a socket communication from the backend to a GLSP server process.
To directly start the server in the Theia backend without an extra process,this can be achieved by passing the CLI argument `--integratedNode`.
If this argument is passed, the node-based GLSP server will be integrated directly into Theia's backend.

The example provides scripts and launch configs that pass this argument to test this connectivity option:

-   VS Code Launch config: `Launch Workflow Browser Backend (Integrated Node GLSP Server)`
-   Script: `yarn browser start:integrated` or `yarn electron start:integrated`

> _**Remark:**_ In production, one would decide for one way of connectivity, and would not implement all the different options as we do in the workflow diagram example. This was setup to easily show and switch between the different possibilities.

### Where to find the sources?

In addition to this repository, the related source code can be found here:

-   <https://github.com/eclipse-glsp/glsp-server>
-   <https://github.com/eclipse-glsp/glsp-server-node>
-   <https://github.com/eclipse-glsp/glsp-client>

## More information

For more information, please visit the [Eclipse GLSP Umbrella repository](https://github.com/eclipse-glsp/glsp) and the [Eclipse GLSP Website](https://www.eclipse.org/glsp/).
If you have questions, please raise them in the [discussions](https://github.com/eclipse-glsp/glsp/discussions) and have a look at our [communication and support options](https://www.eclipse.org/glsp/contact/).
