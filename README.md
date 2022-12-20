# Eclipse GLSP - Theia Integration for GLSP Clients [![Build Status](https://ci.eclipse.org/glsp/job/eclipse-glsp/job/glsp-theia-integration/job/master/badge/icon)](https://ci.eclipse.org/glsp/job/eclipse-glsp/job/glsp-theia-integration/job/master/)

This project contains the glue code necessary to integrate diagram editors built with the [graphical language server platform](https://github.com/eclipse-glsp/glsp) with [Eclipse Theia](https://github.com/theia-ide/theia) as well as an example Theia application for testing purposes.

This project is built with `yarn` and is available from npm via [@eclipse-glsp/theia-integration](https://www.npmjs.com/package/@eclipse-glsp/theia-integration).

For details on building the project, please see the [README file of the theia-integration package](/packages/theia-integration/README.md).

## Theia Version Compatibility

The `@eclipse-glsp/theia-integration` package in version `1.0.0` is currently compatible with Theia `>=1.25.0`.
Theia releases currently have no stable public API so new Theia versions might introduce API breaks.
If that is the case, a new compatible 1.0.0 version prefixed with the supported minimal Theia version will be released (e.g. `1.0.0-theia1.27.0` for Theia >= 1.27.0).

| @eclipse-glsp/theia-integration | Theia              |
| ------------------------------- | ------------------ |
| 0.8.0                           | <=1.4.0            |
| 0.9.0                           | >=1.20.0 <= 1.25.0 |
| 1.0.0                           | >=1.25.0 <= 1.26.0 |
| 1.0.0-theia1.27.0               | >=1.27.0           |
| next                            | >=1.33.0           |

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
As the example is fully open source, you can also use it as a blueprint for a custom implementation of a GLSP diagram editor.
See [our project website](https://www.eclipse.org/glsp/documentation/#workflowoverview) for an overview of the workflow example and all components implementing it.

https://user-images.githubusercontent.com/588090/154459938-849ca684-11b3-472c-8a59-98ea6cb0b4c1.mp4

### How to start the Workflow Diagram example?

Clone this repository and build Theia-Integration packages:

```bash
yarn install
```

Next, download a pre-built version of the Workflow Diagram Server, start the Theia application, and point your browser to [localhost:3000](http://localhost:3000):

```bash
yarn download:exampleServer
cd examples/browser-app
yarn start
```

### How to start the Workflow Diagram example server from the sources

If you want to explore or change the Workflow Diagram Server too, you can clone, build and start the [`workflow example glsp-server`](https://github.com/eclipse-glsp/glsp-server#workflow-diagram-example) from your IDE instead of using the pre-built version of the Workflow Diagram Server.
See [`workflow example glsp-server`](https://github.com/eclipse-glsp/glsp-server#workflow-diagram-example) for instructions on building and running the Workflow Diagram Server example.

Once the Workflow Diagram Server is running, start the Theia application with the `debug` flag so that it'll connect to an existing server process -- the one you started from the command line or from your IDE before:

```bash
cd examples/browser-app
yarn start:debug
```

### Where to find the sources?

In addition to this repository, the related source code can be found here:

-   <https://github.com/eclipse-glsp/glsp-server>
-   <https://github.com/eclipse-glsp/glsp-client>

## More information

For more information, please visit the [Eclipse GLSP Umbrella repository](https://github.com/eclipse-glsp/glsp) and the [Eclipse GLSP Website](https://www.eclipse.org/glsp/).
If you have questions, please raise them in the [discussions](https://github.com/eclipse-glsp/glsp/discussions) and have a look at our [communication and support options](https://www.eclipse.org/glsp/contact/).
