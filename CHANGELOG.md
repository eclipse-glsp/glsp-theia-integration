# Eclipse GLSP Theia Integration Changelog

## [1.1.0 - Upcoming]()

### Changes

-   [protocol] Updated to vscode-jsonrpc 8.0.2 to be compliant with client [#136](https://github.com/eclipse-glsp/glsp-theia-integration/pull/136)
-   [backend] Added support for using custom JVM args in `GLSPSocketServerContribution` [#125](https://github.com/eclipse-glsp/glsp-theia-integration/pull/125)
-   [diagram] Fixed a bug that prevented proper focus tracking when switching between tabs [#132](https://github.com/eclipse-glsp/glsp-theia-integration/pull/132)
-   [diagram] Fixed a bug that could cause dispatching of `SaveActions` even if the diagram is not dirty [#141](https://github.com/eclipse-glsp/glsp-theia-integration/pull/141) - Contributed on behalf of STMicroelectronics

### Breaking Changes

-   [theia] Updated Theia dependencies to `1.33.0`. Due to API breaks, Theia versions `<1.33.0` are no longer supported. [#119](https://github.com/eclipse-glsp/glsp-theia-integration/pull/119) - Contributed on behalf of STMicroelectronics <br>
    This also causes breaking changes in:
    -   `GlspServerContribution` (and inherited classes)
        -   `connect` method now takes a `Channel` instead of a `Connection` parameter
    -   `BaseGlspServerContribution` (and inherited classes)
        -   `forward` method now takes a `Channel` as first parameter instead of a `Connection`
-   [deps] Switch Theia extension dependencies to peer dependencies. These dependencies are no longer autoresolved and have to be declared
    in the application package. [#138](https://github.com/eclipse-glsp/glsp-theia-integration/pull/138) - Contributed on behalf of STMicroelectronics <br>
-   [API] Refactor `GLSPContribution` API [#146](https://github.com/eclipse-glsp/glsp-theia-integration/pull/146)<br>
    -   `GLSPClientContribution.waitForActivation` is now optional and is not implemented by default.
    -   `GLSPClientProviderImpl` has been renamed to `GLSPClientProvider`, function keys have been renamed has well
    -   Removed `GLSPContribution.Service` and dropped the related deprecated session concept.
-   [API] Removed dependency to sprotty-theia [#149](https://github.com/eclipse-glsp/glsp-theia-integration/pull/149)
    -   Modules from `sprotty-theia` are no longer reexported via the browser index.ts file
-   [diagram] Refactored `GLSPDiagramConfiguration`. Diagram containers are now child containers of the Theia DI container [#152](https://github.com/eclipse-glsp/glsp-theia-integration/pull/1525)
    -   `GLSPDiagramConfiguration`
        -   `doCreateContainer` method has been renamed to `configureContainer` and requires additional arguments.

## [1.0.0 - 30/06/2022](https://github.com/eclipse-glsp/glsp-theia-integration/releases/tag/v1.0.0)

### Changes

-   [navigation] Avoid changing the viewport twice when navigating to a diagram element. [#102](https://github.com/eclipse-glsp/glsp-theia-integration/pull/102)
-   [example] Improved and modernized styling of the GLSP workflow example [#103](https://github.com/eclipse-glsp/glsp-theia-integration/pull/103)
-   [diagram] Attached `mouseLeave` and `mouseEnter` listeners to the `GLSPDiagramWidget`. These listener add/remove corresponding css classes which can be used to apply custom styling dependent on the the relative mouse position. [#113](https://github.com/eclipse-glsp/glsp-theia-integration/pull/113/)
-   [build] Updated Typescript to version 4.5.5 and enforced `noImplicitOverride` [#110](https://github.com/eclipse-glsp/glsp-theia-integration/pull/110)

### Breaking Changes

-   [theia] Updated Theia dependencies to `>=1.25.0`. Due API breaks Theia version `<1.25.0` are no longer supported. [#105](https://github.com/eclipse-glsp/glsp-theia-integration/pull/105) [#111](https://github.com/eclipse-glsp/glsp-theia-integration/pull/111) [#116](https://github.com/eclipse-glsp/glsp-theia-integration/pull/116)
-   [protocol] Adapt to renamed `ModelSourceChangedAction` and handler [#117](https://github.com/eclipse-glsp/glsp-theia-integration/pull/117)
-   Refactored `JavaSocketServerContribution` to be able to both launching of Java and node processes. [#115](https://github.com/eclipse-glsp/glsp-theia-integration/pull/115)
    -   Renamed `JavaSocketServeContribution` -> `GLSPSocketServerContribution`
    -   `JavaSocketServerLaunchOptions`
        -   Renamed to `GLSPSocketServerContributionOptions`
        -   Renamed `jarPath` property to `executable`

## [v0.9.0- 09/12/2021](https://github.com/eclipse-glsp/glsp-theia-integration/releases/tag/v0.9.0)

### Changes

-   [backend] Added ability to launch embedded GLSP servers from `GLSPBackendContribution` [#55](https://github.com/eclipse-glsp/glsp-theia-integration/pull/55)
-   [feature] Replaced `ExternalNavigateToTargetHandler` and its implementation in Theia `TheiaNavigateToTargetHandler` with a generic action `NavigateToExternalTargetAction` [#57](https://github.com/eclipse-glsp/glsp-theia-integration/pull/57)
-   [diagram] Cleanup diagram widget initialization by removing no longer needed options [#60](https://github.com/eclipse-glsp/glsp-theia-integration/pull/60)
-   [diagram] Fixed a bug that prevented activation of the diagram widget on model source changes [#61](https://github.com/eclipse-glsp/glsp-theia-integration/pull/61)
-   [diagram] Fixed a bug that kept the hover feedback visible after the diagram widget becomes inactive [#64](https://github.com/eclipse-glsp/glsp-theia-integration/pull/64)
-   [di] Made rebind of `CommandPalette` to `TheiaCommandPalette` optional to ensure compatibility with DI configurations where no `CommandPalette` is bound [#65](https://github.com/eclipse-glsp/glsp-theia-integration/pull/65)
-   [build] Dropped the dependency to the deprecated `@theia/languages` package. [#66](https://github.com/eclipse-glsp/glsp-theia-integration/pull/66)
-   [protocol] Adapted `SetDirtyStateAction` to provide an optional `reason` property indicating the cause for the dirty state change [#67](https://github.com/eclipse-glsp/glsp-theia-integration/pull/67)
-   [feature] Introduced `GLSPSelectionDataService` which can be used to forward additional information on top of the selection to the Theia selection service. [#69](https://github.com/eclipse-glsp/glsp-theia-integration/pull/69)
-   [diagram] Fixed a bug that displayed the diagram widget as inactive when initially opened. [#75](https://github.com/eclipse-glsp/glsp-theia-integration/pull/75)
-   [all] Refactored the theia-integration code base to remove boilerplate configuration code. [#84](https://github.com/eclipse-glsp/glsp-theia-integration/pull/84)
-   [protocol] Adapt frontend components to conform to the latest [protocol changes](eclipse-glsp/glsp/issues/315). [#86](https://github.com/eclipse-glsp/glsp-theia-integration/pull/86)
-   Upgrade to Theia 1.17.2 and ES2017 [#90](https://github.com/eclipse-glsp/glsp-theia-integration/pull/90)

### Breaking Changes

-   [backend] Renamed `GLSPServerContribution.start()` to `GLSPServerContribution.connect()` [#35](https://github.com/eclipse-glsp/glsp-theia-integration/pull/55)
-   [feature] Replaced `ExternalNavigateToTargetHandler` and its implementation in Theia `TheiaNavigateToTargetHandler` with a generic action `NavigateToExternalTargetAction` [#153](https://github.com/eclipse-glsp/glsp-client/pull/95) and an action handler `TheiaNavigateToExternalTargetHandler` in Theia [#153](https://github.com/eclipse-glsp/glsp-theia-integration/pull/57)

-   [build] Dropped the dependency to the deprecated `@theia/languages` package. This enables compatibility with new Theia versions (>1.4.0). As a consequence the new minium requirement for `sprotty-theia` is > 0.9.0 [#189](https://github.com/eclipse-glsp/glsp-theia-integration/pull/66)
-   [all] Refactored the theia-integration code base to remove boilerplate configuration code. This effects the many components of the base API. More details can be found in the corresponding PR. [#258](https://github.com/eclipse-glsp/glsp-theia-integration/pull/84)
-   [protocol] Adapt frontend components to conform to the latest [protocol changes](eclipse-glsp/glsp/issues/315). This affects some action definitions. [#315](https://github.com/eclipse-glsp/glsp-theia-integration/pull/86)
-   Upgrade to Theia 1.17.2 and ES2017. Downstream projects need to upgrade to ES2017 as well [#90](https://github.com/eclipse-glsp/glsp-theia-integration/pull/90)

## [v0.8.0 - 20/10/2020](https://github.com/eclipse-glsp/glsp-theia-integration/releases/tag/0.8.0)

This is the first release of Eclipse GLSP since it is hosted at the Eclipse Foundation.
The 0.8.0 release includes new protocol message types and respective framework support for several new features, such as copy-paste, diagram navigation, etc. It also contains several clean-ups of the protocol and refactorings to simplify and streamline the API.
The Eclipse Theia integration of GLSP features many improvements, such as problem marker integration, native context menu items and keybindings. Finally, several bug fixes and minor are part of this release as well.
