# Eclipse GLSP - Theia MCP Integration

This package provides the glue code to automatically register [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) servers announced by [GLSP](https://github.com/eclipse-glsp/glsp) diagram servers with [Eclipse Theia](https://github.com/theia-ide/theia)'s AI/MCP framework (`@theia/ai-mcp`).

When a GLSP server advertises an MCP server endpoint during initialization, this package discovers it and registers (and optionally auto-starts) the MCP server in the running Theia instance — making GLSP diagram tools available to Theia's AI agents without manual configuration.

This project is built with `yarn` and is available from npm via [@eclipse-glsp/theia-mcp-integration](https://www.npmjs.com/package/@eclipse-glsp/theia-mcp-integration).

## Theia Version Compatibility

| @eclipse-glsp/theia-mcp-integration | @eclipse-glsp/theia-integration | Theia     |
| ----------------------------------- | ------------------------------- | --------- |
| next                                | next                            | >= 1.66.0 |

> **Note:** This package requires Theia's AI/MCP support (`@theia/ai-mcp`), which is available starting with Theia 1.66.0.

## More information

For more information, please visit the [Eclipse GLSP Umbrella repository](https://github.com/eclipse-glsp/glsp) and the [Eclipse GLSP Website](https://www.eclipse.org/glsp/).
If you have questions, please raise them in the [discussions](https://github.com/eclipse-glsp/glsp/discussions) and have a look at our [communication and support options](https://www.eclipse.org/glsp/contact/).

![alt](https://www.eclipse.org/glsp/images/diagramanimated.gif)
