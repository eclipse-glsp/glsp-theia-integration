# Eclipse GLSP Theia Integration Changelog

## [2.3.0- 23/12/2024](https://github.com/eclipse-glsp/glsp-theia-integration/releases/tag/v2.3.0)

### Changes

-   [deps] Drop support for node `16`. New minimum version is `18.x` [#238](https://github.com/eclipse-glsp/glsp-theia-integration/pull/238)

## [2.2.1- 22/07/2024](https://github.com/eclipse-glsp/glsp-theia-integration/releases/tag/v2.2.1)

### Changes

-   [rpc] Ensure that the GLSP client properly reconnects to the backend after a temporary connection loss [#197](https://github.com/eclipse-glsp/glsp-theia-integration/pull/197) [#203](https://github.com/eclipse-glsp/glsp-theia-integration/pull/203)
-   [diagram] Fix a bug that prevented proper disposal of the hidden diagram div after closing a diagram editor [#204](https://github.com/eclipse-glsp/glsp-theia-integration/pull/204)
-   [diagram] Improve `createDiagramWidgetFactory` utility function to also support factories for GLSPDiagramWidget subclasses [#211](https://github.com/eclipse-glsp/glsp-theia-integration/pull/211)
-   [diagram] Ensure that viewport restore on diagram open works generically indecently of how the diagram widget has been created [#218](https://github.com/eclipse-glsp/glsp-theia-integration/pull/218)

### Potentially Breaking Changes

-   [launch] Changed the `GLSPServerContributionOptions.debugArgument` from `debug` to `glspDebug` to avoid clashes with nodes `debug` argument. Launch configurations and scripts need to be updated accordingly [#211](https://github.com/eclipse-glsp/glsp-theia-integration/pull/211)
-   [diagram] Fix a bug in the `TheiaSelectionForwarder` when handling multiple diagrams [#227](https://github.com/eclipse-glsp/glsp-theia-integration/pull/227)
    -   This required a change in event handling. As a consequence the `shell` property has been removed. This might impact custom subclasses.

## [2.1.0- 24/01/2024](https://github.com/eclipse-glsp/glsp-theia-integration/releases/tag/v2.1.0)

### Changes

-   [diagram] Fixed a bug that prevented projection bars from being rendered correctly [#185](https://github.com/eclipse-glsp/glsp-theia-integration/pull/185)
-   [theia] Ensure that configuring multiple GLSP diagram languages does not breaking the inversify configuration [#190](https://github.com/eclipse-glsp/glsp-theia-integration/pull/190)

## [2.0.0- 14/10/2023](https://github.com/eclipse-glsp/glsp-theia-integration/releases/tag/v2.0.0)

### Changes

-   [protocol] Update to vscode-jsonrpc 8.0.2 to be compliant with client [#136](https://github.com/eclipse-glsp/glsp-theia-integration/pull/136)
-   [backend] Add support for using custom JVM args in `GLSPSocketServerContribution` [#125](https://github.com/eclipse-glsp/glsp-theia-integration/pull/125)
-   [diagram] Fix a bug that prevented proper focus tracking when switching between tabs [#132](https://github.com/eclipse-glsp/glsp-theia-integration/pull/132)
-   [diagram] Fix a bug that could cause dispatching of `SaveAction`s even if the diagram is not dirty [#141](https://github.com/eclipse-glsp/glsp-theia-integration/pull/141) - Contributed on behalf of STMicroelectronics
-   [backend] (Web)Socket based `GLSPServerContributions` now supports auto-assigned ports [#151](https://github.com/eclipse-glsp/glsp-theia-integration/pull/151)
-   [validation] Only keep live validation markers in problems view and clean all others [#153](https://github.com/eclipse-glsp/glsp-theia-integration/pull/153)
-   [backend] Provide `GLSPNodeServerContribution` to enable direct server integration into the Theia backed [#154](https://github.com/eclipse-glsp/glsp-theia-integration) - Contributed on behalf of STMicroelectronics
-   [theia] Add support for showing server progress in Theia [#168](https://github.com/eclipse-glsp/glsp-theia-integration/pull/168)
-   [websocket] Add support for Websocket communication to GLSP server from both the backend and the frontend directly [#155](https://github.com/eclipse-glsp/glsp-theia-integration/pull/155) [#159(https://github.com/eclipse-glsp/glsp-theia-integration/pull/159)] [#179](https://github.com/eclipse-glsp/glsp-theia-integration/pull/179)
-   [backend] Fix a bug that disconnected all Theia clients when closing a single one [#164](https://github.com/eclipse-glsp/glsp-theia-integration/pull/164)
-   [diagram] Add support for icons in context menu submenus [#180](https://github.com/eclipse-glsp/glsp-theia-integration/pull/180)

### Breaking Changes

-   [theia] Update Theia dependencies to `1.33.0`. Due to API breaks, Theia versions `<1.33.0` are no longer supported. [#119](https://github.com/eclipse-glsp/glsp-theia-integration/pull/119) - Contributed on behalf of STMicroelectronics <br>
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
-   [API] Remove dependency to sprotty-theia [#149](https://github.com/eclipse-glsp/glsp-theia-integration/pull/149)
    -   Modules from `sprotty-theia` are no longer reexported via the browser index.ts file
-   [diagram] Refactor `GLSPDiagramConfiguration`. Diagram containers are now child containers of the Theia DI container [#152](https://github.com/eclipse-glsp/glsp-theia-integration/pull/1525)
    -   `GLSPDiagramConfiguration`
        -   `doCreateContainer` method has been renamed to `configureContainer` and requires additional arguments.
-   [theia] BaseGLSPClientContribution: change `createGLSPClient(connectionProvider: ConnectionProvider)` to an async function [#155](https://github.com/eclipse-glsp/glsp-theia-integration/pull/155)
-   [deps] Update to inversify 6 and Typescript 5.x [#163](https://github.com/eclipse-glsp/glsp-theia-integration/pull/163)
    -   GLSP uses a synchronous inversify context this means with inversify 6.x decorator methods (e.g. @postConstruct) with asynchronous results are no longer supported
-   [API] Remove `TheiaGLSPConnector`. The diagram DI container is now a child container of the Theia main container and has direct access to all Theia services [#173](https://github.com/eclipse-glsp/glsp-theia-integration/pull/173)

    -   Refactor/rename `SavableGLSPModelSource` -> `GLSPSavable`
    -   Move export functionality from removed connector to `theiaExportModule`
    -   Encapsulate forwarding to Theia selection service in `theiaSelectionModule`
    -   Encapsulate source model changed handling in `theiaSourceModelWatcherModule`
    -   Moving handling of navigation targets into `theiaNavigationModule`
    -   Move server message & process handling from removed connector to `theiaNotificationModule`
    -   Remove `GLSPNotificationManager`
    -   Remove dedicated `ServerStatus` handling in `GLSPDiagramWidget` and use the new `statusModule` instead

-   [diagram] Refactor `GLSPDiagramWidget` and removed `dispatchInitialActions` method. [#176](https://github.com/eclipse-glsp/glsp-theia-integration/pull/176)
    -   To dispatch custom initial actions use the new `IDiagramStartup` service instead.
    -   Unify related multi-injection bindings and consistently use `ContributionProvider`s for them
        -   Remove `DiagramConfigurationRegistry`
        -   Remove `GLSPClientProvider`
        -   `GLSPDiagramWidget` now directly injects Theia services -> use `GLSPDiagramWidgetFactory` to for construction
-   [API] Rename `ServerStatusAction` -> `StatusAction` & `ServerMessageAction`->`MessageAction` [#178](https://github.com/eclipse-glsp/glsp-theia-integration/pull/178)

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
