# Eclipse GLSP - Theia Integration for GLSP Clients [![build-status](https://img.shields.io/jenkins/build?jobUrl=https%3A%2F%2Fci.eclipse.org%2Fglsp%2Fjob%2Feclipse-glsp%2Fjob%2Fglsp-theia-integration%2Fjob%2Fmaster%2F)](https://ci.eclipse.org/glsp/job/eclipse-glsp/job/glsp-theia-integration/) [![build-status-server](https://img.shields.io/jenkins/build?jobUrl=https://ci.eclipse.org/glsp/job/deploy-npm-glsp-theia-integration/&label=publish)](https://ci.eclipse.org/glsp/job/deploy-npm-glsp-theia-integration/)

This project contains the glue code necessary to integrate diagram editors built with the [graphical language server platform](https://github.com/eclipse-glsp/glsp) with [Eclipse Theia](https://github.com/theia-ide/theia) as well as an example Theia application for testing purposes.

This project is built with `yarn` and is available from npm via [@eclipse-glsp/theia-integration](https://www.npmjs.com/package/@eclipse-glsp/theia-integration).

# Workflow Diagram Example
The workflow diagram is a consistent example provided by all GLSP components. The example implements a simple flow chart diagram editor with different types of nodes and edges (see screenshot below). The example can be used to try out different GLSP features, as well as several available integrations with IDE platforms (Theia, VSCode, Eclipse, Standalone).
As the example is fully open source, you can also use it as a blueprint for a custom implementation of a GLSP diagram editor.
See [our project website](https://www.eclipse.org/glsp/documentation/#workflowoverview) for an overview of the workflow example and all components implementing it.

![Workflow Diagram](https://www.eclipse.org/glsp/images/diagramanimated.gif)

## How to start the Workflow Diagram example?
First, you need to build the Theia-Integration packages:

```
yarn install
```

Next, download a pre-built version of the Workflow Diagram Server, start the Theia application, and point your browser to [localhost:3000/](http://localhost:3000):

```
yarn download:exampleServer
cd examples/browser-app
yarn start
```

If you want to explore or change the Workflow Diagram Server too, you can clone, build and start the server from your IDE instead of using the pre-built version of the Workflow Diagram Server. See [`glsp-server`](https://github.com/eclipse-glsp/glsp-server#building) for instructions on building the server.

Once both the Server and the Client packages are built, you can start both, the server and the client:

- Server: in `examples/org.eclipse.glsp.example.workflow`, start `org.eclipse.glsp.example.workflow.launch.WorkflowServerLauncher.java` (Or use the included Eclipse `Start_Workflow_Example_Server.launch` launch configuration if you are using Eclipse as an IDE).
- Client: Start the Theia application with the `debug` flag so that it'll connect to the server process you have started from your IDE:

```
cd examples/browser-app
yarn start:debug
```

## Where to find the sources?
In addition to this repository, the related source code can be found here:
- https://github.com/eclipse-glsp/glsp-server
- https://github.com/eclipse-glsp/glsp-client

# Building

For details on building the project, please see the [main README file](/packages/theia-integration/README.md).

# More information
For more information, please visit the [Eclipse GLSP Umbrella repository](https://github.com/eclipse-glsp/glsp) and the [Eclipse GLSP Website](https://www.eclipse.org/glsp/). If you have questions, contact us on our [spectrum chat](https://spectrum.chat/glsp/) and have a look at our [communication and support options](https://www.eclipse.org/glsp/contact/).

