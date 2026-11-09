# Eclipse GLSP - Theia Integration for GLSP Clients

This package contains the glue code necessary to integrate diagram editors built with the [graphical language server platform](https://github.com/eclipse-glsp/glsp) with [Eclipse Theia](https://github.com/theia-ide/theia).

This project is built with `pnpm` and is available from npm via [@eclipse-glsp/theia-integration](https://www.npmjs.com/package/@eclipse-glsp/theia-integration).

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
| 2.5.0                           | >= 1.64.0 < 1.65.0  |
| 2.5.0-theia1.65.0               | >= 1.64.0           |
| 2.6.0                           | >= 1.64.0           |
| 2.7.0                           | >= 1.66.0           |
| 2.8.0                           | >= 1.66.0           |
| next                            | >= 1.75.0           |

### Potential Compatibility Issues

- When using Theia versions `<= 1.55.1` you might encounter runtime issues related to inversify.
  Due to a loose version restriction Theia might pull in an incompatible version.
  To resolve this the inversify version need to be locked to `6.0.2`. (e.g. via [pnpm overrides](https://pnpm.io/package_json#pnpmoverrides) or [npm overrides](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#overrides))
- Issues with `node-abi` when using node < 22:
  Due to a dynamic dependency range an incompatible version of node-abi might get resolved when using node < 22.x.
  To resolve this the version needs to be locked to `^3.0.0`. (e.g. via [pnpm overrides](https://pnpm.io/package_json#pnpmoverrides) or [npm overrides](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#overrides))
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

- Theia `>= 1.77.0` ships its runtime packages as ES modules, so `@theia/core/shared/inversify` resolves inversify's ESM typings while the GLSP packages resolve the CommonJS ones.
  With `moduleResolution` set to `bundler`, `node16` or `nodenext`, passing the Theia-created diagram container to a GLSP container initializer fails to compile with `Types have separate declarations of a private property '_middleware'`.
  Both inversify entries are compatible at runtime (see [eclipse-glsp/glsp#1822](https://github.com/eclipse-glsp/glsp/issues/1822)).
    - With GLSP `< 2.9.0`, cast the container in your `GLSPDiagramConfiguration.configureContainer`:

        ```ts
        configureContainer(container: Container, ...containerConfiguration: ContainerConfiguration): Container {
            initializeMyDiagramContainer(container as unknown as Parameters<typeof initializeMyDiagramContainer>[0], ...containerConfiguration);
            return container;
        }
        ```

    - From GLSP `2.9.0`, `initializeContainer`, `initializeDiagramContainer` and `initializeWorkflowDiagramContainer` accept the structural `interfaces.Container`, so no cast is needed.
      If you wrap them in your own initializer, type its container parameter as `interfaces.Container` instead of `Container`.
      Other APIs that take a `Container`, such as `GLSPServerLauncher.parentContainer`, still need the cast.
    - With `moduleResolution: node`, the container types match, but some `@theia/core/shared/*` typings ship only as `index.d.cts` and cannot be resolved.
      Switch to `bundler` (or `node16`/`nodenext`) as recommended by the [Theia migration guide](https://github.com/eclipse-theia/theia/blob/master/doc/Migration.md#v1770); the notes above then apply.

## More information

For more information, please visit the [Eclipse GLSP Umbrella repository](https://github.com/eclipse-glsp/glsp) and the [Eclipse GLSP Website](https://www.eclipse.org/glsp/).
If you have questions, please raise them in the [discussions](https://github.com/eclipse-glsp/glsp/discussions) and have a look at our [communication and support options](https://www.eclipse.org/glsp/contact/).

![alt](https://www.eclipse.org/glsp/images/diagramanimated.gif)
