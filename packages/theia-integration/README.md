# Eclipse GLSP - Theia Integration for GLSP Clients

This package contains the glue code necessary to integrate diagram editors built with the [graphical language server platform](https://github.com/eclipse-glsp/glsp) with [Eclipse Theia](https://github.com/theia-ide/theia).

This project is built with `yarn` and is available from npm via [@eclipse-glsp/theia-integration](https://www.npmjs.com/package/@eclipse-glsp/theia-integration).

## Theia Version Compatibility

| @eclipse-glsp/theia-integration | Theia               |
| ------------------------------- | ------------------- |
| 0.8.0                           | <= 1.4.0            |
| 0.9.0                           | >= 1.20.0 <= 1.25.0 |
| 1.0.0                           | >= 1.25.0 <= 1.26.0 |
| 1.0.0-theia1.27.0               | >= 1.27.0 < 1.34.0  |
| 1.0.0-theia1.34.0               | >= 1.34.0 < 1.39.0  |
| 2.0.0                           | >= 1.39.0 < 1.45.0  |
| 2.1.x                           | >= 1.39.0 < 1.45.0  |
| 2.1.0-theia1.45.0               | >= 1.45.0 < 1.49.0  |
| 2.1.1-theia1.49.0               | >= 1.49.0 < 1.56.0  |
| 2.2.x                           | >= 1.49.0 < 1.56.0  |
| 2.3.0                           | >= 1.56.0           |
| 2.4.0                           | >= 1.56.0 < 1.60.0  |
| 2.4.0-theia1.60.0               | >= 1.60.0 < 1.64.0  |
| next                            | >= 1.64.0           |

### Potential Compatibility Issues

- When using Theia versions `<= 1.55.1` you might encounter runtime issues related to inversify.
  Due to a loose version restriction Theia might pull in an incompatible version.
  To resolve this the inversify version need to be locked to `6.0.2`. (e.g. via [yarn resolutions](https://classic.yarnpkg.com/lang/en/docs/selective-version-resolutions/) or [npm overrides](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#overrides))
- Issues with `node-abi` when using node < 22:
  Due to a dynamic dependency range an incompatible version of node-abi might get resolved when using node < 22.x.
  To resolve this the version needs to be locked to `^3.0.0`. (e.g. via [yarn resolutions](https://classic.yarnpkg.com/lang/en/docs/selective-version-resolutions/) or [npm overrides](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#overrides))
- For `@eclipse-glsp/theia-integration` versions `<=1.0.0` it is not possible to safely restrict the maximum version of Theia packages. If you encounter build errors related to multiple resolved Theia versions please add a resolutions block to the `package.json` of your project e.g. for `1.0.0-theia1.27.0`:

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

## More information

For more information, please visit the [Eclipse GLSP Umbrella repository](https://github.com/eclipse-glsp/glsp) and the [Eclipse GLSP Website](https://www.eclipse.org/glsp/).
If you have questions, please raise them in the [discussions](https://github.com/eclipse-glsp/glsp/discussions) and have a look at our [communication and support options](https://www.eclipse.org/glsp/contact/).

![alt](https://www.eclipse.org/glsp/images/diagramanimated.gif)
