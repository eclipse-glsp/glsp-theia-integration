# workflow-theia

This package contains the glue code to integrate the [GLSP Workflow example language](https://www.npmjs.com/package/@eclipse-glsp-examples/workflow-glsp) into a Theia applicatiopn.

This project is built with `yarn` and is available from npm via [@eclipse-glsp-examples/workflow-theia](https://www.npmjs.com/package/@eclipse-glsp-examples/workflow-theia).

## Theia Version Compatibility

The `@eclipse-glsp/workflow-theia` package in version `1.0.0` is currently compatible with Theia `>=1.25.0`.
Theia releases currently have no stable public API so new Theia versions might introduce API breaks.
If that is the case, a new compatible 1.0.0 version prefixed with the supported minimal Theia version will be released (e.g. `1.0.0-theia1.27.0` for Theia >= 1.27.0).

| @eclipse-glsp/theia-integration | Theia              |
| ------------------------------- | ------------------ |
| 0.8.0                           | <=1.4.0            |
| 0.9.0                           | >=1.20.0 <= 1.25.0 |
| 1.0.0                           | >=1.25.0 <= 1.26.0 |
| 1.0.0-theia1.27.0               | >=1.27.0           |
| next                            | >=1.27.0           |

> Note: Due to a transitive dependency to `sprotty-theia` it's currently not possible to safely restrict the maximum version of Theia packages. If you encounter build errors related to multiple resolved Theia versions please add a resolutions block to the `package.json` of your project e.g. for `1.0.0-theia1.27.0`:

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
